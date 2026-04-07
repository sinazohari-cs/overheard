/**
 * app.js — Main orchestrator for OVERHEARD
 *
 * Wires together: Grid ↔ SpeechRecognizer ↔ NLP ↔ UI
 *
 * Flow:
 *   1. User speaks or types
 *   2. NLP extracts keywords from transcript
 *   3. New keywords trigger grid infection (via semantic expansion)
 *   4. Grid gradually replaces cells with topically relevant images
 *   5. UI reflects state changes in real time
 */

import { Grid }             from './grid.js';
import { SpeechRecognizer } from './speech.js';
import { extractKeywords, expandKeyword, keywordColor } from './nlp.js';

/* ══════════════════════════════════════════════════════════════
   DOM REFS
   ══════════════════════════════════════════════════════════════ */

const $grid         = document.getElementById('feedGrid');
const $infectionBar = document.getElementById('infectionBar');
const $statusDot    = document.getElementById('statusDot');
const $statusLabel  = document.getElementById('statusLabel');
const $micButton    = document.getElementById('micButton');
const $micLabel     = document.getElementById('micLabel');
const $micRings     = document.getElementById('micRings');
const $liveXcript   = document.getElementById('liveTranscript');
const $textInput    = document.getElementById('textInput');
const $analyzeBtn   = document.getElementById('analyzeButton');
const $keywordsWrap = document.getElementById('keywordsContainer');
const $keywordCount = document.getElementById('keywordCount');
const $logContainer = document.getElementById('logContainer');
const $feedOverlay  = document.getElementById('feedOverlay');
const $speechBadge  = document.getElementById('speechBadge');
const $logo         = document.querySelector('.logo');

/* ══════════════════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════════════════ */

const state = {
  /** Full accumulated transcript from all speech sessions */
  fullTranscript: '',

  /**
   * keyword → { score: number, color: object, searchTerms: string[] }
   * Tracks every detected keyword and its accumulated frequency score.
   */
  keywords: new Map(),

  isListening: false,
};

/* ══════════════════════════════════════════════════════════════
   MODULE INIT
   ══════════════════════════════════════════════════════════════ */

const grid = new Grid(
  $grid,
  (msg, type) => addLog(msg, type),
  (infected, total) => updateInfectionBar(infected, total),
);

const speech = new SpeechRecognizer({
  onStart:  handleSpeechStart,
  onResult: handleSpeechResult,
  onEnd:    handleSpeechEnd,
  onError:  handleSpeechError,
});

/* ══════════════════════════════════════════════════════════════
   STARTUP
   ══════════════════════════════════════════════════════════════ */

(function init() {
  // Speech API badge
  if (speech.supported) {
    $speechBadge.textContent = 'AVAILABLE';
    $speechBadge.style.color = 'var(--accent)';
    $speechBadge.style.borderColor = 'rgba(0,255,136,0.3)';
  }

  addLog('OVERHEARD v1.0 initialized', 'accent');
  addLog(`grid loaded — ${grid.totalCells} cells active`);
  addLog('speech API: ' + (speech.supported ? 'ready' : 'unavailable (use text input)'),
         speech.supported ? '' : 'warn');
  addLog('awaiting input...');
})();

/* ══════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ══════════════════════════════════════════════════════════════ */

// Mic button
$micButton.addEventListener('click', () => {
  if (!speech.supported) {
    addLog('speech API unavailable — using text input instead', 'warn');
    $textInput.focus();
    return;
  }
  speech.toggle();
});

// Analyze button
$analyzeBtn.addEventListener('click', () => {
  const text = $textInput.value.trim();
  if (!text) {
    addLog('no text to analyze', 'warn');
    return;
  }
  addLog(`analyzing ${text.split(/\s+/).filter(Boolean).length} words...`);
  showOverlay(true);
  // Brief delay so the overlay flash is visible
  setTimeout(() => {
    processText(text);
    showOverlay(false);
  }, 600);
});

// Ctrl+Enter to analyze
$textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    $analyzeBtn.click();
  }
});

// Double-click logo → reset
$logo.addEventListener('dblclick', () => {
  resetAll();
});

/* ══════════════════════════════════════════════════════════════
   SPEECH HANDLERS
   ══════════════════════════════════════════════════════════════ */

function handleSpeechStart() {
  state.isListening = true;
  $micButton.classList.add('listening');
  $micLabel.textContent = 'LISTENING...';
  setStatus('LISTENING', 'listening');
  addLog('microphone activated — speak naturally', 'accent');
}

function handleSpeechResult({ interim, final }) {
  // Show live interim transcript
  if (interim) {
    $liveXcript.textContent = `"${interim}"`;
  }

  // Process finalized speech
  if (final) {
    state.fullTranscript += ' ' + final;
    const preview = final.trim().slice(0, 55);
    addLog(`heard: "${preview}${final.trim().length > 55 ? '…' : ''}"`);
    processText(state.fullTranscript);
  }
}

function handleSpeechEnd() {
  state.isListening = false;
  $micButton.classList.remove('listening');
  $micLabel.textContent = 'CLICK TO SPEAK';
  $liveXcript.textContent = '';
  setStatus(state.keywords.size > 0 ? 'ACTIVE' : 'IDLE',
            state.keywords.size > 0 ? 'active' : '');
  addLog('microphone closed');
}

