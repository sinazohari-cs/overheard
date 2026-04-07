/**
 * nlp.js — Custom keyword extraction engine for OVERHEARD
 *
 * Pipeline:
 *   raw text → normalize → tokenize → filter stopwords →
 *   frequency count → score → return top N keywords
 *
 * Also provides semantic expansion (word → related search terms)
 * and deterministic color assignment per keyword.
 */

/* ─── Stopwords ────────────────────────────────────────────────────────────── */

const STOPWORDS = new Set([
  // Articles / determiners
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'some', 'any', 'all',
  'both', 'each', 'every', 'either', 'neither', 'own', 'same', 'such',
  'no', 'not', 'nor', 'only', 'other', 'another', 'few', 'more', 'most',
  'much', 'many', 'several', 'enough',

  // Pronouns
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'who', 'whom', 'which', 'what', 'whoever', 'whatever', 'whichever',
  'anyone', 'anyone', 'anything', 'somebody', 'someone', 'something',
  'nobody', 'nothing', 'everybody', 'everyone', 'everything',

  // Prepositions
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'off', 'over', 'under', 'again', 'further',
  'out', 'of', 'as', 'per', 'via', 'than',

  // Conjunctions
  'and', 'but', 'or', 'so', 'yet', 'both', 'either', 'neither',
  'whether', 'although', 'because', 'since', 'unless', 'while',
  'if', 'then', 'else', 'when', 'where', 'whereas', 'though',

  // Auxiliaries / verbs
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'can', 'could', 'ought', 'dare', 'need', 'used',
  'get', 'got', 'gets', 'getting', 'gotten',
  'go', 'goes', 'going', 'gone', 'went',
  'come', 'comes', 'coming', 'came',
  'make', 'makes', 'making', 'made',
  'take', 'takes', 'taking', 'took', 'taken',
  'see', 'sees', 'seeing', 'saw', 'seen',
  'know', 'knows', 'knowing', 'knew', 'known',
  'think', 'thinks', 'thinking', 'thought',
  'say', 'says', 'saying', 'said',
  'tell', 'tells', 'telling', 'told',
  'give', 'gives', 'giving', 'gave', 'given',
  'put', 'puts', 'putting',
  'keep', 'keeps', 'keeping', 'kept',
  'let', 'lets', 'letting',
  'use', 'uses', 'using',
  'try', 'tries', 'trying', 'tried',
  'feel', 'feels', 'feeling', 'felt',
  'look', 'looks', 'looking', 'looked',
  'seem', 'seems', 'seeming', 'seemed',
  'want', 'wants', 'wanting', 'wanted',
  'show', 'shows', 'showing', 'showed', 'shown',
  'find', 'finds', 'finding', 'found',
  'leave', 'leaves', 'leaving', 'left',
  'call', 'calls', 'calling', 'called',
  'mean', 'means', 'meaning', 'meant',
  'start', 'starts', 'starting', 'started',
  'turn', 'turns', 'turning', 'turned',
  'ask', 'asks', 'asking', 'asked',
  'work', 'works', 'working', 'worked',
  'live', 'lives', 'living', 'lived',
  'move', 'moves', 'moving', 'moved',
  'play', 'plays', 'playing', 'played',
  'hold', 'holds', 'holding', 'held',
  'help', 'helps', 'helping', 'helped',
  'talk', 'talks', 'talking', 'talked',
  'hear', 'hears', 'hearing', 'heard',
  'stop', 'stops', 'stopping', 'stopped',
  'meet', 'meets', 'meeting', 'met',
  'bring', 'brings', 'bringing', 'brought',
  'happen', 'happens', 'happening', 'happened',

  // Adverbs / filler
  'very', 'really', 'actually', 'basically', 'literally', 'totally',
  'honestly', 'generally', 'usually', 'often', 'always', 'never',
  'sometimes', 'already', 'still', 'just', 'even', 'also', 'too',
  'now', 'then', 'here', 'there', 'how', 'why', 'well', 'back',
  'up', 'away', 'around', 'quite', 'rather', 'pretty', 'kinda',
  'sorta', 'like', 'maybe', 'perhaps', 'probably', 'definitely',
  'certainly', 'clearly', 'simply', 'only', 'else', 'once',
  'soon', 'already', 'again', 'almost', 'enough', 'instead',
  'however', 'therefore', 'moreover', 'meanwhile', 'otherwise',
  'um', 'uh', 'hmm', 'oh', 'ah', 'ok', 'okay', 'yeah', 'yes',
  'yep', 'nope', 'nah', 'wow', 'hey', 'hi', 'bye', 'thanks',
  'thank', 'please', 'sorry', 'anyway', 'alright',

  // Common nouns that add no signal
  'thing', 'things', 'stuff', 'way', 'ways', 'part', 'parts',
  'time', 'times', 'day', 'days', 'week', 'weeks', 'month', 'months',
  'year', 'years', 'today', 'tomorrow', 'yesterday', 'morning', 'night',
  'lot', 'lots', 'bit', 'point', 'fact', 'idea', 'case', 'kind',
  'type', 'sort', 'side', 'end', 'place', 'places', 'number',
  'man', 'men', 'woman', 'women', 'person', 'people', 'guy', 'guys',
  'right', 'left', 'good', 'bad', 'great', 'nice', 'true', 'real',
  'new', 'old', 'big', 'small', 'large', 'long', 'short', 'high', 'low',
  'first', 'last', 'next', 'same', 'different', 'hard', 'easy',
  'little', 'whole', 'able', 'full', 'open', 'close', 'early', 'late',
]);

