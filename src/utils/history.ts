import type { HumanAnalysis, PoseSnapshot, ScanRecord } from '../types/analysis';

const STORAGE_KEY = 'peoplecritique.scan-history.v1';
const MAX_RECORDS = 12;

export function loadScanHistory(): ScanRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as ScanRecord[];
    return Array.isArray(value) ? value.slice(0, MAX_RECORDS) : [];
  } catch {
    return [];
  }
}

export function saveScanRecord(analysis: HumanAnalysis, thumbnail: string, pose?: PoseSnapshot): ScanRecord[] {
  const record: ScanRecord = {
    id: analysis.id,
    createdAt: analysis.timestamp.toISOString(),
    analysis,
    thumbnail,
    pose,
  };
  const next = [record, ...loadScanHistory().filter((item) => item.id !== record.id)].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearScanHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadScanRecord(record: ScanRecord) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.id.toLowerCase()}-peoplecritique.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareScanRecord(record: ScanRecord): Promise<boolean> {
  if (!navigator.share) return false;
  await navigator.share({
    title: 'My PeopleCritique result',
    text: `${record.analysis.verdict} Score: ${record.analysis.overallScore}/10`,
  });
  return true;
}