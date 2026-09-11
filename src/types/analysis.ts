export type ThreatLevel =
  | 'COMPLETELY HARMLESS'
  | 'MILDLY CONCERNING'
  | 'EMOTIONALLY HARMLESS'
  | 'LEGALLY AMBIGUOUS'
  | 'SUSPICIOUS VIBES'
  | 'CHAOTIC NEUTRAL'
  | 'DANGER: OPINIONS'
  | 'THREAT LEVEL: VIBES';

export type RarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';

export interface HumanAnalysis {
  id: string;
  scanNumber: number;
  timestamp: Date;

  // Core stats (7 displayed stats)
  npcLevel: number;           // 0-100
  aura: number;               // can be negative or very large
  mainCharacterEnergy: number; // 0-100
  dripLevel: number;          // 0-100
  luck: number;               // can be negative
  sideCharacterEnergy: number; // 0-100

  // Special fields
  threatLevel: ThreatLevel;
  futureCareer: string;
  verdict: string;
  overallScore: number; // 0-10

  // Rarity
  rarity: RarityTier;
  legendaryEvent?: string;

  // Demo mode flag
  isDemoMode?: boolean;
}

export interface ScanDiagnosticMessage {
  text: string;
  delay: number; // ms from start
}

export type AppScreen = 'HOME' | 'CAMERA' | 'SCANNING' | 'RESULTS';
