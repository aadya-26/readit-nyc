import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import Map, { NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Papa from 'papaparse';
import SidePanel from './components/SidePanel';
import TimeSlider from './components/TimeSlider';
import { scoreToColor, scoreToRadius, jitter, truncate } from './utils/sentiment';

const CARTO_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW = {
  longitude: -73.971,
  latitude: 40.745,
  zoom: 11.2,
  pitch: 45,
  bearing: -8,
};

const SENTIMENT_FILTERS = ['all', 'positive', 'neutral', 'negative'];

function getElevation(r) {
  const score = Math.abs(parseFloat(r.sentiment_score) || 0);
  const engagement = Math.sqrt((r.score || 1) + (r.num_comments || 0));
  return Math.max(80, score * 1200 + engagement * 15);
}

function getSphereSize(r) {
  const engagement = Math.sqrt((r.score || 1) + (r.num_comments || 0));
  return Math.max(60, Math.min(engagement * 8, 220));
}

export default function App() {
  const [data, setData]             = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [timeValue, setTimeValue]   = useState(0);
  const [hovered, setHovered]       = useState(null);
  const [selected, setSelected]     = useState(null);
  const [sentiment, setSentiment]   = useState('all');
  const [borough, setBorough]       = useState('all');
  const [boroughs, setBoroughs]     = useState([]);
  const [pulse, setPulse]           = useState(0);

  useEffect(() => {
    Papa.parse(`${import.meta.env.BASE_URL}data/reddit_posts_clean.csv`, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: ({ data: rows }) => {
        const clean = rows.filter(r => r.lat && r.lon && r.created_utc);
        setData(clean);
        const ts = clean.map(r => r.created_utc).filter(Boolean);
        if (ts.length) {
          setTimestamps(ts);
          setTimeValue(Math.min(...ts));
        }
        const unique = [...new Set(clean.map(r => r.borough).filter(Boolean))].sort();
        setBoroughs(unique);
      },
    });
  }, []);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const animate = (now) => {
      setPulse((Math.sin((now - start) / 900) + 1) / 2);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const filtered = data.filter(r => {
    const tsOk = r.created_utc <= timeValue;
    const sOk  = sentiment === 'all' || r.sentiment_label?.toLowerCase() === sentiment;
    const bOk  = borough === 'all' || r.borough === borough;
    return tsOk && sOk && bOk;
  });

  const layers = [
    new ScatterplotLayer({
      id: 'anchor-dots',
      data: filtered,
      getPosition: r => [jitter(r.lon, r.created_utc), jitter(r.lat, r.created_utc + 1), 0],
      getRadius: 18,
      getFillColor: r => {
        const c = scoreToColor(parseFloat(r.sentiment_score) || 0);
        return [c[0], c[1], c[2], 180];
      },
      radiusUnits: 'meters',
      pickable: false,
    }),

    new ScenegraphLayer({
        id: 'spheres',
        data: filtered,
        scenegraph: `${import.meta.env.BASE_URL}sphere.glb`,
        getPosition: r => [jitter(r.lon, r.created_utc), jitter(r.lat, r.created_utc + 1), getElevation(r)],
        getOrientation: [0, 0, 90],
        getScale: r => {
            const s = getSphereSize(r) * (1 + pulse * 0.08);
            return [s, s, s];
        },
        getColor: r => scoreToColor(parseFloat(r.sentiment_score) || 0),
        sizeScale: 1,
        _lighting: 'pbr',
        pickable: true,
        onHover: info => setHovered(info.object ? info : null),
        onClick: info => { if (info.object) setSelected(info.object); },
        updateTriggers: {
            getPosition: filtered,
            getColor: filtered,
            getScale: [filtered, pulse],
        },
    }), 

    new LineLayer({
      id: 'trace-lines',
      data: filtered,
      getSourcePosition: r => [jitter(r.lon, r.created_utc), jitter(r.lat, r.created_utc + 1), 0],
      getTargetPosition: r => [jitter(r.lon, r.created_utc), jitter(r.lat, r.created_utc + 1), getElevation(r)],
      getColor: r => {
        const c = scoreToColor(parseFloat(r.sentiment_score) || 0);
        return [c[0], c[1], c[2], 80];
      },
      getWidth: 1.5,
      widthUnits: 'pixels',
      pickable: false,
    }),


  ];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');`}</style>

      <DeckGL
        initialViewState={INITIAL_VIEW}
        controller={{ dragRotate: true, touchRotate: true }}
        layers={layers}
        getCursor={() => hovered ? 'pointer' : 'grab'}
      >
        <Map
          mapStyle={CARTO_STYLE}
          mapboxAccessToken="no-token"
          attributionControl={false}
          reuseMaps
        >
          <NavigationControl position="bottom-right" />
        </Map>
      </DeckGL>

      {/* Header */}
      <div style={{
        position: 'fixed', top: 24, left: 24, zIndex: 900,
        fontFamily: "'DM Mono', monospace", pointerEvents: 'none',
      }}>
        <div style={{ fontSize: '10px', color: '#aa93f6', letterSpacing: '0.14em', marginBottom: 5 }}>
          DATA EXPERIENCE · NYC
        </div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#fea5a5', letterSpacing: '-0.01em' }}>
          ReadIt NYC
        </div>
        <div style={{ fontSize: '11px', color: '#c7d1df', marginTop: 4, marginBottom: 6, fontStyle: 'italic' }}>
            NYC's emotional terrain, mapped from Reddit.
        </div>
        <div style={{ fontSize: '11px', color: '#80acea', marginTop: 5 }}>
          {filtered.length} posts visible
        </div>
      </div>

      {/* Filters */}
      <div style={{
        position: 'fixed', top: 24, right: selected ? 444 : 24, zIndex: 900,
        display: 'flex', gap: 8, fontFamily: "'DM Mono', monospace",
        transition: 'right 0.22s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {SENTIMENT_FILTERS.map(f => (
          <button key={f} onClick={() => setSentiment(f)} style={{
            background: sentiment === f ? 'rgba(99,102,241,0.2)' : 'rgba(8,8,16,0.8)',
            border: `1px solid ${sentiment === f ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
            color: sentiment === f ? '#a5b4fc' : '#475569',
            cursor: 'pointer', borderRadius: 6, padding: '6px 14px',
            fontSize: '10px', letterSpacing: '0.08em',
            backdropFilter: 'blur(12px)', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>{f.toUpperCase()}</button>
        ))}
        {boroughs.length > 0 && (
          <select value={borough} onChange={e => setBorough(e.target.value)} style={{
            background: 'rgba(8,8,16,0.85)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#475569', borderRadius: 6, padding: '6px 14px',
            fontSize: '10px', backdropFilter: 'blur(12px)', fontFamily: 'inherit',
          }}>
            <option value="all">ALL BOROUGHS</option>
            {boroughs.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
          </select>
        )}
      </div>

      {/* Legend */}
      <div style={{
        position: 'fixed', bottom: 90, left: 24, zIndex: 900,
        fontFamily: "'DM Mono', monospace",
        display: 'flex', flexDirection: 'column', gap: 12,
        pointerEvents: 'none',
        background: 'rgba(6,6,12,0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '18px 20px',
        minWidth: 220,
      }}>
        <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.14em', marginBottom: 2 }}>
          SENTIMENT
        </div>
        {[
            { color: '#00e65a', label: 'VERY POSITIVE', range: '≥ 0.6' },
            { color: '#64ffa0', label: 'POSITIVE',      range: '0.15 – 0.6' },
            { color: '#786eff', label: 'NEUTRAL',        range: '-0.15 – 0.15' },
            { color: '#ff506e', label: 'NEGATIVE',       range: '-0.6 – -0.15' },
            { color: '#dc1414', label: 'VERY NEGATIVE',  range: '≤ -0.6' },
        ].map(({ color, label, range }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', minWidth: 100, fontSize: '11px' }}>{label}</span>
            <span style={{ color: '#475569', fontSize: '11px' }}>{range}</span>
          </div>
        ))}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 12, marginTop: 2,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.14em', marginBottom: 2 }}>
            ENCODING
          </div>
          <div style={{ color: '#64748b', fontSize: '11px' }}>↕ HEIGHT = emotional intensity</div>
          <div style={{ color: '#64748b', fontSize: '11px' }}>⬤ SIZE = engagement (upvotes + comments)</div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'fixed', left: hovered.x + 18, top: hovered.y - 12,
          background: 'rgba(8,8,16,0.94)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
          padding: '10px 14px', color: '#e2e8f0',
          fontFamily: "'DM Mono', monospace", fontSize: '11px',
          maxWidth: 260, pointerEvents: 'none', zIndex: 800,
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 500, marginBottom: 4, color: '#f1f5f9' }}>
            {truncate(hovered.object.title, 80)}
          </div>
          <div style={{ color: '#475569' }}>{truncate(hovered.object.selftext, 90)}</div>
          <div style={{ marginTop: 6, color: '#6366f1', fontSize: '10px', letterSpacing: '0.06em' }}>
            r/{hovered.object.subreddit} · {hovered.object.detected_place}
          </div>
        </div>
      )}

      {timestamps.length > 1 && (
        <TimeSlider timestamps={timestamps} value={timeValue} onChange={setTimeValue} />
      )}

      <SidePanel post={selected} onClose={() => setSelected(null)} />
    </div>
  );
}