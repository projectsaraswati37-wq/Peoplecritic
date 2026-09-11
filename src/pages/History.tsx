import React from 'react';
import type { ScanRecord } from '../types/analysis';
import { clearScanHistory, downloadScanRecord } from '../utils/history';

interface HistoryProps {
  records: ScanRecord[];
  onBack: () => void;
  onOpen: (record: ScanRecord) => void;
  onClear: () => void;
}

const History: React.FC<HistoryProps> = ({ records, onBack, onOpen, onClear }) => (
  <div className="product-screen history-screen">
    <header className="product-header">
      <button className="ghost-button" onClick={onBack}>← Back</button>
      <div className="header-brand"><span className="brand-pulse" /> PEOPLECRITIQUE <b>AI</b></div>
      <span className="header-kicker">LOCAL ARCHIVE / {records.length.toString().padStart(2, '0')}</span>
    </header>
    <main className="history-content">
      <div className="page-heading">
        <div><p className="section-eyebrow">SIGNAL LIBRARY</p><h1>Scan history</h1><p>Private, local, and built for comparing your most questionable moments.</p></div>
        {records.length > 0 && <button className="text-button danger-text" onClick={() => { clearScanHistory(); onClear(); }}>Clear archive</button>}
      </div>
      {records.length === 0 ? (
        <div className="empty-state"><span className="empty-icon">◌</span><h2>Your archive is empty.</h2><p>Complete a scan and the result will appear here. Nothing leaves this device.</p><button className="primary-action" onClick={onBack}>RETURN HOME <span>↗</span></button></div>
      ) : (
        <div className="history-grid">
          {records.map((record) => (
            <article className="history-card" key={record.id}>
              <button className="history-image" onClick={() => onOpen(record)} aria-label={`Open ${record.id}`}>
                <img src={record.thumbnail} alt="Saved scan" />
                <span className="history-score">{record.analysis.overallScore.toFixed(1)}<small>/10</small></span>
              </button>
              <div className="history-card-body">
                <div className="history-card-top"><span>{record.analysis.rarity}</span><time>{new Date(record.createdAt).toLocaleDateString()}</time></div>
                <h2>{record.analysis.futureCareer}</h2><p>{record.analysis.verdict}</p>
                <div className="history-card-actions"><button className="text-button" onClick={() => onOpen(record)}>Open result ↗</button><button className="icon-button" title="Download scan JSON" onClick={() => downloadScanRecord(record)}>↓</button></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  </div>
);

export default History;
