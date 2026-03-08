import pool from '../config/db.js';

let bannedWordsCache = [];
let lastCacheUpdate  = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getBannedWords() {
  if (Date.now() - lastCacheUpdate > CACHE_TTL) {
    const [rows] = await pool.execute('SELECT word, severity FROM banned_words');
    bannedWordsCache = rows.map(r => ({
      word:     r.word.toLowerCase(),
      severity: r.severity,
    }));
    lastCacheUpdate = Date.now();
  }
  return bannedWordsCache;
}

export async function checkProfanity(text) {
  const words  = await getBannedWords();
  const lower  = text.toLowerCase();
  const found  = words.filter(w => lower.includes(w.word));
  return {
    found:    found.length > 0,
    words:    found.map(w => w.word),
    severity: found.length ? found.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.severity] - order[a.severity];
    })[0].severity : null,
  };
}

// Invalidar caché manualmente (útil cuando se agrega una palabra)
export function invalidateCache() {
  lastCacheUpdate = 0;
}
