/**
 * grid.js — Feed grid management for OVERHEARD
 *
 * Manages a fixed set of cells in an Instagram Explore-style layout.
 * Cells start with random images. As keywords are detected, the grid
 * is "infected" — cells gradually swap to keyword-relevant imagery.
 *
 * Infection is intentionally slow and staggered to build suspense.
 */

import { randomImageURL, keywordImageURLs } from './api.js';

/* ─── Grid Layout Definition ───────────────────────────────────────────────── */
// Each entry: { col, row } = column span, row span
// Designed for a 4-column grid with 175px base row height.
// Mix of 1×1, 1×2 (tall), 2×1 (wide), 2×2 (big) cells.

const CELL_LAYOUT = [
  { col: 2, row: 2 }, //  0 — big
  { col: 1, row: 1 }, //  1
  { col: 1, row: 1 }, //  2
  { col: 1, row: 2 }, //  3 — tall
  { col: 1, row: 1 }, //  4
  { col: 1, row: 1 }, //  5
  { col: 2, row: 1 }, //  6 — wide
  { col: 1, row: 1 }, //  7
  { col: 1, row: 1 }, //  8
  { col: 1, row: 1 }, //  9
  { col: 1, row: 1 }, // 10
  { col: 2, row: 2 }, // 11 — big
  { col: 1, row: 1 }, // 12
  { col: 1, row: 1 }, // 13
  { col: 2, row: 1 }, // 14 — wide
  { col: 1, row: 1 }, // 15
  { col: 1, row: 1 }, // 16
  { col: 1, row: 2 }, // 17 — tall
  { col: 1, row: 1 }, // 18
  { col: 1, row: 1 }, // 19
];

const INFECTION_INTERVAL_MS = 900; // how often one cell gets infected

/* ─── GridCell ─────────────────────────────────────────────────────────────── */

class GridCell {
  constructor(index, colSpan, rowSpan) {
    this.index    = index;
    this.colSpan  = colSpan;
    this.rowSpan  = rowSpan;
    this.keyword  = null;       // null = random / uninfected
    this.color    = null;
    this.element  = null;
    this.imgEl    = null;
    this.tagEl    = null;
    this.shimEl   = null;
    this.infectedAt = null;     // timestamp of last infection
  }

  get infected() { return this.keyword !== null; }
}

/* ─── Grid ──────────────────────────────────────────────────────────────────── */

export class Grid {
  /**
   * @param {HTMLElement} container  - The grid wrapper element
   * @param {function}    onLog      - Logging callback (msg, type?)
   * @param {function}    onProgress - Called with (infectedCount, totalCount)
   */
  constructor(container, onLog, onProgress) {
    this.container  = container;
    this.onLog      = onLog      || (() => {});
    this.onProgress = onProgress || (() => {});

    this._cells      = [];
    this._queue      = [];   // array of { keyword, images, color, pointer }
    this._rrIndex    = 0;    // round-robin pointer across queue items
    this._timer      = null;

    this._build();
  }

  /* ── Public ─────────────────────────────────────────────────────────── */

  /**
   * Queue a keyword for grid infection.
   * @param {string}          keyword     - Display keyword
   * @param {string|string[]} queries     - One or more image search terms
   * @param {object}          color       - { bg, border, text }
   */
  infectWithKeyword(keyword, queries, color) {
    const terms  = Array.isArray(queries) ? queries : [queries];
    // Pool images from all search terms — gives variety without flooding queue
    const images = terms.flatMap(term => keywordImageURLs(term, 4));
    // Shuffle so images from different terms interleave
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
    this._queue.push({ keyword, images, color, pointer: 0 });
    this._startTimer();
  }

  /**
   * Reset all cells back to random images.
   */
  reset() {
    this._stopTimer();
    this._queue   = [];
    this._rrIndex = 0;

    for (const cell of this._cells) {
      cell.keyword    = null;
      cell.color      = null;
      cell.infectedAt = null;
      cell.element.classList.remove('infected', 'infecting');
      cell.tagEl.textContent = '';
      cell.tagEl.style.cssText = '';
      this._loadImage(cell, randomImageURL());
    }

    this.onProgress(0, this._cells.length);
  }

