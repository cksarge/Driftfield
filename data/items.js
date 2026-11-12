// =============================================================
//  ITEMS — materials, foraged goods and special story items.
//
//  Crops, seeds, mixes, animal products, decorations and land are
//  generated automatically from their own data files. This file is
//  for everything else.
//
//  kind:   material | forage | special | product
//  value:  base sell price in Shells
//  icon:   { shape, color } used by the icon painter (js/art.js)
//          shapes: log, rock, gem, bundle, jar, puff, shard, coal,
//                  dust, feather, gear, sock, plank, brick, rope,
//                  cloth, compost, honey, egg, bottle, scroll, star,
//                  lens, key, coin, seedbag, glass, leaf, shell
//  mix:    (optional) behaviour as a Mixing Station ingredient
//          { adds: [effect...], transforms: { from: to } }
//  tags:   free-form tags used by recipes ('tag:xyz') and traders
// =============================================================

export default {
  // ---- raw materials -------------------------------------------------
  wood:        { name: 'Driftwood',     kind: 'material', value: 2,  icon: { shape: 'log',   color: '#a0703c' }, desc: 'Wood that has floated through the sky for years.' },
  stone:       { name: 'Sky Stone',     kind: 'material', value: 2,  icon: { shape: 'rock',  color: '#9aa3ad' }, desc: 'Light, porous stone from island undersides.' },
  fiber:       { name: 'Plant Fiber',   kind: 'material', value: 1,  icon: { shape: 'bundle',color: '#9fbf6a' }, desc: 'Stringy stems. Good for rope and feed.' },
  clay:        { name: 'Cloud Clay',    kind: 'material', value: 3,  icon: { shape: 'rock',  color: '#d29a7a' }, desc: 'Soft clay that holds its shape when baked.' },
  sky_crystal: { name: 'Sky Crystal',   kind: 'material', value: 12, icon: { shape: 'gem',   color: '#8fd8ff' }, desc: 'Hums faintly. Used in potions and the Beacon.', mix: { adds: ['sparkling'], transforms: { sparkling: 'shimmering' } } },
  cloud_silk:  { name: 'Cloud Silk',    kind: 'material', value: 8,  icon: { shape: 'cloth', color: '#eef4ff' }, desc: 'Woven by mist moths. Weightless.', mix: { adds: ['floaty'], transforms: { rich: 'velvet' } } },
  storm_glass: { name: 'Storm Glass',   kind: 'material', value: 14, icon: { shape: 'glass', color: '#9c8cf0' }, desc: 'Glass formed where lightning struck sand.', mix: { adds: ['charged'], transforms: { calming: 'charged' } } },
  frost_shard: { name: 'Frost Shard',   kind: 'material', value: 10, icon: { shape: 'shard', color: '#bfe8ff' }, desc: 'Ice that never melts.', mix: { adds: ['frosty'], transforms: { warm: 'refreshing' } } },
  ember_coal:  { name: 'Ember Coal',    kind: 'material', value: 10, icon: { shape: 'coal',  color: '#ff7a3c' }, desc: 'Still warm. Always warm.', mix: { adds: ['warm'], transforms: { frosty: 'smoky' } } },
  star_dust:   { name: 'Star Dust',     kind: 'material', value: 20, icon: { shape: 'dust',  color: '#d8d0ff' }, desc: 'Falls during Starfall nights.', mix: { adds: ['starry'], transforms: { glowing: 'starry', bright: 'glowing' } } },
  feather:     { name: 'Sky Feather',   kind: 'material', value: 3,  icon: { shape: 'feather',color: '#f4f0e8' }, desc: 'Dropped by passing sky birds.', mix: { adds: [], transforms: { sticky: 'floaty', earthy: 'gentle' } } },
  old_gear:    { name: 'Old Gear',      kind: 'material', value: 9,  icon: { shape: 'gear',  color: '#b08a50' }, desc: 'Brass gear from a broken machine. Maybe yours.' },
  plank:       { name: 'Plank',         kind: 'material', value: 6,  icon: { shape: 'plank', color: '#c08a50' }, desc: 'Sawn and sanded.' },
  brick:       { name: 'Brick',         kind: 'material', value: 7,  icon: { shape: 'brick', color: '#c46a4a' }, desc: 'Baked cloud clay.' },
  rope:        { name: 'Rope',          kind: 'material', value: 4,  icon: { shape: 'rope',  color: '#c9a86a' }, desc: 'Twisted plant fiber.' },
  sailcloth:   { name: 'Sailcloth',     kind: 'material', value: 22, icon: { shape: 'cloth', color: '#fff6e0' }, desc: 'Strong enough to catch the sky wind.' },
  jar:         { name: 'Glass Jar',     kind: 'material', value: 2,  icon: { shape: 'jar',   color: '#d8f0ff' }, desc: 'Every mix starts in a jar.' },
  compost:     { name: 'Compost',       kind: 'material', value: 2,  icon: { shape: 'compost',color: '#6b4f2f' }, desc: 'The start of every fertilizer.' },
  crystal_lens:{ name: 'Crystal Lens',  kind: 'material', value: 60, icon: { shape: 'lens',  color: '#c8f0ff' }, desc: 'Focuses light. The Beacon needs these.' },

  // ---- foraged ingredients ------------------------------------------
  cloud_puff:  { name: 'Cloud Puff',    kind: 'forage', value: 4, icon: { shape: 'puff', color: '#ffffff' }, desc: 'A scrap of cloud that stays together.', mix: { adds: ['floaty'], transforms: { savory: 'gentle' } } },
  moon_dew:    { name: 'Moon Dew',      kind: 'forage', value: 9, icon: { shape: 'bottle', color: '#b8c8ff' }, desc: 'Collected on misty nights.', mix: { adds: ['dreamy'], transforms: { warm: 'calming', energizing: 'sleepy' } } },
  sky_salt:    { name: 'Sky Salt',      kind: 'forage', value: 5, icon: { shape: 'dust', color: '#f0f0f0' }, desc: 'Crystallised cloud spray.', mix: { adds: ['savory'], transforms: { bitter: 'savory', sweet: 'tangy' } } },
  sunstone:    { name: 'Sunstone',      kind: 'forage', value: 15, icon: { shape: 'gem', color: '#ffc04a' }, desc: 'Stores daylight.', mix: { adds: ['glowing'], transforms: { frosty: 'warm', gentle: 'bright' } } },
  wild_herb:   { name: 'Wild Herb',     kind: 'forage', value: 3, icon: { shape: 'leaf', color: '#5fae5f' }, desc: 'Grows in rock cracks.', mix: { adds: ['wild'], transforms: { sticky: 'healing' } } },
  bell_flower: { name: 'Bellflower',    kind: 'forage', value: 6, icon: { shape: 'leaf', color: '#c9a0ff' }, desc: 'Rings when the wind blows.', mix: { adds: ['musical'], transforms: { calming: 'dreamy' } } },
  thunder_moss:{ name: 'Thunder Moss',  kind: 'forage', value: 8, icon: { shape: 'leaf', color: '#7d7fb8' }, desc: 'Prickles your fingers.', mix: { adds: ['charged'], transforms: { gentle: 'energizing' } } },
  rose_hip:    { name: 'Sky Rose Hip',  kind: 'forage', value: 5, icon: { shape: 'egg', color: '#e05a5a' }, desc: 'Tart little fruit.', mix: { adds: ['sour'], transforms: { bitter: 'healing' } } },
  smoke_bark:  { name: 'Smokebark',     kind: 'forage', value: 6, icon: { shape: 'log', color: '#6a5a50' }, desc: 'Smells like a campfire.', mix: { adds: ['smoky'], transforms: { refreshing: 'smoky', sweet: 'cozy' } } },
  prism_petal: { name: 'Prism Petal',   kind: 'forage', value: 30, icon: { shape: 'leaf', color: '#ff99ee' }, desc: 'Each petal is a different colour. Very rare.', mix: { adds: ['shimmering'], transforms: { glowing: 'prismatic' } } },
  fizz_berry:  { name: 'Fizzberry',     kind: 'forage', value: 5, icon: { shape: 'egg', color: '#9fe08f' }, desc: 'Pops in your mouth.', mix: { adds: ['fizzy'], transforms: { sour: 'fizzy' } } },
  amber_sap:   { name: 'Amber Sap',     kind: 'forage', value: 7, icon: { shape: 'honey', color: '#e0a030' }, desc: 'Sticky and golden.', mix: { adds: ['sticky'], transforms: { bright: 'golden' } } },
  velvet_moss: { name: 'Velvet Moss',   kind: 'forage', value: 9, icon: { shape: 'leaf', color: '#9b3b6b' }, desc: 'Soft as a kitten.', mix: { adds: ['velvet'], transforms: { earthy: 'cozy' } } },
  echo_shell:  { name: 'Echo Shell',    kind: 'forage', value: 12, icon: { shape: 'shell', color: '#f8d8e0' }, desc: 'Hold it to your ear: you hear the wind.', mix: { adds: ['mysterious'], transforms: { musical: 'mysterious' } } },

  // ---- special / story --------------------------------------------
  lost_sock:      { name: 'Lost Sock',        kind: 'special', value: 1,  icon: { shape: 'sock', color: '#e07a9a' }, desc: 'Just one. Somebody might want it.', tags: ['sock'] },
  tuning_crystal: { name: 'Tuning Crystal',   kind: 'special', value: 0,  icon: { shape: 'gem', color: '#ffffff' }, desc: 'The true heart of the Great Sky Beacon.', noSell: true },
  map_fragment:   { name: 'Old Chart',        kind: 'special', value: 0,  icon: { shape: 'scroll', color: '#e8d8a8' }, desc: 'A torn sky chart.', noSell: true },
  festival_ribbon:{ name: 'Festival Ribbon',  kind: 'special', value: 25, icon: { shape: 'star', color: '#ff9ac0' }, desc: 'Proof of a contest well won.' },
  glider_wing:    { name: 'Glider Wing Kit',  kind: 'special', value: 40, icon: { shape: 'feather', color: '#ffe0a0' }, desc: 'Use at the workshop to upgrade your glider.' },
  beacon_key:     { name: 'Keeper\'s Key',    kind: 'special', value: 0,  icon: { shape: 'key', color: '#f0c050' }, desc: 'An old brass key with an owl on it.', noSell: true },
};
