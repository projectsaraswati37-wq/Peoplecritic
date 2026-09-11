import type { HumanAnalysis } from '../types/analysis';

export interface ParodyStat {
  label: string;
  value: number;
  color: string;
  explanation: string;
}

export interface HackathonIdea {
  name: string;
  problem: string;
  solution: string;
  usefulness: number;
  potential: number;
}

const ROASTS = [
  'നിങ്ങൾക്ക് നല്ല potential ഉണ്ട്. ഉപയോഗിക്കുന്നില്ല.',
  'ഈ scan ചെയ്യാൻ പോലും വലിയ കാരണം ഉണ്ടായിരുന്നില്ല.',
  'നാളെ മുതൽ എല്ലാം മാറും എന്ന് പറയുന്ന ആളാണ്.',
  'Confidence കണ്ടാൽ CEO. Calendar നോക്കിയാൽ Monday.',
  'AI നോക്കി. AI വീണ്ടും നോക്കി. കാര്യം ഇപ്പോഴും വ്യക്തമല്ല.',
];

const IDEAS: HackathonIdea[] = [
  {
    name: 'MOODSYNC AI',
    problem: 'Wi-Fi router-ന്റെ mood എന്താണെന്ന് ആരും അറിയുന്നില്ല.',
    solution: 'Router-നോട് ചോദിച്ച് blink ചെയ്യുന്ന light-നെ mood ആയി പ്രഖ്യാപിക്കുക.',
    usefulness: 2,
    potential: 100,
  },
  {
    name: 'PROCRASTI-NAV',
    problem: 'നാളെ ചെയ്യേണ്ട കാര്യങ്ങൾ ഇന്നും കൃത്യമായി postpone ചെയ്യണം.',
    solution: 'Task തുറക്കുന്നതിന് മുമ്പ് തന്നെ “5 മിനിറ്റിന് ശേഷം” button കാണിക്കുക.',
    usefulness: 1,
    potential: 98,
  },
  {
    name: 'BRO-O-METER',
    problem: 'ഒരു conversation-ൽ “bro” എത്ര തവണ പറഞ്ഞെന്ന് ആരും എണ്ണുന്നില്ല.',
    solution: 'ഓരോ bro-ക്കും ഒരു notification അയച്ച് achievement unlock ചെയ്യുക.',
    usefulness: 4,
    potential: 97,
  },
  {
    name: 'MEETING WEATHER',
    problem: 'Meeting boring ആകുമോ എന്ന് forecast ഇല്ല.',
    solution: 'Calendar നോക്കി boredom-ന് sunny, cloudy, അല്ലെങ്കിൽ escape warning നൽകുക.',
    usefulness: 3,
    potential: 99,
  },
];

export function getParodyStats(analysis: HumanAnalysis): ParodyStat[] {
  return [
    {
      label: 'മടിയുടെ അളവ്',
      value: Math.min(100, Math.max(0, Math.round((analysis.npcLevel + (100 - analysis.luck)) / 2))),
      color: '#ff8844',
      explanation: 'സത്യത്തിൽ ഒന്നിന്റെയും അടിസ്ഥാനത്തിൽ അല്ല. എന്നാലും ഈ percentage.',
    },
    {
      label: 'ഫോൺ നോക്കാനുള്ള സാധ്യത',
      value: Math.min(100, Math.max(0, Math.round(analysis.dripLevel * 0.55 + analysis.mainCharacterEnergy * 0.45))),
      color: '#7ee7e4',
      explanation: 'നിങ്ങൾ ഫോൺ നോക്കുകയാണെങ്കിൽ ഈ result ശരിയാണെന്ന് കരുതാം.',
    },
    {
      label: '“നാളെ ചെയ്യാം” സാധ്യത',
      value: Math.min(100, Math.max(0, Math.round(analysis.npcLevel * 0.7 + 20))),
      color: '#ccf27d',
      explanation: 'ഭാവിയിലുള്ള നിങ്ങളിൽ AI-ക്ക് അതിരില്ലാത്ത വിശ്വാസമുണ്ട്.',
    },
    {
      label: '“ബ്രോ” പറയാനുള്ള സാധ്യത',
      value: Math.min(100, Math.max(0, Math.round(analysis.mainCharacterEnergy * 0.5 + analysis.luck * 0.2 + 45))),
      color: '#aa88ff',
      explanation: 'ഇത് തെളിയിക്കാൻ ഒരു conversation പോലും നോക്കിയിട്ടില്ല.',
    },
  ];
}

export function getRoast(index: number): string {
  return ROASTS[index % ROASTS.length];
}

export function getHackathonIdea(index: number): HackathonIdea {
  return IDEAS[index % IDEAS.length];
}

export function getUselessness(analysis: HumanAnalysis): number {
  return Math.min(99, Math.max(72, Math.round(analysis.npcLevel * 0.18 + analysis.dripLevel * 0.2 + 68)));
}
