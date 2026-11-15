import { formatDate, truncate } from '../utils/sentiment';

const SENTIMENT_META = {
  positive: { emoji: '🟢', color: '#34d399' },
  negative: { emoji: '🔴', color: '#fb7185' },
  neutral:  { emoji: '⚪', color: '#94a3b8' },
};

export default function SidePanel({ post, onClose }) {
  if (!post) return null;
  const meta = SENTIMENT_META[post.sentiment_label?.toLowerCase()] || SENTIMENT_META.neutral;
  const score = parseFloat(post.sentiment_score) || 0;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh',
      background: 'rgba(6,6,12,0.98)', backdropFilter: 'blur(24px)',
      borderLeft: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
      color: '#e2e8f0', fontFamily: "'DM Mono', monospace",
      overflowY: 'auto', zIndex: 1000, padding: '36px 28px',
      animation: 'slideIn 0.22s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(32px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 20,
        background: 'none', border: '1px solid rgba(255,255,255,0.12)',
        color: '#64748b', cursor: 'pointer', borderRadius: '4px',
        padding: '4px 10px', fontSize: '11px', fontFamily: 'inherit',
      }}>ESC</button>

      <div style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.1em', marginBottom: 8 }}>
        r/{post.subreddit} · {formatDate(post.created_utc)}
      </div>

      <h2 style={{ fontSize: '16px', fontWeight: 500, lineHeight: 1.5, marginBottom: 20, color: '#f1f5f9' }}>
        {post.title}
      </h2>

      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: 8,
        padding: '14px 16px', marginBottom: 20, fontSize: '13px',
        lineHeight: 1.9, color: '#94a3b8', borderLeft: '2px solid rgba(255,255,255,0.07)'
      }}>
        {truncate(post.selftext, 400) || '(No body text)'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'UPVOTES',   value: post.score },
          { label: 'COMMENTS',  value: post.num_comments },
          { label: 'SENTIMENT', value: `${meta.emoji} ${post.sentiment_label}` },
          { label: 'INTENSITY', value: score.toFixed(3) },
          { label: 'PLACE',     value: post.detected_place },
          { label: 'BOROUGH',   value: post.borough },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 14px'
          }}>
            <div style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.12em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#cbd5e1' }}>{value || '—'}</div>
          </div>
        ))}
      </div>

      {/* Sentiment bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '9px', color: '#475569', letterSpacing: '0.12em', marginBottom: 8 }}>
          SENTIMENT INTENSITY
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${Math.abs(score) * 100}%`,
            background: score >= 0 ? '#34d399' : '#fb7185',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: '9px', color: '#334155' }}>0</span>
          <span style={{ fontSize: '9px', color: '#334155' }}>1.0</span>
        </div>
      </div>

      {post.url && (
        <a href={post.url} target="_blank" rel="noreferrer" style={{
          display: 'block', textAlign: 'center', padding: '12px',
          borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)',
          color: '#475569', fontSize: '11px', textDecoration: 'none',
          fontFamily: 'inherit', letterSpacing: '0.06em',
        }}>VIEW ON REDDIT ↗</a>
      )}
    </div>
  );
}