/* ─── Semantic Expansion Map ───────────────────────────────────────────────── */

/**
 * Maps a detected keyword to a list of additional search terms to query.
 * This creates the "eerily relevant" feel even for vague keywords.
 */
const SEMANTIC_MAP = {
  // Nature / outdoors
  hiking:      ['mountain trail', 'wilderness'],
  hike:        ['mountain trail', 'wilderness'],
  mountain:    ['alpine', 'summit'],
  camping:     ['campfire', 'tent wilderness'],
  forest:      ['trees nature', 'woodland'],
  beach:       ['ocean waves', 'sand coast'],
  ocean:       ['sea waves', 'underwater marine'],
  lake:        ['lake reflection', 'water nature'],
  desert:      ['sand dunes', 'arid landscape'],
  sunset:      ['golden hour sky', 'horizon'],
  sunrise:     ['dawn sky', 'morning light'],
  snow:        ['winter landscape', 'snowflake'],
  rain:        ['storm weather', 'raindrops'],
  flowers:     ['garden botanical', 'bloom'],
  flower:      ['garden botanical', 'bloom'],
  garden:      ['plants flowers', 'botanical'],

  // Astronomy / space
  space:       ['astronomy galaxy', 'nebula cosmos'],
  astronomy:   ['telescope stars', 'cosmos'],
  stars:       ['night sky astronomy', 'galaxy'],
  star:        ['night sky', 'cosmos'],
  galaxy:      ['milky way', 'cosmos astronomy'],
  planet:      ['solar system', 'astronomy orbit'],
  moon:        ['lunar night', 'astronomy'],
  rocket:      ['space launch', 'nasa spacecraft'],
  nasa:        ['space exploration', 'rocket launch'],
  telescope:   ['astronomy observatory', 'stars'],
  nebula:      ['space cosmos', 'astronomy'],
  blackhole:   ['astronomy space', 'cosmos event horizon'],
  cosmos:      ['universe space', 'astronomy galaxy'],
  satellite:   ['space orbit', 'technology satellite'],

  // Food & drink
  food:        ['cuisine restaurant', 'gourmet dish'],
  coffee:      ['cafe espresso', 'latte art'],
  pizza:       ['italian food', 'pizza slice'],
  sushi:       ['japanese food', 'sushi roll'],
  tacos:       ['mexican food', 'street food'],
  burger:      ['fast food', 'grill'],
  cooking:     ['kitchen chef', 'cuisine'],
  baking:      ['bread pastry', 'kitchen baking'],
  cake:        ['dessert bakery', 'pastry'],
  wine:        ['vineyard grapes', 'winery'],
  beer:        ['brewery craft beer', 'pub'],
  tea:         ['teacup brew', 'tea ceremony'],

  // Animals & pets
  dog:         ['puppy canine', 'dog playing'],
  cat:         ['kitten feline', 'cat portrait'],
  puppy:       ['dog cute', 'canine'],
  kitten:      ['cat cute', 'feline'],
  bird:        ['wildlife avian', 'bird nature'],
  horse:       ['equestrian', 'horse field'],
  fish:        ['aquarium marine', 'underwater fish'],
  wildlife:    ['animals nature', 'safari'],
  elephant:    ['wildlife africa', 'elephant nature'],
  lion:        ['wildlife africa', 'predator savanna'],
  wolf:        ['wildlife forest', 'pack animal'],
  bear:        ['wildlife nature', 'bear forest'],

  // Tech
  coding:      ['programming developer', 'code laptop'],
  code:        ['programming software', 'developer'],
  programming: ['developer laptop', 'code screen'],
  computer:    ['technology laptop', 'digital workspace'],
  robot:       ['robotics ai', 'automation machine'],
  drone:       ['aerial photography', 'quadcopter'],
  vr:          ['virtual reality', 'metaverse headset'],
  ai:          ['artificial intelligence', 'neural network'],
  phone:       ['smartphone mobile', 'screen device'],

  // Fitness & sports
  gym:         ['fitness workout', 'weightlifting'],
  workout:     ['fitness exercise', 'gym training'],
  running:     ['marathon jogging', 'runner trail'],
  run:         ['marathon jogging', 'runner'],
  yoga:        ['meditation wellness', 'yoga pose'],
  meditation:  ['mindfulness calm', 'zen'],
  climbing:    ['rock climbing', 'bouldering'],
  surfing:     ['waves ocean surf', 'surfer'],
  swimming:    ['pool water sport', 'swimmer'],
  cycling:     ['bicycle road', 'cyclist'],
  bike:        ['bicycle cycling', 'mountain bike'],
  football:    ['soccer sport', 'football field'],
  basketball:  ['nba sport', 'basketball court'],
  tennis:      ['tennis court', 'sport racket'],
  skiing:      ['ski resort snow', 'alpine skiing'],

  // Music & art
  music:       ['concert performance', 'musician instrument'],
  guitar:      ['music instrument', 'guitarist'],
  piano:       ['music instrument', 'pianist'],
  concert:     ['live music performance', 'crowd stage'],
  art:         ['painting gallery', 'creative artwork'],
  painting:    ['art gallery', 'canvas artwork'],
  photography: ['camera portrait', 'photo art'],
  photo:       ['photography camera', 'portrait'],
  camera:      ['photography lens', 'photo equipment'],
  drawing:     ['sketch art', 'illustration'],

  // Travel
  travel:      ['adventure destination', 'wanderlust journey'],
  japan:       ['tokyo japanese', 'japan culture'],
  italy:       ['rome italian', 'italy architecture'],
  paris:       ['france eiffel tower', 'french city'],
  nyc:         ['new york city', 'manhattan skyline'],
  london:      ['uk city', 'london architecture'],
  tokyo:       ['japan city', 'japanese urban'],
  city:        ['urban skyline', 'architecture cityscape'],
  architecture: ['building design', 'city architecture'],
  road:        ['highway journey', 'road trip'],

  // Lifestyle
  fashion:     ['style clothing', 'fashion outfit'],
  reading:     ['book library', 'reading literature'],
  book:        ['library reading', 'literature'],
  party:       ['celebration nightlife', 'crowd festive'],
  birthday:    ['celebration cake', 'party'],
  christmas:   ['holiday winter', 'christmas tree'],
  halloween:   ['pumpkin spooky', 'halloween costume'],
  wedding:     ['ceremony romantic', 'wedding floral'],

  // Misc high-frequency
  sleep:       ['rest bedroom', 'sleep cozy'],
  study:       ['student library', 'books studying'],
  school:      ['education classroom', 'university'],
  university:  ['campus college', 'education'],
  money:       ['finance currency', 'wealth'],
  car:         ['automobile vehicle', 'car road'],
  movie:       ['cinema film', 'theater movie'],
  gaming:      ['video game controller', 'gamer'],
  game:        ['gaming video game', 'gamer'],
};

