// =============================================================
//  CROPS — base crops, trait tables, and legendary crops.
//
//  Every crop is described by TRAITS. Crossbreeding (js/breeding.js)
//  mixes traits from two parents, so new varieties emerge on their own.
//
//  traits:
//    hue      0-360 colour wheel position of the produce
//    size     1-5
//    flavor   key of FLAVORS below
//    growth   in-game days from planting to harvest
//    climates list of CLIMATES the crop is happy in
//    yield    produce per harvest (1-5)
//    rare     list of RARE_TRAITS keys
//  shape:     how it is drawn: round | long | leafy | flower | bush | grain | pod | melon
//  seedPrice: price at traders (0 = cannot be bought)
//  needsWeather: (optional) only grows on days with this weather
//  mix:       (optional) extra mixing behaviour when used as an ingredient
//             { adds: [...effects], transforms: { fromEffect: toEffect } }
// =============================================================

export const CLIMATES = {
  warm:      { name: 'Warm',      color: '#f4a259' },
  temperate: { name: 'Temperate', color: '#8cc084' },
  cold:      { name: 'Cold',      color: '#9fd3f0' },
  misty:     { name: 'Misty',     color: '#c9c3e6' },
  stormy:    { name: 'Stormy',    color: '#7d7fb8' },
  windy:     { name: 'Windy',     color: '#b8e0d2' },
};

// Each flavour gives the crop an effect when used at the Mixing Station.
export const FLAVORS = {
  sweet:  { name: 'Sweet',  effect: 'sweet' },
  sour:   { name: 'Sour',   effect: 'sour' },
  spicy:  { name: 'Spicy',  effect: 'warm' },
  savory: { name: 'Savory', effect: 'savory' },
  bitter: { name: 'Bitter', effect: 'bitter' },
  minty:  { name: 'Minty',  effect: 'minty' },
  floral: { name: 'Floral', effect: 'floral' },
  earthy: { name: 'Earthy', effect: 'earthy' },
  tangy:  { name: 'Tangy',  effect: 'tangy' },
};

// Rare traits: passed down through breeding, appear through mutation.
// prefix is used when naming hybrids; effect is added when mixing.
export const RARE_TRAITS = {
  glowing:    { name: 'Glowing',    prefix: 'Glow',     effect: 'glowing',    value: 20 },
  floating:   { name: 'Floating',   prefix: 'Puff',     effect: 'floaty',     value: 18 },
  golden:     { name: 'Golden',     prefix: 'Gilded',   effect: 'golden',     value: 30 },
  frosted:    { name: 'Frosted',    prefix: 'Rime',     effect: 'frosty',     value: 10 },
  crystal:    { name: 'Crystal',    prefix: 'Crystal',  effect: 'sparkling',  value: 22 },
  singing:    { name: 'Singing',    prefix: 'Humming',  effect: 'musical',    value: 18 },
  starry:     { name: 'Starry',     prefix: 'Star',     effect: 'starry',     value: 24 },
  shimmering: { name: 'Shimmering', prefix: 'Shimmer',  effect: 'shimmering', value: 20 },
  charged:    { name: 'Charged',    prefix: 'Volt',     effect: 'charged',    value: 16 },
  dreamy:     { name: 'Dreamy',     prefix: 'Dream',    effect: 'dreamy',     value: 14 },
  striped:    { name: 'Striped',    prefix: 'Tiger',    effect: 'wild',       value: 8 },
  ancient:    { name: 'Ancient',    prefix: 'Elder',    effect: 'ancient',    value: 26 },
};