  get totalCells()    { return this._cells.length; }
  get infectedCells() { return this._cells.filter(c => c.infected).length; }

  /* ── Private: Build ─────────────────────────────────────────────────── */

  _build() {
    this.container.innerHTML = '';
    this._cells = CELL_LAYOUT.map((span, i) => new GridCell(i, span.col, span.row));

    for (const cell of this._cells) {
      const el = document.createElement('div');
      el.className = 'grid-cell';

      // Apply CSS span classes
      if      (cell.colSpan === 2 && cell.rowSpan === 2) el.classList.add('span-both-2');
      else if (cell.colSpan === 2)                        el.classList.add('span-col-2');
      else if (cell.rowSpan === 2)                        el.classList.add('span-row-2');

      // Shimmer (shown while image loads)
      const shimEl = document.createElement('div');
      shimEl.className = 'cell-shimmer';

      // Image
      const imgEl = document.createElement('img');
      imgEl.className = 'cell-img hidden';
      imgEl.alt = '';
      imgEl.loading = 'lazy';

      // Scan-line overlay
      const scanEl = document.createElement('div');
      scanEl.className = 'cell-scanline';

      // Keyword tag
      const tagEl = document.createElement('div');
      tagEl.className = 'cell-tag';

      el.appendChild(shimEl);
      el.appendChild(imgEl);
      el.appendChild(scanEl);
      el.appendChild(tagEl);
      this.container.appendChild(el);

      cell.element = el;
      cell.imgEl   = imgEl;
      cell.tagEl   = tagEl;
      cell.shimEl  = shimEl;

      // Load initial random image
      this._loadImage(cell, randomImageURL());
    }
  }

  /* ── Private: Image Loading ─────────────────────────────────────────── */

  _loadImage(cell, url) {
    const img = cell.imgEl;

    img.classList.remove('visible');
    img.classList.add('hidden');
    cell.element.classList.remove('loaded');

    const newImg = new Image();
    newImg.onload = () => {
      img.src = url;
      img.classList.remove('hidden');
      img.classList.add('visible');
      cell.element.classList.add('loaded');
    };
    newImg.onerror = () => {
      // Fallback: try a different random image
      const fallback = randomImageURL();
      img.src = fallback;
      img.classList.add('visible');
      cell.element.classList.add('loaded');
    };
    newImg.src = url;
  }

  /* ── Private: Infection Logic ───────────────────────────────────────── */

  _startTimer() {
    if (this._timer) return;
    this._timer = setInterval(() => this._infectNextCell(), INFECTION_INTERVAL_MS);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _infectNextCell() {
    if (this._queue.length === 0) {
      this._stopTimer();
      return;
    }

    // True round-robin: cycle through every keyword evenly, no bias toward first
    this._rrIndex = this._rrIndex % this._queue.length;
    const item    = this._queue[this._rrIndex];
    this._rrIndex++;

    // Target a random uninfected cell first; if all infected, rotate any
    const candidates = this._cells.filter(c => !c.infected);
    const target = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : this._cells[Math.floor(Math.random() * this._cells.length)];

    this._applyInfection(target, item);
  }

  _applyInfection(cell, item) {
    const { keyword, images, color } = item;

    // Cycle through available images
    const imageURL = images[item.pointer % images.length];
    item.pointer++;

    // Replenish image pool before exhausting it
    if (item.pointer >= images.length - 2) {
      const extra = keywordImageURLs(item.images[0], 4);
      item.images.push(...extra);
    }

    // Flash border effect
    cell.element.classList.add('infecting');
    setTimeout(() => cell.element.classList.remove('infecting'), 800);

    // Brief delay before swapping image (let the flash settle)
    setTimeout(() => {
      this._loadImage(cell, imageURL);

      // Tag
      cell.tagEl.textContent   = keyword.toUpperCase();
      cell.tagEl.style.background  = color.bg;
      cell.tagEl.style.borderColor = color.border;
      cell.tagEl.style.color       = color.text;

      cell.element.classList.add('infected');
      cell.keyword    = keyword;
      cell.color      = color;
      cell.infectedAt = Date.now();

      this.onProgress(this.infectedCells, this.totalCells);
      this.onLog(`cell #${cell.index} → "${keyword}"`, 'accent');
    }, 250);
  }
}
