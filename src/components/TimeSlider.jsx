import { useState, useEffect, useRef } from 'react';
import { formatDate } from '../utils/sentiment';

export default function TimeSlider({ timestamps, value, onChange }) {
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);
  const min = Math.min(...timestamps);
  const max = Math.max(...timestamps);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onChange(prev => {
          const next = prev + (max - min) / 150;
          if (next >= max) { setPlaying(false); return max; }
          return next;
        });
      }, 80);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, min, max]);

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
      padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16,
      zIndex: 900, minWidth: 460, fontFamily: "'DM Mono', monospace",
    }}>
      <button onClick={() => setPlaying(p => !p)} style={{
        background: playing ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${playing ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: playing ? '#a5b4fc' : '#94a3b8',
        cursor: 'pointer', borderRadius: 6, padding: '6px 16px',
        fontSize: '11px', fontFamily: 'inherit', letterSpacing: '0.06em',
        transition: 'all 0.15s',
      }}>
        {playing ? '⏸ PAUSE' : '▶ PLAY'}
      </button>

      <input
        type="range" min={min} max={max} step={(max - min) / 300}
        value={value} onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1 }}
      />

      <span style={{ color: '#64748b', fontSize: '11px', minWidth: 90, textAlign: 'right' }}>
        {formatDate(value)}
      </span>
    </div>
  );
}