/* ─── Color Palette ────────────────────────────────────────────────────────── */

const PALETTE = [
  { bg: 'rgba(0,255,136,0.14)',  border: 'rgba(0,255,136,0.55)',  text: '#00ff88' },
  { bg: 'rgba(0,190,255,0.14)', border: 'rgba(0,190,255,0.55)', text: '#00beff' },
  { bg: 'rgba(255,80,180,0.14)', border: 'rgba(255,80,180,0.55)', text: '#ff50b4' },
  { bg: 'rgba(255,170,0,0.14)', border: 'rgba(255,170,0,0.55)', text: '#ffaa00' },
  { bg: 'rgba(180,0,255,0.14)', border: 'rgba(180,0,255,0.55)', text: '#b400ff' },
  { bg: 'rgba(255,100,50,0.14)', border: 'rgba(255,100,50,0.55)', text: '#ff6432' },
  { bg: 'rgba(50,220,200,0.14)', border: 'rgba(50,220,200,0.55)', text: '#32dcc8' },
  { bg: 'rgba(255,220,50,0.14)', border: 'rgba(255,220,50,0.55)', text: '#ffdc32' },
];

/* ─── Public API ───────────────────────────────────────────────────────────── */

/**
 * Extract meaningful keywords from a text string.
 * @param {string} text
 * @param {object} opts
 * @param {number} opts.minLength   Minimum word length (default 3)
 * @param {number} opts.topN        Max keywords to return (default 10)
 * @returns {{ word: string, score: number }[]}
 */
