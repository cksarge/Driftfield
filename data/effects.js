// =============================================================
//  EFFECTS — the building blocks of the Mixing Station.
//
//  Every mixed product carries an ordered list of effect ids.
//  An effect gives the product part of its name, colour and value,
//  and some effects have gameplay uses (see `use`).
//
//  To add an effect: add an entry here. Then reference its id from
//  ingredients (data/ingredients.js), crop flavours / rare traits
//  (data/crops.js) or the COMBOS / transform rules below.
// =============================================================

export const EFFECTS = {
  sweet:      { name: 'Sweet',      color: '#f7a8c4', value: 4,  desc: 'Sugary and bright.' },
  sour:       { name: 'Sour',       color: '#e8e86a', value: 4,  desc: 'Makes your cheeks tingle.' },
  bitter:     { name: 'Bitter',     color: '#7a8a5a', value: 3,  desc: 'An acquired taste.' },
  savory:     { name: 'Savory',     color: '#c98b55', value: 5,  desc: 'Deep and satisfying.' },
  warm:       { name: 'Warm',       color: '#f08a4b', value: 5,  desc: 'Spreads warmth from the inside.', use: 'Drink to keep crops cosy in frozen zones for a day.' },
  frosty:     { name: 'Frosty',     color: '#a8d8f0', value: 5,  desc: 'Cold enough to fog glass.' },
  refreshing: { name: 'Refreshing', color: '#8fe3d0', value: 6,  desc: 'Like a cool breeze in a cup.' },
  calming:    { name: 'Calming',    color: '#9ab8e8', value: 6,  desc: 'Slows the heartbeat to a hum.', use: 'Animals fed this are extra happy.' },
  energizing: { name: 'Energizing', color: '#ffcf3a', value: 7,  desc: 'Zip! Zing! Zoom!', use: 'Drink to explore islands with more energy.' },
  glowing:    { name: 'Glowing',    color: '#fff3a0', value: 10, desc: 'Gives off a soft light.', use: 'Fertilizer may pass a glow to crops.' },
  floaty:     { name: 'Floaty',     color: '#d8e8ff', value: 9,  desc: 'Feels lighter than air.', use: 'Potion: glide farther. Fertilizer: crops may float.' },
  speedy:     { name: 'Speedy',     color: '#7fe07f', value: 8,  desc: 'In a hurry to get somewhere.', use: 'Fertilizer: crops grow faster.' },
  rich:       { name: 'Rich',       color: '#8b5a2b', value: 8,  desc: 'Thick, dark and nourishing.', use: 'Fertilizer: improves soil quality.' },
  bountiful:  { name: 'Bountiful',  color: '#b6d65a', value: 9,  desc: 'There always seems to be more.', use: 'Fertilizer: bigger harvests.' },
  hardy:      { name: 'Hardy',      color: '#6f8f6f', value: 7,  desc: 'Shrugs off any weather.', use: 'Fertilizer: crops ignore climate.' },
  lucky:      { name: 'Lucky',      color: '#5ccf8a', value: 10, desc: 'Things just go your way.', use: 'Drink: better finds and more mutations today.' },
  fragrant:   { name: 'Fragrant',   color: '#e7a6e8', value: 6,  desc: 'Smells like a garden after rain.' },
  zesty:      { name: 'Zesty',      color: '#f5d742', value: 8,  desc: 'Sweet and sour, dancing together.' },
  dreamy:     { name: 'Dreamy',     color: '#b9a3e8', value: 8,  desc: 'Makes you think of clouds.' },
  cozy:       { name: 'Cozy',       color: '#e0a080', value: 7,  desc: 'Like a blanket and a good book.', use: 'Animals fed this are extra happy.' },
  sparkling:  { name: 'Sparkling',  color: '#c0f0ff', value: 9,  desc: 'Little lights fizz across the surface.' },
  charged:    { name: 'Charged',    color: '#b0a0ff', value: 10, desc: 'Crackles faintly with static.', use: 'Fertilizer: storm crops grow in any weather.' },
  golden:     { name: 'Golden',     color: '#f5c542', value: 16, desc: 'It literally shines like gold.' },
  shimmering: { name: 'Shimmering', color: '#e0d0ff', value: 12, desc: 'Colours shift when you tilt it.' },
  healing:    { name: 'Healing',    color: '#ff9a9a', value: 8,  desc: 'Mends scrapes and sad moods.', use: 'Fertilizer: revives dormant crops.' },
  bright:     { name: 'Bright',     color: '#fff7c0', value: 6,  desc: 'Cheerful as a sunny morning.' },
  musical:    { name: 'Musical',    color: '#ffb3de', value: 9,  desc: 'Hums a little tune when shaken.', use: 'Bees and animals love it.' },
  sticky:     { name: 'Sticky',     color: '#d9a54a', value: 3,  desc: 'Gets on absolutely everything.' },
  fizzy:      { name: 'Fizzy',      color: '#b8f0b0', value: 7,  desc: 'Bubbles up and tickles your nose.' },
  smoky:      { name: 'Smoky',      color: '#8a8a8a', value: 6,  desc: 'Tastes like a campfire story.' },
  earthy:     { name: 'Earthy',     color: '#9b7b4f', value: 4,  desc: 'Grounded and honest.' },
  floral:     { name: 'Floral',     color: '#f3a3c8', value: 5,  desc: 'A whole meadow in one sip.' },
  minty:      { name: 'Minty',      color: '#9ff0c0', value: 5,  desc: 'Cool and clean.' },
  velvet:     { name: 'Velvet',     color: '#9b3b6b', value: 11, desc: 'Smooth, deep and luxurious.' },
  starry:     { name: 'Starry',     color: '#6b6bd8', value: 12, desc: 'Tiny stars swirl inside.' },
  prismatic:  { name: 'Prismatic',  color: '#ff88ff', value: 22, desc: 'Every colour at once. Very rare.' },
  ancient:    { name: 'Ancient',    color: '#a89070', value: 14, desc: 'Tastes like an old, old story.' },
  wild:       { name: 'Wild',       color: '#6fb04f', value: 6,  desc: 'Untamed and a bit unpredictable.' },
  gentle:     { name: 'Gentle',     color: '#f0e0d0', value: 5,  desc: 'Soft, kind and mild.' },
  mysterious: { name: 'Mysterious', color: '#5a4a7a', value: 13, desc: 'Nobody is quite sure what it does.' },
  sleepy:     { name: 'Sleepy',     color: '#8090c0', value: 6,  desc: 'Yaaawn.' },
  stormy:     { name: 'Stormy',     color: '#5060a0', value: 11, desc: 'A thundercloud in a bottle.' },
  sunny:      { name: 'Sunny',      color: '#ffd84a', value: 8,  desc: 'Bottled summer afternoon.' },
  tangy:      { name: 'Tangy',      color: '#ffa94d', value: 5,  desc: 'Sharp and lively.' },
};

