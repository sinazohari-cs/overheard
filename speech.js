/**
 * speech.js — Web Speech API wrapper for OVERHEARD
 *
 * Wraps the browser's SpeechRecognition API in a clean,
 * event-driven interface. Falls back gracefully when unsupported.
 *
 * Note: Web Speech API is available in Chrome and Edge.
 * Firefox and Safari have limited or no support.
 */

export class SpeechRecognizer {
  /**
   * @param {object} callbacks
   * @param {function} callbacks.onStart    - Called when mic opens
   * @param {function} callbacks.onResult   - Called with { interim, final }
   * @param {function} callbacks.onEnd      - Called when mic closes
   * @param {function} callbacks.onError    - Called with error string
   */
  constructor({ onStart, onResult, onEnd, onError } = {}) {
    this._onStart  = onStart  || (() => {});
    this._onResult = onResult || (() => {});
    this._onEnd    = onEnd    || (() => {});
    this._onError  = onError  || (() => {});

    this._recognition = null;
    this._listening   = false;

    // Detect API availability
    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    this._SRClass = SRClass || null;
  }

  /** Whether the browser supports SpeechRecognition */
  get supported() { return this._SRClass !== null; }

  /** Whether the mic is currently active */
  get listening() { return this._listening; }

  /** Toggle mic on/off */
  toggle() {
    if (this._listening) {
      this.stop();
    } else {
      this.start();
    }
  }

  /** Open the microphone and begin recognition */
  start() {
    if (!this._SRClass) {
      this._onError('Web Speech API not supported. Please use Chrome or Edge.');
      return;
    }
    if (this._listening) return;

    const rec = new this._SRClass();
    rec.lang            = 'en-US';
    rec.continuous      = true;    // keep listening until stopped
    rec.interimResults  = true;    // show partial results live
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      this._listening = true;
      this._onStart();
    };

    rec.onresult = (event) => {
      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text + ' ';
        } else {
          interim += text;
        }
      }

      this._onResult({ interim: interim.trim(), final: final.trim() });
    };

    rec.onend = () => {
      this._listening = false;
      this._recognition = null;
      this._onEnd();
    };

    rec.onerror = (event) => {
      this._listening = false;
      this._recognition = null;

      // Map error codes to human-readable messages
      const messages = {
        'not-allowed':     'Microphone access denied. Please allow mic access and try again.',
        'no-speech':       'No speech detected. Try speaking closer to your mic.',
        'network':         'Network error during speech recognition.',
        'aborted':         'Recognition was aborted.',
        'audio-capture':   'No microphone found.',
        'service-not-allowed': 'Speech service not allowed on this page.',
      };

      const msg = messages[event.error] || `Speech error: ${event.error}`;
      this._onError(msg);
    };

    this._recognition = rec;

    try {
      rec.start();
    } catch (err) {
      this._listening = false;
      this._recognition = null;
      this._onError(`Could not start microphone: ${err.message}`);
    }
  }

  /** Stop listening */
  stop() {
    if (this._recognition && this._listening) {
      this._listening = false;
      this._recognition.stop();
    }
  }
}