export const CROPS = {
  sky_wheat: {
    name: 'Sky Wheat', shape: 'grain', seedPrice: 8,
    desc: 'Golden grain that sways toward the wind.',
    traits: { hue: 45, size: 2, flavor: 'earthy', growth: 3, climates: ['temperate', 'windy'], yield: 3, rare: [] },
  },
  sunfruit: {
    name: 'Sunfruit', shape: 'round', seedPrice: 14,
    desc: 'Warm to the touch, even at night.',
    traits: { hue: 38, size: 3, flavor: 'sweet', growth: 4, climates: ['warm'], yield: 2, rare: ['golden'] },
    mix: { transforms: { frosty: 'warm', sleepy: 'energizing' } },
  },
  cloud_cotton: {
    name: 'Cloud Cotton', shape: 'bush', seedPrice: 12,
    desc: 'Fluffy bolls that drift off if you don\'t pick them.',
    traits: { hue: 210, size: 2, flavor: 'sweet', growth: 4, climates: ['misty'], yield: 3, rare: ['floating'] },
    mix: { transforms: { sticky: 'floaty' } },
  },
  frost_berry: {
    name: 'Frost Berry', shape: 'bush', seedPrice: 12,
    desc: 'Tiny blue berries, crunchy with ice.',
    traits: { hue: 205, size: 1, flavor: 'tangy', growth: 3, climates: ['cold'], yield: 4, rare: ['frosted'] },
    mix: { transforms: { warm: 'refreshing', cozy: 'frosty' } },
  },
  storm_pepper: {
    name: 'Storm Pepper', shape: 'long', seedPrice: 18, needsWeather: 'storm',
    desc: 'Only grows on days when lightning flashes.',
    traits: { hue: 265, size: 2, flavor: 'spicy', growth: 2, climates: ['stormy'], yield: 2, rare: ['charged'] },
    mix: { transforms: { calming: 'energizing', sleepy: 'charged' } },
  },
  breeze_bean: {
    name: 'Breeze Bean', shape: 'pod', seedPrice: 6,
    desc: 'Pods rattle like wind chimes.',
    traits: { hue: 110, size: 2, flavor: 'savory', growth: 3, climates: ['windy', 'temperate'], yield: 3, rare: [] },
  },
  moon_melon: {
    name: 'Moon Melon', shape: 'melon', seedPrice: 20,
    desc: 'Pale and round, it brightens on cloudy nights.',
    traits: { hue: 190, size: 5, flavor: 'sweet', growth: 6, climates: ['misty', 'cold'], yield: 1, rare: ['dreamy'] },
    mix: { transforms: { energizing: 'dreamy' } },
  },
  honey_blossom: {
    name: 'Honey Blossom', shape: 'flower', seedPrice: 8, flower: true,
    desc: 'Bees adore it. Smells like honey toast.',
    traits: { hue: 330, size: 1, flavor: 'floral', growth: 2, climates: ['warm', 'temperate'], yield: 2, rare: [] },
  },
  drift_carrot: {
    name: 'Drift Carrot', shape: 'leafy', seedPrice: 5,
    desc: 'Reliable, crunchy, grows almost anywhere.',
    traits: { hue: 25, size: 2, flavor: 'earthy', growth: 2, climates: ['temperate', 'cold', 'windy'], yield: 2, rare: [] },
  },
  mist_mint: {
    name: 'Mist Mint', shape: 'leafy', seedPrice: 7,
    desc: 'Leaves bead with dew all day long.',
    traits: { hue: 150, size: 1, flavor: 'minty', growth: 2, climates: ['misty', 'cold'], yield: 3, rare: [] },
    mix: { transforms: { warm: 'minty', smoky: 'refreshing' } },
  },
  ember_chili: {
    name: 'Ember Chili', shape: 'long', seedPrice: 12,
    desc: 'Glows red like a coal. Hot hot hot.',
    traits: { hue: 5, size: 1, flavor: 'spicy', growth: 3, climates: ['warm', 'stormy'], yield: 3, rare: [] },
    mix: { transforms: { frosty: 'smoky' } },
  },
  puff_pumpkin: {
    name: 'Puff Pumpkin', shape: 'melon', seedPrice: 15,
    desc: 'So light it bobs at the end of its vine.',
    traits: { hue: 28, size: 4, flavor: 'savory', growth: 5, climates: ['temperate', 'windy'], yield: 1, rare: [] },
  },
  star_lily: {
    name: 'Star Lily', shape: 'flower', seedPrice: 16, flower: true,
    desc: 'Opens only after dark.',
    traits: { hue: 260, size: 1, flavor: 'floral', growth: 4, climates: ['misty'], yield: 2, rare: ['starry'] },
    mix: { transforms: { bright: 'starry' } },
  },
  crystal_root: {
    name: 'Crystal Root', shape: 'leafy', seedPrice: 0,
    desc: 'A root that grows little quartz facets. Found, not bought.',
    traits: { hue: 180, size: 2, flavor: 'bitter', growth: 5, climates: ['cold'], yield: 1, rare: ['crystal'] },
    mix: { transforms: { sparkling: 'prismatic' } },
  },
  tea_bush: {
    name: 'Tea Bush', shape: 'bush', seedPrice: 9,
    desc: 'Young leaves make the best tea.',
    traits: { hue: 95, size: 2, flavor: 'bitter', growth: 3, climates: ['temperate', 'misty'], yield: 3, rare: [] },
    mix: { transforms: { energizing: 'calming' } },
  },
  dawn_tomato: {
    name: 'Dawn Tomato', shape: 'round', seedPrice: 7,
    desc: 'Ripens pink like the morning sky.',
    traits: { hue: 355, size: 2, flavor: 'tangy', growth: 3, climates: ['warm', 'temperate'], yield: 3, rare: [] },
  },
  windsong_reed: {
    name: 'Windsong Reed', shape: 'grain', seedPrice: 0,
    desc: 'Hollow stalks that whistle in the wind. Found on windy islands.',
    traits: { hue: 80, size: 3, flavor: 'earthy', growth: 3, climates: ['windy'], yield: 2, rare: ['singing'] },
  },
  aurora_fig: {
    name: 'Aurora Fig', shape: 'round', seedPrice: 0,
    desc: 'Its skin ripples with green and violet light.',
    traits: { hue: 290, size: 2, flavor: 'sweet', growth: 5, climates: ['cold', 'misty'], yield: 2, rare: ['shimmering'] },
  },
};

