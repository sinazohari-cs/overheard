/**
 * api.js — Image URL generation for OVERHEARD
 *
 * Sources:
 *  - Random images   → Picsum Photos (picsum.photos) — beautiful random photos
 *  - Keyword images  → LoremFlickr (loremflickr.com) — Flickr images by topic
 *
 * Both are free public CDNs requiring no API keys.
 */

const PICSUM_BASE  = 'https://picsum.photos';
const FLICKR_BASE  = 'https://loremflickr.com';

// Track used Picsum seeds to avoid exact duplicates in a session
const _usedSeeds = new Set();

/**
 * Generate a unique random seed for Picsum.
 * @returns {number}
 */
function uniqueSeed() {
  let seed;
  do {
    seed = Math.floor(Math.random() * 9000) + 100;
  } while (_usedSeeds.has(seed) && _usedSeeds.size < 8900);
  _usedSeeds.add(seed);
  return seed;
}

/**
 * Returns a random image URL from Picsum Photos.
 * @param {number} [width=600]
 * @param {number} [height=600]
 * @returns {string}
 */
export function randomImageURL(width = 600, height = 600) {
  return `${PICSUM_BASE}/seed/${uniqueSeed()}/${width}/${height}`;
}

/**
 * Returns a keyword-relevant image URL from LoremFlickr.
 *
 * LoremFlickr searches Flickr's public API for the given keyword(s)
 * and returns a relevant image. The `lock` param gives different
 * results for the same keyword, enabling variety across grid cells.
 *
 * @param {string} keyword  - Topic to search for (e.g. 'astronomy', 'coffee')
 * @param {number} [lock]   - Index to get different images for same keyword
 * @param {number} [width=600]
 * @param {number} [height=600]
 * @returns {string}
 */
export function keywordImageURL(keyword, lock = null, width = 600, height = 600) {
  // Encode keyword — LoremFlickr accepts comma-separated tags
  const safe  = encodeURIComponent(keyword.toLowerCase().replace(/\s+/g, ','));
  const l     = lock !== null ? lock : Math.floor(Math.random() * 9999);
  return `${FLICKR_BASE}/${width}/${height}/${safe}?lock=${l}`;
}

/**
 * Returns an array of distinct keyword image URLs (for grid rotation).
 *
 * @param {string} keyword
 * @param {number} [count=6]
 * @returns {string[]}
 */
export function keywordImageURLs(keyword, count = 6) {
  return Array.from({ length: count }, (_, i) => {
    // Spread lock values so each slot pulls a genuinely different Flickr image
    const lock = i * 17 + Math.floor(Math.random() * 300);
    return keywordImageURL(keyword, lock);
  });
}

/**
 * Preload an image URL in the background.
 * Resolves with the URL on success, rejects on error.
 * @param {string} url
 * @returns {Promise<string>}
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src     = url;
  });
}
