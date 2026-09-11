import type { HumanAnalysis, RarityTier, ThreatLevel } from '../types/analysis';

const THREAT_LEVELS: ThreatLevel[] = [
  'COMPLETELY HARMLESS', 'MILDLY CONCERNING', 'EMOTIONALLY HARMLESS',
  'LEGALLY AMBIGUOUS', 'SUSPICIOUS VIBES', 'CHAOTIC NEUTRAL',
  'DANGER: OPINIONS', 'THREAT LEVEL: VIBES',
];
const RARITIES: RarityTier[] = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'];

type GeminiPayload = Partial<Omit<HumanAnalysis, 'timestamp'>> & {
  threatLevel?: string;
  rarity?: string;
};

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export async function analyzeWithGemini(imageDataUrl: string, scanNumber: number): Promise<HumanAnalysis> {
  if (!imageDataUrl?.startsWith('data:image/')) {
    throw new Error('PHOTO INVALID: Please capture a photo before analysis.');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageDataUrl }),
  });
  if (!response.ok) {
    let message = 'AI analysis failed. Please try again.';
    try {
      const error = await response.json() as { error?: string };
      if (error.error) message = error.error;
    } catch {
      // Keep the user-facing fallback message when the server returns non-JSON.
    }
    throw new Error(message);
  }

  const payload = await response.json() as GeminiPayload;
  const threatLevel = THREAT_LEVELS.includes(payload.threatLevel as ThreatLevel)
    ? payload.threatLevel as ThreatLevel
    : 'THREAT LEVEL: VIBES';
  const rarity = RARITIES.includes(payload.rarity as RarityTier)
    ? payload.rarity as RarityTier
    : 'COMMON';

  return {
    id: `GEM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    scanNumber,
    timestamp: new Date(),
    source: 'AI',
    npcLevel: clamp(payload.npcLevel, 0, 100, 50),
    aura: clamp(payload.aura, -200, 1500, 100),
    mainCharacterEnergy: clamp(payload.mainCharacterEnergy, 0, 100, 50),
    dripLevel: clamp(payload.dripLevel, 0, 100, 50),
    luck: clamp(payload.luck, -50, 100, 0),
    sideCharacterEnergy: clamp(payload.sideCharacterEnergy, 0, 100, 50),
    threatLevel,
    futureCareer: typeof payload.futureCareer === 'string' ? payload.futureCareer : 'Career Loading...',
    verdict: typeof payload.verdict === 'string' ? payload.verdict : 'Analysis complete. The vibes remain mysterious.',
    overallScore: clamp(payload.overallScore, 0, 10, 5),
    rarity,
    legendaryEvent: typeof payload.legendaryEvent === 'string' ? payload.legendaryEvent : undefined,
  };
}
