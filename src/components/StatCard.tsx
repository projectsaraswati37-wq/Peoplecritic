import React, { useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  type?: 'percent' | 'number' | 'text' | 'score';
  color?: string;
  animateFrom?: number;
  delay?: number;
  rarity?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit = '',
  type = 'percent',
  color = '#00d4ff',
  animateFrom = 0,
  delay = 0,
  rarity,
}) => {
  const [displayed, setDisplayed] = useState<number | string>(
    typeof value === 'number' ? animateFrom : value
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(showTimer);
  }, [delay]);

  useEffect(() => {
    if (!visible || typeof value !== 'number') {
      setDisplayed(value);
      return;
    }
    const from = animateFrom;
    const to = value;
    const duration = 1200;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplayed(type === 'score' ? parseFloat(current.toFixed(1)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [visible, value, animateFrom, type]);

  if (!visible) return null;

  const isLegendary = rarity === 'LEGENDARY';
  const borderColor = isLegendary ? '#ff8800' : color;
  const barPercent =
    type === 'percent' && typeof value === 'number'
      ? Math.min(100, Math.max(0, value))
      : type === 'score' && typeof value === 'number'
      ? (value / 10) * 100
      : null;

  const displayStr =
    typeof displayed === 'number'
      ? type === 'score'
        ? `${(displayed as number).toFixed(1)}${unit}`
        : `${displayed}${unit}`
      : String(displayed);

  return (
    <div
      className="rounded-xl border p-4 fade-in-up transition-all duration-300"
      style={{
        borderColor: `${borderColor}44`,
        background: isLegendary
          ? 'rgba(255,136,0,0.06)'
          : 'rgba(0,20,40,0.7)',
        boxShadow: isLegendary ? `0 0 20px rgba(255,136,0,0.2)` : undefined,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: `${borderColor}cc` }}
        >
          {label}
        </span>
        {rarity && rarity !== 'COMMON' && (
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              background: isLegendary ? 'rgba(255,136,0,0.2)' : 'rgba(0,212,255,0.1)',
              color: isLegendary ? '#ff8800' : '#00d4ff',
              border: `1px solid ${isLegendary ? '#ff8800' : '#00d4ff'}44`,
            }}
          >
            {rarity}
          </span>
        )}
      </div>

      <div
        className="font-mono font-bold mb-3"
        style={{
          fontSize: type === 'text' ? '1rem' : '1.5rem',
          color: isLegendary ? '#ff8800' : color,
          textShadow: `0 0 12px ${color}66`,
          wordBreak: 'break-word',
        }}
      >
        {displayStr === 'Infinity' || value === Infinity ? '∞' : displayStr}
      </div>

      {barPercent !== null && (
        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: '#0a1628' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${barPercent}%`,
              background: isLegendary
                ? 'linear-gradient(90deg, #ff8800, #ffcc00)'
                : `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 6px ${color}88`,
              transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StatCard;