// =============================================================
//  LEGENDARY CROPS — only made through specific breeding.
//  When a hybrid is created, each legendary's `requires` is checked;
//  if it matches, the seed becomes the legendary instead.
//
//  requires:
//    rare:       all of these rare traits on the hybrid
//    flavor:     hybrid flavour
//    minSize:    hybrid size at least
//    minGen:     generation at least (base crops are gen 0)
//    zone:       you must be in this zone when breeding happens
//    weather:    current weather must be this
//    lineage:    all of these base crops among the hybrid's ancestors
//    hueRange:   [min, max] hue
// =============================================================
export const LEGENDARIES = {
  beacon_bloom: {
    name: 'Beacon Bloom', shape: 'flower', legendary: true, flower: true,
    desc: 'A flower that hums with the same light as the Great Sky Beacon.',
    hint: 'Said to need light, crystal and song in one bloom.',
    traits: { hue: 50, size: 3, flavor: 'floral', growth: 6, climates: ['misty', 'cold', 'temperate'], yield: 1, rare: ['glowing', 'crystal', 'singing'] },
    requires: { rare: ['glowing', 'crystal', 'singing'] },
  },
  starfall_lotus: {
    name: 'Starfall Lotus', shape: 'flower', legendary: true, flower: true,
    desc: 'Petals like a falling sky. Only bred under the aurora.',
    hint: 'A floating star, bred where the sky dances.',
    traits: { hue: 240, size: 3, flavor: 'floral', growth: 5, climates: ['misty', 'cold'], yield: 2, rare: ['starry', 'floating', 'glowing'] },
    requires: { rare: ['starry', 'floating'], zone: 'aurora' },
  },
  thunderheart_melon: {
    name: 'Thunderheart Melon', shape: 'melon', legendary: true,
    desc: 'A huge melon that rumbles quietly. Hold it and your hair stands up.',
    hint: 'Something big and spicy, bred in a storm.',
    traits: { hue: 260, size: 5, flavor: 'spicy', growth: 4, climates: ['stormy', 'temperate'], yield: 2, rare: ['charged'] },
    requires: { flavor: 'spicy', minSize: 3, weather: 'storm' },
  },
  everfrost_rose: {
    name: 'Everfrost Rose', shape: 'flower', legendary: true, flower: true,
    desc: 'A blue rose that never melts.',
    hint: 'A blue, frosted flower of a careful lineage.',
    traits: { hue: 210, size: 2, flavor: 'floral', growth: 5, climates: ['cold'], yield: 2, rare: ['frosted', 'crystal'] },
    requires: { rare: ['frosted'], flavor: 'floral', hueRange: [180, 250], minGen: 2 },
  },
  sunspun_wheat: {
    name: 'Sunspun Wheat', shape: 'grain', legendary: true,
    desc: 'Grain spun from sunlight. Bakes into impossibly fluffy bread.',
    hint: 'Wheat that remembers the sun.',
    traits: { hue: 48, size: 3, flavor: 'sweet', growth: 3, climates: ['warm', 'temperate', 'windy'], yield: 5, rare: ['golden'] },
    requires: { rare: ['golden'], lineage: ['sky_wheat', 'sunfruit'] },
  },
  emberheart_pepper: {
    name: 'Emberheart Pepper', shape: 'long', legendary: true,
    desc: 'Warm enough to heat a whole cottage.',
    hint: 'A glowing spice, bred near the Ember Isles.',
    traits: { hue: 15, size: 2, flavor: 'spicy', growth: 3, climates: ['warm', 'stormy', 'cold'], yield: 3, rare: ['glowing', 'charged'] },
    requires: { rare: ['glowing'], flavor: 'spicy', zone: 'ember' },
  },
  dreamcloud_berry: {
    name: 'Dreamcloud Berry', shape: 'bush', legendary: true,
    desc: 'Eat one and you\'ll dream of flying.',
    hint: 'Dreamy and floating, deep in the mist.',
    traits: { hue: 275, size: 1, flavor: 'sweet', growth: 3, climates: ['misty'], yield: 4, rare: ['dreamy', 'floating', 'shimmering'] },
    requires: { rare: ['dreamy', 'floating'], zone: 'misty', minGen: 2 },
  },
  ancient_oak_apple: {
    name: 'Elderwood Apple', shape: 'round', legendary: true,
    desc: 'The kind of apple that was old when the islands first floated.',
    hint: 'A long, long family tree.',
    traits: { hue: 0, size: 3, flavor: 'sweet', growth: 6, climates: ['temperate', 'windy', 'cold', 'warm'], yield: 3, rare: ['ancient', 'golden'] },
    requires: { minGen: 6 },
  },
};
