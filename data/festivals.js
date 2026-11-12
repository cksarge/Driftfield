// =============================================================
//  FESTIVALS — seasonal events among the islands.
//
//  season: 0 spring, 1 summer, 2 autumn, 3 winter
//  day:    day of the season (1-based)
//  contest: 'crop' (judged on value), 'mix' (effects & value),
//           'dye' (judged on how unusual the colour is)
//  prizes: items given for entering / for winning
//  special: optional extra behaviour (see js/festivals.js)
// =============================================================

export default {
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
  harvest_float: {
    name: 'Harvest Float', season: 2, day: 10,
    desc: 'Every island sends its best mix to the great floating table. Enter the mix contest.',
    contest: 'mix', target: 90,
    prizes: { enter: { 'deco:float_lantern': 1 }, win: { festival_ribbon: 1, coins: 200, glider_wing: 1 } },
  },
  starfall: {
    name: 'Starfall Night', season: 3, day: 12, special: 'starfall',
    desc: 'Stars fall from the sky tonight! Tap the falling stars to catch star dust and rare seeds.',
    contest: null,
    prizes: { enter: { 'deco:star_jar': 1, star_dust: 2 } },
  },
};