// When BOTH effects of a pair are present after adding an ingredient,
// they fuse into the result (freeing a slot). Checked in this order,
// repeatedly, so chains of fusions can happen.
export const COMBOS = [
  { a: 'sweet',     b: 'sour',       result: 'zesty' },
  { a: 'warm',      b: 'frosty',     result: 'fizzy' },
  { a: 'calming',   b: 'dreamy',     result: 'sleepy' },
  { a: 'glowing',   b: 'starry',     result: 'prismatic' },
  { a: 'earthy',    b: 'wild',       result: 'ancient' },
  { a: 'charged',   b: 'energizing', result: 'stormy' },
  { a: 'floral',    b: 'fragrant',   result: 'velvet' },
  { a: 'bitter',    b: 'sweet',      result: 'cozy' },
  { a: 'smoky',     b: 'savory',     result: 'rich' },
  { a: 'musical',   b: 'dreamy',     result: 'mysterious' },
  { a: 'frosty',    b: 'refreshing', result: 'minty' },
  { a: 'sparkling', b: 'glowing',    result: 'shimmering' },
  { a: 'floaty',    b: 'charged',    result: 'speedy' },
  { a: 'bright',    b: 'warm',       result: 'sunny' },
  { a: 'golden',    b: 'sunny',      result: 'lucky' },
  { a: 'healing',   b: 'gentle',     result: 'calming' },
  { a: 'tangy',     b: 'sweet',      result: 'zesty' },
  { a: 'sticky',    b: 'sweet',      result: 'rich' },
  { a: 'mysterious',b: 'ancient',    result: 'prismatic' },
];

// The maximum number of effects one product can hold.
export const MAX_EFFECTS = 8;
// The maximum number of ingredients you can add to one mix.
export const MAX_STEPS = 10;
