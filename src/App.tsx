import React, { useState, useCallback } from 'react';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import AnalysisResults from './components/AnalysisResults';
import CriticCompanion from './components/CriticCompanion';
import History from './pages/History';
import type { HumanAnalysis, AppScreen, ScanRecord } from './types/analysis';
import { generateHumanAnalysis } from './utils/analysisGenerator';
import { analyzeWithGemini } from './utils/gemini';
import { loadScanHistory, saveScanRecord } from './utils/history';
import { speechService } from './utils/speech';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('HOME');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [analysis, setAnalysis] = useState<HumanAnalysis | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [history, setHistory] = useState<ScanRecord[]>(() => loadScanHistory());

  const handleVoiceToggle = useCallback(() => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    speechService.setEnabled(next);
    if (!next) speechService.stop();
  }, [voiceEnabled]);

  const handleStart = useCallback((demo = false) => {
    setDemoMode(demo);
    speechService.stop();
    setScreen('CAMERA');
  }, []);

  const handleCaptureDone = useCallback(async (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    const nextScanNumber = scanCount + 1;
    const result = demoMode
      ? generateHumanAnalysis(true)
      : await analyzeWithGemini(imageDataUrl, nextScanNumber).catch(() => null) ?? generateHumanAnalysis(false);
    setAnalysis(result);
    setHistory(saveScanRecord(result, imageDataUrl));
    setScanCount((c) => c + 1);
    setScreen('RESULTS');
  }, [demoMode, scanCount]);

  const handleScanAgain = useCallback(() => {
    speechService.stop();
    setAnalysis(null);
    setCapturedImage('');
    setScreen('CAMERA');
  }, []);

  const handleHome = useCallback(() => {
    speechService.stop();
    setAnalysis(null);
    setCapturedImage('');
    setScreen('HOME');
  }, []);

  const handleCancel = useCallback(() => {
    speechService.stop();
    setScreen('HOME');
  }, []);

  const handleOpenHistory = useCallback(() => {
    speechService.stop();
    setScreen('HISTORY');
  }, []);

  const handleOpenRecord = useCallback((record: ScanRecord) => {
    speechService.stop();
    setAnalysis(record.analysis);
    setCapturedImage(record.thumbnail);
    setScreen('RESULTS');
  }, []);

  return (
    <div className="min-h-screen bg-cyber-bg">
      {screen === 'HOME' && (
        <Home
          voiceEnabled={voiceEnabled}
          onVoiceToggle={handleVoiceToggle}
          onStart={handleStart}
          scanCount={scanCount}
            onHistory={handleOpenHistory}
        />
      )}
      {(screen === 'CAMERA' || screen === 'SCANNING') && (
        <div className="operational-shell">
          <Scanner
            voiceEnabled={voiceEnabled}
            onCaptureDone={handleCaptureDone}
            onCancel={handleCancel}
          />
          <CriticCompanion context={screen === 'SCANNING' ? 'scanning' : 'camera'} />
        </div>
      )}
      {screen === 'RESULTS' && analysis && (
        <AnalysisResults
          analysis={analysis}
          imageDataUrl={capturedImage}
          voiceEnabled={voiceEnabled}
          onVoiceToggle={handleVoiceToggle}
          onScanAgain={handleScanAgain}
          onHome={handleHome}
          onHistory={handleOpenHistory}
        />
      )}
      {screen === 'RESULTS' && analysis && <CriticCompanion context="results" verdict={analysis.verdict} />}
      {screen === 'HISTORY' && (
        <History
          records={history}
          onBack={handleHome}
          onOpen={handleOpenRecord}
          onClear={() => setHistory([])}
        />
      )}
    </div>
  );
};

export default App;
