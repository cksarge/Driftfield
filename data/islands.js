// =============================================================
//  ISLANDS — places you can glide to as they drift past.
//
//  zones:     which zones they appear in ('*' = any)
//  seasons:   (optional) only in these seasons (0 spring … 3 winter)
//  chance:    how likely it is to show up when an island passes (weight)
//  distance:  glide range needed (your glider starts at 2)
//  colors:    [grass, rock] for drawing
//  spots:     things to do there. Each costs 1 energy.
//    gather: { item, qty:[min,max], uses }
//    seeds:  { pool:[cropIds], uses }       — gives seeds
//    chest:  { loot:[{ key, qty }] }         — opened once ever
//              keys: any item key, 'bp:<building>' (blueprint),
//                    'recipe:<recipeId>', 'clue:<clueId>'
//    npc:    { character }                   — talk / trade / quests
//    piece:  { piece }                        — recovered lost island piece
//    secret: { chance, loot }                 — only sometimes visible
// =============================================================

export default {
  pebblenook: {
    name: 'Pebblenook', zones: ['sunny', 'windy', 'misty'], chance: 4, distance: 1, colors: ['#8fcf7a', '#9a8f84'],
    desc: 'A friendly little rock covered in driftwood. A good first glide.',
    spots: [
      { type: 'gather', label: 'Driftwood pile', item: 'wood', qty: [3, 5], uses: 2 },
      { type: 'gather', label: 'Loose stones', item: 'stone', qty: [3, 5], uses: 2 },
      { type: 'gather', label: 'Tall grass', item: 'fiber', qty: [3, 6], uses: 1 },
      { type: 'gather', label: 'Herb crack', item: 'wild_herb', qty: [1, 2], uses: 1 },
      { type: 'chest', label: 'Half-buried crate', loot: [{ key: 'old_gear', qty: 2 }, { key: 'recipe:lantern' }] },
    ],
  },
  sunpatch: {
    name: 'Sunpatch Isle', zones: ['sunny', 'ember'], chance: 3, distance: 2, colors: ['#c8e070', '#c09a6a'],
    desc: 'Always basking. A botanist lives in a glass hut here.',
    spots: [
      { type: 'npc', label: 'Glass hut', character: 'fern' },
      { type: 'gather', label: 'Sunstone vein', item: 'sunstone', qty: [1, 2], uses: 1 },
      { type: 'seeds', label: 'Wild sunfruit', pool: ['sunfruit', 'dawn_tomato', 'honey_blossom'], uses: 2 },
      { type: 'gather', label: 'Fruit trees', item: 'rose_hip', qty: [1, 3], uses: 1 },
      { type: 'chest', label: 'Botanist\'s seed box', loot: [{ key: 'recipe:flower_bed' }, { key: 'recipe:planter' }] },
    ],
  },
  mossby_hollow: {
    name: 'Mossby\'s Hollow', zones: ['windy', 'misty'], chance: 3, distance: 2, colors: ['#7fb06f', '#857a6e'],
    desc: 'A mossy island strung with washing lines… of single socks.',
    spots: [
      { type: 'npc', label: 'Crooked cottage', character: 'mossby' },
      { type: 'gather', label: 'Sock pile', item: 'lost_sock', qty: [1, 2], uses: 1 },
      { type: 'gather', label: 'Velvet moss', item: 'velvet_moss', qty: [1, 2], uses: 1 },
      { type: 'piece', label: 'Something familiar…', piece: 'rocking_chair' },
    ],
  },
  whistlecrag: {
    name: 'Whistlecrag', zones: ['windy'], chance: 3, distance: 2, colors: ['#a8d88a', '#9aa0a8'],
    desc: 'Hollow rocks that whistle. Kites tangle in every tree.',
    spots: [
      { type: 'npc', label: 'Kite workshop', character: 'pip' },
      { type: 'seeds', label: 'Whistling reeds', pool: ['windsong_reed', 'breeze_bean', 'sky_wheat'], uses: 2 },
      { type: 'gather', label: 'Bellflowers', item: 'bell_flower', qty: [1, 3], uses: 1 },
      { type: 'gather', label: 'Feather nests', item: 'feather', qty: [2, 4], uses: 1 },
      { type: 'chest', label: 'Tangled kite bag', loot: [{ key: 'recipe:kite' }, { key: 'recipe:wind_chime' }, { key: 'rope', qty: 4 }] },
    ],
  },
  lumen_lighthouse: {
    name: 'Lumen Lighthouse', zones: ['misty', 'frozen'], chance: 3, distance: 3, colors: ['#9fc8a8', '#8a8a96'],
    desc: 'A tall lighthouse run entirely by owls. Lights blink in patterns.',
    spots: [
      { type: 'npc', label: 'Lighthouse door', character: 'owls' },
      { type: 'gather', label: 'Moon dew pools', item: 'moon_dew', qty: [1, 2], uses: 1 },
      { type: 'gather', label: 'Owl feathers', item: 'feather', qty: [2, 3], uses: 1 },
      { type: 'piece', label: 'A bell in the grass', piece: 'family_bell' },
      { type: 'chest', label: 'Logbook shelf', loot: [{ key: 'clue:owl_log' }, { key: 'recipe:lamp_post' }] },
    ],
  },
  cotton_shoal: {
    name: 'Cotton Shoal', zones: ['misty'], chance: 4, distance: 1, colors: ['#e8eef8', '#a8a8b8'],
    desc: 'Half island, half cloud. Squishy underfoot.',
    spots: [
      { type: 'gather', label: 'Cloud puffs', item: 'cloud_puff', qty: [2, 4], uses: 2 },
      { type: 'gather', label: 'Dew-soaked moss', item: 'moon_dew', qty: [1, 1], uses: 1 },
      { type: 'seeds', label: 'Cotton bushes', pool: ['cloud_cotton', 'mist_mint', 'star_lily', 'tea_bush'], uses: 2 },
      { type: 'gather', label: 'Driftwood', item: 'wood', qty: [2, 3], uses: 1 },
    ],
  },
  rimefall: {
    name: 'Rimefall Rock', zones: ['frozen'], chance: 4, distance: 2, colors: ['#e8f4ff', '#9aaabb'],
    desc: 'Icicles hang from its underside like a chandelier.',
    spots: [
      { type: 'gather', label: 'Icicles', item: 'frost_shard', qty: [1, 3], uses: 2 },
      { type: 'seeds', label: 'Frozen garden', pool: ['frost_berry', 'crystal_root', 'drift_carrot', 'moon_melon'], uses: 2 },
      { type: 'gather', label: 'Stone shelf', item: 'stone', qty: [3, 5], uses: 1 },
      { type: 'piece', label: 'A frame in the ice', piece: 'picture_frame' },
    ],
  },
  glacier_bell: {
    name: 'Glacier Bell', zones: ['frozen', 'aurora'], chance: 2, distance: 3, colors: ['#d8ecff', '#8aa0c0'],
    desc: 'A bell-shaped glacier. It rings at midnight.',
    spots: [
      { type: 'gather', label: 'Crystal seam', item: 'sky_crystal', qty: [1, 2], uses: 2 },
      { type: 'gather', label: 'Echo shells', item: 'echo_shell', qty: [1, 1], uses: 1 },
      { type: 'chest', label: 'Frozen chest', loot: [{ key: 'recipe:crystal_lens' }, { key: 'clue:frozen_note' }, { key: 'frost_shard', qty: 3 }] },
    ],
  },
  rustbolt: {
    name: 'Rustbolt Wreck', zones: ['stormy'], chance: 4, distance: 2, colors: ['#7f9a7a', '#6a6a78'],
    desc: 'An old airship crashed into this rock long ago. Full of gears.',
    spots: [
      { type: 'gather', label: 'Scrap heap', item: 'old_gear', qty: [1, 3], uses: 2 },
      { type: 'gather', label: 'Glassed sand', item: 'storm_glass', qty: [1, 2], uses: 1 },
      { type: 'gather', label: 'Thunder moss', item: 'thunder_moss', qty: [1, 2], uses: 1 },
      { type: 'seeds', label: 'Pepper sprouts', pool: ['storm_pepper', 'ember_chili'], uses: 1 },
      { type: 'chest', label: 'Captain\'s locker', loot: [{ key: 'bp:lightning_rod' }, { key: 'clue:wreck_manifest' }] },
      { type: 'piece', label: 'A small dog, barking', piece: 'biscuit' },
    ],
  },
  brindle_roost: {
    name: 'Brindle\'s Roost', zones: ['stormy', 'sunny'], chance: 3, distance: 3, colors: ['#9ac07a', '#7a6a5a'],
    desc: 'A retired pirate ship turned into a house, perched on a cliff.',
    spots: [
      { type: 'npc', label: 'Ship-house', character: 'brindle' },
      { type: 'gather', label: 'Ropes and rigging', item: 'rope', qty: [2, 3], uses: 1 },
      { type: 'gather', label: 'Ship\'s lumber', item: 'plank', qty: [2, 3], uses: 1 },
      { type: 'chest', label: 'Treasure chest (real!)', loot: [{ key: 'deco:pirate_chest' }, { key: 'coins', qty: 150 }] },
    ],
  },
  cinder_cay: {
    name: 'Cinder Cay', zones: ['ember'], chance: 5, distance: 2, colors: ['#c09060', '#6a4a40'],
    desc: 'Black sand and warm vents. Nothing ever freezes here.',
    spots: [
      { type: 'gather', label: 'Glowing vents', item: 'ember_coal', qty: [1, 3], uses: 2 },
      { type: 'gather', label: 'Sunstones', item: 'sunstone', qty: [1, 2], uses: 1 },
      { type: 'gather', label: 'Smokebark trees', item: 'smoke_bark', qty: [1, 2], uses: 1 },
      { type: 'piece', label: 'A glass frame, half melted', piece: 'greenhouse_frame' },
      { type: 'chest', label: 'Volcanic geode', loot: [{ key: 'clue:ember_ash' }, { key: 'sky_crystal', qty: 3 }] },
    ],
  },
  aurora_spire: {
    name: 'Aurora Spire', zones: ['aurora'], chance: 5, distance: 3, colors: ['#7ad0b0', '#4a5a8a'],
    desc: 'A needle of rock where the aurora touches down.',
    spots: [
      { type: 'gather', label: 'Starlit sand', item: 'star_dust', qty: [1, 2], uses: 2 },
      { type: 'gather', label: 'Prism flowers', item: 'prism_petal', qty: [1, 1], uses: 1 },
      { type: 'seeds', label: 'Glimmering fig tree', pool: ['aurora_fig', 'star_lily'], uses: 1 },
      { type: 'chest', label: 'Stone altar', loot: [{ key: 'clue:aurora_carving' }, { key: 'recipe:star_lamp' }] },
    ],
  },
  chime_shoal: {
    name: 'Chime Shoal', zones: ['crystal'], chance: 5, distance: 2, colors: ['#b0f0e0', '#88a8c0'],
    desc: 'Crystals chime when the wind passes through them.',
    spots: [
      { type: 'gather', label: 'Crystal forest', item: 'sky_crystal', qty: [2, 3], uses: 2 },
      { type: 'gather', label: 'Echo shells', item: 'echo_shell', qty: [1, 2], uses: 1 },
      { type: 'gather', label: 'Prism flowers', item: 'prism_petal', qty: [1, 1], uses: 1 },
      { type: 'seeds', label: 'Crystal garden', pool: ['crystal_root', 'windsong_reed'], uses: 1 },
      { type: 'piece', label: 'A sign with your name', piece: 'old_sign' },
      { type: 'chest', label: 'Crystal cache', loot: [{ key: 'deco:crystal_cluster' }, { key: 'clue:crystal_echo' }] },
    ],
  },
  homestead_east: {
    name: 'Homestead Fragment', zones: ['*'], chance: 1, distance: 2, colors: ['#8fcf7a', '#9a8f84'],
    desc: 'Wait… you know this patch of grass. It was part of your island.',
    spots: [
      { type: 'piece', label: 'The old barn', piece: 'old_barn' },
      { type: 'piece', label: 'A fluffy cloud… baaing', piece: 'bramble' },
      { type: 'piece', label: 'Your old scarecrow', piece: 'first_scarecrow' },
      { type: 'gather', label: 'Your old woodpile', item: 'wood', qty: [5, 8], uses: 1 },
    ],
  },
  homestead_west: {
    name: 'Orchard Fragment', zones: ['sunny', 'windy', 'misty', 'frozen'], chance: 1, distance: 2, colors: ['#9ad08a', '#9a8f84'],
    desc: 'Your old orchard corner, still blooming somehow.',
    spots: [
      { type: 'piece', label: 'Your mixing notebook', piece: 'mix_notebook' },
      { type: 'piece', label: 'Hens in a hedge!', piece: 'hens' },
      { type: 'piece', label: 'The old dock', piece: 'old_dock' },
      { type: 'seeds', label: 'Your old orchard', pool: ['sunfruit', 'tea_bush', 'honey_blossom', 'moon_melon'], uses: 2 },
    ],
  },
  velvet_glade: {
    name: 'Velvet Glade', zones: ['sunny', 'misty'], seasons: [0, 1], chance: 2, distance: 2, colors: ['#7acf8a', '#8a7a6a'],
    desc: 'Mushrooms, moss and fizzing berries. Only in spring and summer.',
    spots: [
      { type: 'gather', label: 'Velvet moss', item: 'velvet_moss', qty: [1, 2], uses: 1 },
      { type: 'gather', label: 'Fizzberry bushes', item: 'fizz_berry', qty: [2, 3], uses: 1 },
      { type: 'gather', label: 'Amber trees', item: 'amber_sap', qty: [1, 2], uses: 1 },
      { type: 'chest', label: 'Fairy ring', loot: [{ key: 'deco:mushroom_ring' }, { key: 'recipe:arch' }] },
      { type: 'secret', label: 'A tiny door in a tree', chance: 0.35, loot: [{ key: 'deco:cloud_bench' }, { key: 'clue:tiny_door' }] },
    ],
  },
  sockfall: {
    name: 'Sockfall', zones: ['*'], chance: 0.25, distance: 2, colors: ['#e8a8c8', '#a88a9a'],
    desc: 'Where do all the lost socks go? Here. They go here.',
    spots: [
      { type: 'gather', label: 'Mountain of socks', item: 'lost_sock', qty: [3, 6], uses: 3 },
      { type: 'chest', label: 'The Sock King\'s chest', loot: [{ key: 'deco:sock_line' }, { key: 'clue:sock_secret' }, { key: 'coins', qty: 200 }] },
    ],
  },
  wishing_rock: {
    name: 'Wishing Rock', zones: ['*'], chance: 0.6, distance: 1, colors: ['#a8d8a8', '#8a8a9a'],
    desc: 'An old well on a tiny rock. People leave shells in it.',
    spots: [
      { type: 'chest', label: 'The well', loot: [{ key: 'deco:wishing_well' }, { key: 'coins', qty: 60 }] },
      { type: 'gather', label: 'Wild herbs', item: 'wild_herb', qty: [1, 3], uses: 1 },
      { type: 'secret', label: 'Something glinting at the bottom', chance: 0.3, loot: [{ key: 'glider_wing', qty: 1 }] },
    ],
  },
};
