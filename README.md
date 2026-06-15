# OVERHEARD

OVERHEARD is a browser-based experiment inspired by the feeling of talking about something and then suddenly seeing ads or recommendations related to it.

The app listens to speech (or accepts typed text), extracts important keywords, and gradually changes an Instagram-style image feed to match the topics being discussed. Instead of updating everything at once, the feed changes one image at a time, creating the impression that the algorithm is slowly learning what you're interested in.

## Why I Built It

I wanted to explore browser APIs, basic natural language processing techniques, and interactive UI design in a project that felt a little more creative than a typical dashboard or CRUD application.

The idea was to simulate how recommendation systems can feel from a user's perspective, even though the app itself never sends data anywhere or performs any actual tracking.

## Features

* Speech input using the Web Speech API
* Text input as an alternative to voice
* Custom keyword extraction pipeline
* Real-time keyword detection and visualization
* Dynamic image feed that updates based on detected topics
* Progress indicator showing how much of the feed has changed
* Activity log showing how the application processes input
* Built entirely with vanilla JavaScript

## How It Works

1. The user speaks or types text.
2. The application extracts important keywords by:

   * Converting text to a standard format
   * Removing common stopwords
   * Counting keyword frequency
3. Related search terms are generated from the detected topics.
4. Images matching those topics are loaded from public image sources.
5. The image grid gradually updates over time to reflect the detected interests.

The goal is to create the feeling that the feed is adapting to the conversation in real time.

## Technologies Used

* HTML5
* CSS3
* Vanilla JavaScript (ES Modules)
* Web Speech API
* LoremFlickr
* Picsum Photos
* GitHub Pages

## Running Locally

```bash
git clone https://github.com/YOUR_USERNAME/overheard.git
cd overheard
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Because speech recognition relies on browser APIs, the project must be served through a local web server rather than opened directly from the file system.

## Project Structure

```text
overheard/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── speech.js
│   ├── nlp.js
│   ├── grid.js
│   └── api.js
└── README.md
```

## Privacy

This project does not store user data or send conversation data to any custom backend.

* No database
* No user accounts
* No analytics
* No data persistence

All processing happens in the browser, and refreshing the page resets the application state.

## What I Learned

Building this project gave me experience working with browser APIs, organizing larger JavaScript applications using modules, and implementing simple NLP techniques without relying on external libraries. It also pushed me to think more about user experience and how small design choices can create a particular emotional response.

The project was especially interesting because it combined front-end development, text processing, and interactive visual design into a single application.
