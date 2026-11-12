// =============================================================
//  TRADERS — airship merchants that dock at your island.
//
//  zones:   where they fly ('*' = everywhere)
//  weight:  how often they show up compared to others
//  hull / balloon: airship colours
//  likes:   price multipliers when they BUY from you
//           bases:   { mixBaseId: mult }
//           effects: { effectId: mult }   (each matching effect stacks)
//           kinds:   { itemKind: mult }   (crop, mix, dye, product, material…)
//           rare:    mult for each rare trait on a crop
//  sells:   { key, price, stock }  (prices shift with the season)
//  seasonal:{ seasonIndex: mult } on what they pay
//  greeting: what they say when docking
// =============================================================

export default {
  marigold: {
    name: 'Captain Marigold', ship: 'The Marigold', zones: '*', weight: 5, hull: '#a0683a', balloon: '#f5b041',
    greeting: 'Ahoy, neighbour! Seeds, jars and gossip. Two of those are for sale.',
    likes: { kinds: { crop: 1.1 }, bases: { jam: 1.3, soup: 1.2 } },
    seasonal: { 2: 1.15 },
    sells: [
      { key: 'seed:sky_wheat', price: 8, stock: 12 }, { key: 'seed:drift_carrot', price: 5, stock: 12 },
      { key: 'seed:breeze_bean', price: 6, stock: 10 }, { key: 'seed:dawn_tomato', price: 7, stock: 10 },
      { key: 'seed:tea_bush', price: 9, stock: 8 }, { key: 'jar', price: 3, stock: 20 },
      { key: 'wood', price: 3, stock: 30 }, { key: 'stone', price: 3, stock: 30 }, { key: 'compost', price: 3, stock: 10 },
    ],
  },
  humblebee: {
    name: 'Bumble & Daughters', ship: 'The Humblebee', zones: ['sunny', 'windy', 'misty'], weight: 3, hull: '#e0b040', balloon: '#4a3a2a',
    greeting: 'Bzz-hello! Honey buyers, flower lovers, hive builders.',
    likes: { kinds: { product: 1.3 }, bases: { honey: 1.6, tea: 1.2 }, effects: { floral: 1.2, sweet: 1.1 } },
    seasonal: { 0: 1.2 },
    sells: [
      { key: 'seed:honey_blossom', price: 8, stock: 10 }, { key: 'seed:star_lily', price: 16, stock: 4 },
      { key: 'animal:sky_bee', price: 90, stock: 2 }, { key: 'deco:flower_bed', price: 40, stock: 2 },
    ],
  },
  frostline: {
    name: 'Old Vasha', ship: 'Frostline Freighter', zones: ['frozen', 'misty', 'aurora'], weight: 3, hull: '#6a8ab0', balloon: '#e8f4ff',
    greeting: 'Brr. You have anything warm? I pay well for warm.',
    likes: { effects: { warm: 1.5, cozy: 1.4, smoky: 1.2 }, bases: { soup: 1.3 } },
    seasonal: { 3: 1.3 },
    sells: [
      { key: 'seed:frost_berry', price: 12, stock: 10 }, { key: 'seed:moon_melon', price: 20, stock: 4 },
      { key: 'seed:mist_mint', price: 7, stock: 10 }, { key: 'frost_shard', price: 18, stock: 5 },
      { key: 'animal:mist_moth', price: 160, stock: 1 },
    ],
  },
  ember_express: {
    name: 'Sizzle', ship: 'Ember Express', zones: ['ember', 'sunny', 'stormy'], weight: 2, hull: '#5a3a3a', balloon: '#ff7a3c',
    greeting: 'Hot deals! Hot coals! Hot… well, everything, really.',
    likes: { effects: { frosty: 1.6, refreshing: 1.5, minty: 1.3 }, bases: { juice: 1.3 } },
    seasonal: { 1: 1.2 },
    sells: [
      { key: 'seed:ember_chili', price: 12, stock: 10 }, { key: 'seed:sunfruit', price: 14, stock: 8 },
      { key: 'ember_coal', price: 16, stock: 6 }, { key: 'sunstone', price: 24, stock: 3 },
      { key: 'seed:storm_pepper', price: 18, stock: 5 },
    ],
  },
  wonders: {
    name: 'Madame Oddleaf', ship: 'Wandering Wonders', zones: '*', weight: 1, hull: '#4a3a6a', balloon: '#b98ae8',
    greeting: 'Ooh. Curiosities! I adore curiosities. Show me something no one has seen.',
    likes: { rare: 1.5, kinds: { mix: 1.2 }, effects: { prismatic: 2, mysterious: 1.5, ancient: 1.5, shimmering: 1.3 } },
    sells: [
      { key: 'recipe:telescope', price: 150, stock: 1 }, { key: 'recipe:star_lamp', price: 180, stock: 1 },
      { key: 'bp:greenhouse', price: 400, stock: 1 }, { key: 'prism_petal', price: 60, stock: 2 },
      { key: 'echo_shell', price: 30, stock: 3 }, { key: 'glider_wing', price: 220, stock: 1 },
    ],
  },
  woolly: {
    name: 'Ma Baabara', ship: 'The Woolly Wagon', zones: ['sunny', 'windy', 'misty', 'frozen'], weight: 3, hull: '#c09060', balloon: '#ffffff',
    greeting: 'Animals! Lovely, fluffy animals! And the things they make.',
    likes: { kinds: { product: 1.4 }, bases: { feed: 1.2 } },
    sells: [
      { key: 'animal:cloud_sheep', price: 120, stock: 2 }, { key: 'animal:float_goat', price: 140, stock: 2 },
      { key: 'animal:puff_hen', price: 60, stock: 3 }, { key: 'fiber', price: 2, stock: 30 },
    ],
  },
  rainbow: {
    name: 'Tint & Hue', ship: 'The Rainbow Kettle', zones: ['windy', 'sunny', 'crystal'], weight: 2, hull: '#e86a8a', balloon: '#7ad0f0',
    greeting: 'Colour! We buy colour! We sell colour! We ARE colour!',
    likes: { kinds: { dye: 1.8 }, effects: { bright: 1.3, prismatic: 2, shimmering: 1.4 } },
    sells: [
      { key: 'jar', price: 2, stock: 30 }, { key: 'recipe:bunting', price: 60, stock: 1 },
      { key: 'cloud_silk', price: 14, stock: 6 }, { key: 'amber_sap', price: 12, stock: 4 },
    ],
  },
};
