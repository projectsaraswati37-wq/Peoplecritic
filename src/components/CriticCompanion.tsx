import React, { useEffect, useRef, useState } from 'react';
import { speechService } from '../utils/speech';

type RecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

const OPENERS = [
  'ഞാൻ കേൾക്കുന്നുണ്ട്. ഇത് കുറച്ചെങ്കിലും രസകരമാക്കാൻ ശ്രമിക്കൂ.',
  'തുടരൂ. നിങ്ങളുടെ പോസ്ചർ ഞാൻ ഇതിനകം വിലയിരുത്തി.',
  'എന്റെ പൂർണ്ണ ശ്രദ്ധ നിങ്ങൾക്ക് ലഭിച്ചിരിക്കുന്നു. താൽക്കാലികമായി.',
  'വ്യക്തമായി സംസാരിക്കൂ. ഞാൻ പ്രീമിയം ചിന്തകൾ മാത്രമേ പ്രോസസ് ചെയ്യൂ.',
];

function comeback(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!text.trim()) return 'അത് വളരെ ആഴമുള്ള ചിന്തയായിരിക്കാം, അല്ലെങ്കിൽ പൂർണ്ണ നിശ്ശബ്ദത. രണ്ടാമത്തേതാണ് എനിക്ക് ഇഷ്ടം.';
  if (words > 12) return 'അതിശയകരമായി നീണ്ട ചിന്ത. ശ്രമത്തിന് ഒരു പോയിന്റ് നൽകുന്നു.';
  if (/hello|hi|hey|നമസ്കാരം|ഹലോ/i.test(text)) return 'നമസ്കാരം. ഈ ഇന്റർഫേസിലെ ഏക വ്യക്തിത്വത്തെ നിങ്ങൾ കണ്ടെത്തി.';
  if (/scan|face|look|rate/i.test(text)) return 'ഒടുവിൽ, സത്യസന്ധമായ വിലയിരുത്തൽ ആവശ്യപ്പെടാനുള്ള ധൈര്യമുള്ള ഒരാൾ.';
  return 'ശ്രദ്ധയിൽപ്പെടുത്തി. നിങ്ങളുടെ ആത്മവിശ്വാസത്തോട് യോജിപ്പില്ല, പക്ഷേ ശ്രമത്തെ ബഹുമാനിക്കുന്നു.';
}

interface CriticCompanionProps {
  context?: 'camera' | 'scanning' | 'results';
  verdict?: string;
}

const CONTEXT_OPENERS = {
  camera: 'അനങ്ങാതെ നിൽക്കൂ. വിശകലനം ചെയ്യാൻ യോഗ്യമായ ഒരു മുഖത്തിനായി ഞാൻ നോക്കുകയാണ്.',
  scanning: 'മെഷീൻ ചിന്തിക്കുകയാണ്. ഈ തീരുമാനത്തിൽ അതിന് പശ്ചാത്തപിക്കേണ്ടി വരാതിരിക്കാൻ ശ്രമിക്കൂ.',
  results: 'വിധി വന്നുകഴിഞ്ഞു. തയ്യാറാകൂ എന്ന് പറയുമായിരുന്നു, പക്ഷേ ഇപ്പോൾ വൈകിയിരിക്കാം.',
};

const CriticCompanion: React.FC<CriticCompanionProps> = ({ context = 'camera' }) => {
  const [message, setMessage] = useState(CONTEXT_OPENERS[context]);
  const [listening, setListening] = useState(false);
  const [mood, setMood] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const recognitionRef = useRef<Recognition | null>(null);
  const speechSessionRef = useRef(0);

  useEffect(() => {
    speechSessionRef.current += 1;
    recognitionRef.current?.stop();
    setListening(false);
    setMood('idle');
    setMessage(CONTEXT_OPENERS[context]);
    return () => {
      speechSessionRef.current += 1;
      recognitionRef.current?.stop();
      speechService.stop();
    };
  }, [context]);

  const speak = (text: string) => {
    const session = ++speechSessionRef.current;
    recognitionRef.current?.stop();
    setListening(false);
    speechService.stop();
    setMessage(text);
    setMood('speaking');
    speechService.speak(text, { language: 'ml-IN', rate: 0.98, pitch: 1.05 }).finally(() => {
      if (speechSessionRef.current === session) setMood('idle');
    });
  };

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      speak('നിങ്ങളുടെ ബ്രൗസറിന് എന്നെ കേൾക്കാൻ കഴിയില്ല. സത്യത്തിൽ, ദുഃഖകരമായ പരിമിതിയാണ്.');
      return;
    }
    const session = ++speechSessionRef.current;
    speechService.stop();
    const recognition = new Recognition();
    recognition.lang = 'ml-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? '';
      if (speechSessionRef.current !== session) return;
      setListening(false);
      speak(comeback(heard));
    };
    recognition.onerror = () => {
      if (speechSessionRef.current !== session) return;
      setListening(false);
      speak('എനിക്ക് ഒന്നും കേൾക്കാനായില്ല. നിശ്ശബ്ദതയ്ക്ക് പോലും അതിനേക്കാൾ മികച്ച അവതരണമുണ്ട്.');
    };
    recognition.onend = () => {
      if (speechSessionRef.current === session) {
        setListening(false);
        setMood('idle');
      }
    };
    recognitionRef.current = recognition;
    setListening(true);
    setMood('listening');
    setMessage('ഞാൻ കേൾക്കുന്നുണ്ട്... എന്നെ അത്ഭുതപ്പെടുത്തൂ.');
    recognition.start();
  };

  const handleClick = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    if (mood === 'idle') speak(context === 'results' ? CONTEXT_OPENERS.results : OPENERS[Math.floor(Math.random() * OPENERS.length)]);
    else startListening();
  };

  return (
    <aside className={`critic-companion companion-${mood}`}>
      <button className="companion-face" onClick={handleClick} aria-label="Talk to the AI critic">
        <span className="companion-glow" />
        <span className="companion-eyes"><i /><i /></span>
        <span className="companion-mouth">{mood === 'speaking' ? '◡' : mood === 'listening' ? 'O' : '⌣'}</span>
      </button>
      <div className="companion-copy">
        <div className="companion-name">MIRA <span>AI CRITIC</span></div>
        <p>{message}</p>
        <button className="companion-listen" onClick={startListening}>{listening ? 'STOP LISTENING' : 'TALK BACK ↗'}</button>
      </div>
    </aside>
  );
};

export default CriticCompanion;
