// =============================================================
//  FESTIVALS — seasonal events among the islands.
//
//  season: 0 spring, 1 summer, 2 autumn, 3 winter
//  day:    day of the season (1-based)
//  contest: 'crop' (judged on value), 'mix' (effects & value),
//           'dye' (judged on how unusual the colour is),
//           'product' (animal products: value & effects),
//           'giant' (crops judged mostly on size),
//           'hybrid' (hybrid crops: generation & rare traits)
//  label:   (optional) what the contest is called in the festival window
//  prizes: items given for entering / for winning
//  special: optional extra behaviour (see js/festivals.js)
// =============================================================

export default {
  sprout_swap: {
    name: 'Sprout Swap', season: 0, day: 3,
    desc: 'Gardeners from every island trade cuttings and show off their strangest crosses. Bring your most unusual hybrid.',
    contest: 'hybrid', label: 'most remarkable hybrid', target: 55,
    prizes: { enter: { 'seed:random_hybrid': 1, 'seed:snow_pea': 3 }, win: { 'deco:swap_sign': 1, festival_ribbon: 1, coins: 150, 'seed:glimmer_grape': 4 } },
  },
  kite_festival: {
    name: 'Kite Festival', season: 0, day: 7,
    desc: 'Kites fill the sky from every island! Enter your most unusual dye in the colour contest.',
    contest: 'dye', target: 40,
    prizes: { enter: { 'deco:bunting': 1 }, win: { 'deco:festival_kite': 1, festival_ribbon: 1, coins: 150 } },
  },
  bloom_parade: {
    name: 'Bloom Parade', season: 1, day: 9,
    desc: 'Flower floats drift past in a long, sweet-smelling line. Show off your best crop.',
    contest: 'crop', target: 60,
    prizes: { enter: { 'seed:honey_blossom': 4 }, win: { 'deco:bloom_crown': 1, festival_ribbon: 1, coins: 150 } },
  },
  honey_fair: {
    name: 'Honey Fair', season: 1, day: 3,
    desc: 'Beekeepers and herders gather on a raft of hay bales. Enter the finest thing your animals have made.',
    contest: 'product', label: 'finest animal product', target: 58,
    prizes: { enter: { 'seed:velvet_rose': 3 }, win: { 'deco:honey_fountain': 1, festival_ribbon: 1, coins: 150 } },
  },
  giant_weighin: {
    name: 'Giant Weigh-In', season: 2, day: 4,
    desc: 'A huge brass scale floats in from the Straits. Whose crop is the biggest in the sky?',
    contest: 'giant', label: 'biggest crop', target: 85,
    prizes: { enter: { 'seed:cinder_squash': 3 }, win: { 'deco:giant_scale': 1, festival_ribbon: 1, coins: 180 } },
  },
  harvest_float: {
    name: 'Harvest Float', season: 2, day: 10,
    desc: 'Every island sends its best mix to the great floating table. Enter the mix contest.',
    contest: 'mix', target: 90,
    prizes: { enter: { 'deco:float_lantern': 1 }, win: { festival_ribbon: 1, coins: 200, glider_wing: 1 } },
  },
  lantern_night: {
    name: 'Lantern Night', season: 3, day: 5,
    desc: 'Everyone lets a paper lantern rise into the winter dark, carrying a wish. Yours drifts off toward the Beacon.',
    contest: null,
    prizes: { enter: { 'deco:sky_lantern': 1, moon_dew: 2, 'seed:snow_pea': 4 } },
  },
  starfall: {
    name: 'Starfall Night', season: 3, day: 12, special: 'starfall',
    desc: 'Stars fall from the sky tonight! Tap the falling stars to catch star dust and rare seeds.',
    contest: null,
    prizes: { enter: { 'deco:star_jar': 1, star_dust: 2 } },
  },
};
