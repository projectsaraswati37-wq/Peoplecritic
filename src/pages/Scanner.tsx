import React, { useEffect, useRef, useState } from 'react';
import CameraScanner from '../components/CameraScanner';
import ScanAnimation from '../components/ScanAnimation';
import { speechService } from '../utils/speech';

type ScannerPhase = 'CAMERA' | 'SCANNING';

interface ScannerProps {
  voiceEnabled: boolean;
  onCaptureDone: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ voiceEnabled, onCaptureDone, onCancel }) => {
  const [phase, setPhase] = useState<ScannerPhase>('CAMERA');
  const [capturedImage, setCapturedImage] = useState<string>('');

  // Guard: prevent the init greeting from firing more than once per mount.
  const initSpokenRef = useRef(false);
  // Track all scan-phase timers so we can cancel them if the component unmounts early.
  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!initSpokenRef.current && voiceEnabled && speechService.isSupported()) {
      initSpokenRef.current = true;
      speechService.speak(
        'സ്കാനർ തയ്യാറായി. ഫ്രെയിമിനുള്ളിൽ നിങ്ങളുടെ മുഖം ശരിയായി വയ്ക്കുക.',
        { language: 'ml-IN', rate: 0.92, pitch: 1 }
      );
    }

    return () => {
      // Cancel every pending scan-phase timer on unmount.
      scanTimersRef.current.forEach(clearTimeout);
      scanTimersRef.current = [];
      // Stop any in-progress speech so it doesn't bleed into the next screen.
      speechService.stop();
    };
  }, []); // run exactly once on mount

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setPhase('SCANNING');

    if (voiceEnabled && speechService.isSupported()) {
      // Stop the init greeting if it's still talking, then queue the scan lines.
      speechService.stop();

      const scanLines = [
        'മുഖം കണ്ടെത്തി.',
        'വിശദമായ വിശകലനം ആരംഭിക്കുന്നു.',
        'മുഖത്തിന്റെ ഘടന പരിശോധിക്കുന്നു.',
        'ഓറ ലെവൽ കണക്കാക്കുന്നു.',
        'മെയിൻ ക്യാരക്ടർ എനർജി പരിശോധിക്കുന്നു.',
        'എൻ പി സി സാധ്യത പരിശോധിക്കുന്നു.',
        'ഭാവിയിലെ കരിയർ സാധ്യത പരിശോധിക്കുന്നു.',
      ];

      // Use the speech queue directly rather than raw setTimeouts so lines don't
      // double-fire if the component re-renders while a timer is pending.
      const speakScanSequence = async () => {
        for (let i = 0; i < scanLines.length; i++) {
          await speechService.speak(scanLines[i], { language: 'ml-IN', rate: 0.92, pitch: 1 });
          if (i === scanLines.length - 2) {
            await speechService.speak('അത് രസകരമാണ്.', { language: 'ml-IN', rate: 0.92, pitch: 1 });
          }
        }
        await speechService.speak('ഭാവി പ്രവചനം ലഭ്യമല്ല.', { language: 'ml-IN', rate: 0.92, pitch: 1 });
      };

      speakScanSequence();
    }
  };

  const handleScanComplete = () => {
    // Cancel any leftover scan timers before handing control to the results screen.
    scanTimersRef.current.forEach(clearTimeout);
    scanTimersRef.current = [];
    onCaptureDone(capturedImage);
  };

  if (phase === 'CAMERA') {
    return (
      <CameraScanner
        onCapture={handleCapture}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ScanAnimation
      imageDataUrl={capturedImage}
      onComplete={handleScanComplete}
    />
  );
};

export default Scanner;