function handleSpeechError(msg) {
  addLog(msg, 'error');
  handleSpeechEnd();
}

/* ══════════════════════════════════════════════════════════════
   CORE PROCESSING
   ══════════════════════════════════════════════════════════════ */

/**
 * Run keyword extraction on text and infect grid with new keywords.
 * @param {string} text
 */
function processText(text) {
  setStatus('PROCESSING', 'processing');

  const extracted = extractKeywords(text, { minLength: 3, topN: 10 });

  if (extracted.length === 0) {
    addLog('no significant keywords found yet — keep talking');
    setStatus(state.isListening ? 'LISTENING' : 'IDLE',
              state.isListening ? 'listening' : '');
    return;
  }

  let newCount = 0;

  for (const { word, score } of extracted) {
    if (state.keywords.has(word)) {
      // Update existing keyword score
      state.keywords.get(word).score += score;
    } else {
      // New keyword discovered!
      const color       = keywordColor(word);
      const searchTerms = expandKeyword(word);

      state.keywords.set(word, { score, color, searchTerms });
      newCount++;

      addLog(`keyword detected: "${word}" (×${score})`, 'accent');

      // Single queue entry per keyword — expansions supply image variety
      // within that one stream, not separate flood slots
      grid.infectWithKeyword(word, searchTerms, color);
    }
  }

  if (newCount === 0) {
    addLog(`reinforced ${extracted.length} known keyword(s)`);
  } else {
    addLog(`${newCount} new topic(s) — grid infection spreading...`, 'accent');
  }

  renderKeywords();
  setStatus(state.isListening ? 'LISTENING' : 'ACTIVE',
            state.isListening ? 'listening' : 'active');
}

/* ══════════════════════════════════════════════════════════════
   UI HELPERS
   ══════════════════════════════════════════════════════════════ */

/**
 * Rebuild the keyword pills in the sidebar.
 */
function renderKeywords() {
  $keywordsWrap.innerHTML = '';
  $keywordCount.textContent = state.keywords.size;

  if (state.keywords.size === 0) {
    $keywordsWrap.innerHTML = '<span class="empty-hint">Topics will surface as you speak...</span>';
    return;
  }

  // Sort by score descending
  const sorted = [...state.keywords.entries()]
    .sort((a, b) => b[1].score - a[1].score);

  for (const [word, { score, color }] of sorted) {
    const pill = document.createElement('div');
    pill.className = 'keyword-pill';
    pill.style.background   = color.bg;
    pill.style.borderColor  = color.border;
    pill.style.color        = color.text;
    pill.innerHTML = `${word}<span class="pill-score"> ×${score}</span>`;
    $keywordsWrap.appendChild(pill);
  }
}

/**
 * Update the infection progress bar in the header.
 * @param {number} infected
 * @param {number} total
 */
function updateInfectionBar(infected, total) {
  const pct = total > 0 ? Math.round((infected / total) * 100) : 0;
  $infectionBar.style.width = `${pct}%`;
}

/**
 * Set the header status indicator.
 * @param {string} label     - Status text
 * @param {string} dotClass  - CSS class for the dot ('listening'|'processing'|'active'|'')
 */
function setStatus(label, dotClass = '') {
  $statusLabel.textContent = label;
  $statusDot.className = 'status-dot' + (dotClass ? ` ${dotClass}` : '');
}

/**
 * Add a timestamped entry to the algorithm log.
 * @param {string} msg
 * @param {'accent'|'warn'|'error'|''} [type='']
 */
function addLog(msg, type = '') {
  const now  = new Date();
  const hh   = String(now.getHours()).padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const ss   = String(now.getSeconds()).padStart(2, '0');

  const entry = document.createElement('div');
  entry.className = 'log-entry' + (type ? ` log-${type}` : '');
  entry.innerHTML = `<span class="log-time">${hh}:${mm}:${ss}</span>`
                  + `<span class="log-msg">▸ ${msg}</span>`;

  $logContainer.appendChild(entry);

  // Auto-scroll to bottom
  $logContainer.scrollTop = $logContainer.scrollHeight;

  // Cap log length at 80 entries to avoid memory growth
  while ($logContainer.children.length > 80) {
    $logContainer.removeChild($logContainer.firstChild);
  }
}

/**
 * Show or hide the full-screen processing overlay.
 * @param {boolean} show
 */
function showOverlay(show) {
  $feedOverlay.classList.toggle('show', show);
}

/**
 * Full application reset — clears state, grid, and UI.
 */
function resetAll() {
  if (speech.listening) speech.stop();

  state.fullTranscript = '';
  state.keywords.clear();
  state.isListening = false;

  $textInput.value = '';
  $liveXcript.textContent = '';

  grid.reset();
  renderKeywords();
  setStatus('IDLE', '');
  updateInfectionBar(0, grid.totalCells);

  addLog('— SYSTEM RESET —', 'warn');
  addLog('grid cleared — awaiting new input...');
}