export function extractKeywords(text, { minLength = 3, topN = 10 } = {}) {
  if (!text || typeof text !== 'string') return [];

  // Lowercase and strip non-alpha characters (keep hyphens between words)
  const cleaned = text
    .toLowerCase()
    .replace(/[''`]/g, '')         // smart quotes → nothing
    .replace(/[^a-z\s-]/g, ' ')   // keep letters, spaces, hyphens
    .replace(/-+/g, ' ')           // hyphens → spaces
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  const freq = new Map();

  for (const w of words) {
    // Strip any remaining edge dashes
    const word = w.replace(/^-+|-+$/g, '');
    if (word.length < minLength)      continue;
    if (STOPWORDS.has(word))          continue;
    // Skip pure numbers
    if (/^\d+$/.test(word))           continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, score]) => ({ word, score }));
}

/**
 * Return search terms to query for a given keyword.
 * Base keyword + up to 2 semantically related terms.
 * @param {string} keyword
 * @returns {string[]}
 */
export function expandKeyword(keyword) {
  const key = keyword.toLowerCase();
  const related = SEMANTIC_MAP[key] || [];
  // Return the keyword itself + up to 2 expansions
  return [key, ...related.slice(0, 2)];
}

/**
 * Deterministic color assignment based on keyword string hash.
 * Same keyword always gets the same color.
 * @param {string} keyword
 * @returns {{ bg: string, border: string, text: string }}
 */
export function keywordColor(keyword) {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash = (hash * 31 + keyword.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
