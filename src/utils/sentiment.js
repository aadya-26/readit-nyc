export function scoreToColor(score) {
  if (score >= 0.6)  return [0,   230, 90,  255];  // vivid green - very positive
  if (score >= 0.15) return [100, 255, 160, 240];  // bright mint - positive
  if (score > -0.15) return [120, 110, 255, 200];  // bright indigo - neutral
  if (score > -0.6)  return [255, 80,  110, 240];  // bright rose - negative
  return                    [220, 20,  20,  255];   // vivid red - very negative
}

export function scoreToRadius(score, numComments) {
  const base = Math.sqrt(Math.abs(score || 1) + (numComments || 0));
  return Math.max(30, Math.min(base * 5, 180));
}

export function jitter(val, seed, amount = 0.007) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return val + (x - Math.floor(x) - 0.5) * amount;
}

export function formatDate(unixTs) {
  return new Date(unixTs * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function truncate(text, len = 180) {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '…' : text;
}