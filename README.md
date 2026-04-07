# OVERHEARD

> *Your device is always listening. We just made it visible.*

**OVERHEARD** is an interactive browser experiment that recreates that uncanny feeling of talking about something random with a friend — and then seeing a suspiciously relevant ad pop up moments later.

It listens to what you say (or reads what you type), extracts meaningful keywords using a custom NLP pipeline, and gradually **infects** an Instagram Explore-style image grid with eerily on-topic content — cell by cell, in real time.

---

## Demo

https://github.com/user-attachments/assets/placeholder

> Try saying: *"I was telling my friend about hiking in the mountains this summer, and then maybe stopping at a coffee shop on the way back."*
> 
> Watch the grid fill with mountains, trails, and espresso.

---

## Features

| Feature | Details |
|---|---|
| Voice recognition | Web Speech API — click mic, speak naturally, watch the feed react |
| Text input fallback | Paste or type anything; `Ctrl+Enter` to analyze |
| Custom NLP engine | Stopword removal, frequency scoring, semantic keyword expansion |
| Live grid infection | Cells gradually swap to keyword-relevant imagery — never all at once |
| Algorithm log | Real-time console showing exactly what the system is "thinking" |
| Infection progress bar | Visual indicator of how much of your feed has been "taken over" |
| Keyword pills | Color-coded topics appear as they're detected |
| Zero dependencies | Vanilla JS with ES modules — no build tools, no npm |
| GitHub Pages ready | Works as-is when deployed to any static host |

---

## How It Works

```
User speaks / types
        │
        ▼
  Transcript accumulated
        │
        ▼
  NLP Pipeline
  ├── Lowercase + normalize
  ├── Strip 300+ stopwords (filler, pronouns, auxiliaries)
  ├── Frequency count
  └── Return top-N keywords with scores
        │
        ▼
  Semantic Expansion
  e.g. "hiking" → ["hiking", "mountain trail", "wilderness"]
        │
        ▼
  Grid Infection Queue
  LoremFlickr CDN fetches relevant images per search term
        │
        ▼
  Every 1.35s — one random uninfected cell swaps to a keyword image
  (flash border → fade out → fade in new image → reveal tag)
        │
        ▼
  User watches their words take over the feed
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Structure | HTML5 semantic markup |
| Styling | CSS3 — Grid, custom properties, keyframe animations, blur |
| Logic | Vanilla JavaScript ES2020+ (ES modules) |
| Speech | Web Speech API (`SpeechRecognition`) |
| NLP | Custom keyword extractor — no library |
| Images | [LoremFlickr](https://loremflickr.com) (keyword images) + [Picsum Photos](https://picsum.photos) (random) |
| Fonts | Space Mono + Inter via Google Fonts |
| Hosting | GitHub Pages (or any static server) |

---

## Project Structure

```
overheard/
├── index.html          # App shell and semantic markup
├── css/
│   └── style.css       # Dark surveillance aesthetic, grid layout, animations
├── js/
│   ├── app.js          # Main orchestrator — wires all modules together
│   ├── speech.js       # Web Speech API wrapper with error handling
│   ├── nlp.js          # Keyword extractor, semantic expansion, color assignment
│   ├── grid.js         # Grid state management and infection spreading logic
│   └── api.js          # Image URL generation (LoremFlickr + Picsum)
└── README.md
```

---

## Getting Started

Web Speech API requires a **served origin** (not `file://`). Choose any option:

### Option A — Python (quickest)
```bash
git clone https://github.com/YOUR_USERNAME/overheard.git
cd overheard
python3 -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000)

### Option B — Node (if you have it)
```bash
npx serve .
```

### Option C — VS Code
Install the **Live Server** extension → right-click `index.html` → *Open with Live Server*

### Option D — GitHub Pages
Push to a repo → Settings → Pages → Source: main branch → Save.
Your app is live at `https://YOUR_USERNAME.github.io/overheard`

---

## Usage

1. Click **CLICK TO SPEAK** and talk naturally for 10–20 seconds
2. Watch the algorithm log and keyword pills appear in the sidebar
3. The grid gradually fills with images related to your topics
4. The infection bar shows how much of your feed has been "taken over"
5. **Double-click the OVERHEARD logo** to reset everything

### Suggested phrases to try

- *"I've been thinking about getting a dog, maybe a golden retriever"*
- *"Space is wild — the James Webb telescope photos of galaxies are insane"*
- *"I want to go hiking somewhere with mountains and maybe camp overnight"*
- *"My friend dragged me to a sushi restaurant and now I'm obsessed with Japanese food"*
- *"I've been trying to get back into reading — just finished a really good book"*

---

## Supported Browsers

| Browser | Speech Input | Text Input |
|---|---|---|
| Chrome | ✅ Full support | ✅ |
| Edge | ✅ Full support | ✅ |
| Safari | ⚠️ Partial | ✅ |
| Firefox | ❌ Not supported | ✅ |

Text input works in all modern browsers regardless of Speech API support.

---

## Privacy

- No data is ever sent to any external server
- Speech recognition runs entirely in your browser via the built-in Web Speech API
- Images are fetched anonymously from public CDNs (LoremFlickr / Picsum Photos)
- Nothing is stored — refresh the page and it's all gone

---

## Design Decisions

**Why no framework?** The goal was to demonstrate understanding of browser APIs and vanilla JS architecture — no scaffolding, no magic. Every animation, state update, and module boundary is explicit.

**Why LoremFlickr?** It queries Flickr's public photo API by tag with zero authentication required, making this deployable without any setup. The lock parameter gives variety across cells.

**Why gradual infection?** The effect only works if it creeps up on you. Instant replacement would feel like a page refresh. Staggered cells build the unsettling feeling of something slowly realizing what you're talking about.

**Why a custom NLP module?** A 300-line stopword list and frequency counter is all you actually need for conversational keyword extraction. No NLTK, no spaCy, no API calls — just signal extraction from noise.

---

## License

MIT — use, fork, remix, and ship freely.

---

*Built as a portfolio project exploring browser APIs, NLP fundamentals, and the aesthetics of surveillance capitalism.*
