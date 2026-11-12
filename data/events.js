// =============================================================
//  RANDOM EVENTS — small surprises that happen as you drift.
//
//  chance:  chance per morning (before modifiers)
//  zones:   where it can happen ('*' = anywhere)
//  weather: (optional) only with this weather
//  night:   happens in the evening instead of morning
//  give:    items received; 'clue:x' for clues
//  visual:  effect drawn by js/render.js
//  secret:  counts toward the Secrets section of the Discovery Log
//  once:    only ever happens once per save
//  after:   'lit' = only after the Great Sky Beacon is lit
// =============================================================

export default {
  rainbow:       { name: 'A Double Rainbow',     chance: 0.06, zones: '*', weather: 'rain', visual: 'rainbow', text: 'A double rainbow arcs right over the island. Crops feel lucky today.', give: {}, luck: true, secret: true },
  sky_whales:    { name: 'Sky Whales Pass By',   chance: 0.04, zones: ['misty', 'windy', 'aurora'], visual: 'whales', text: 'A pod of sky whales glides beneath the island, singing. A feather-light scale drifts onto the grass.', give: { echo_shell: 1 }, secret: true },
  bird_flock:    { name: 'Migrating Birds',      chance: 0.08, zones: '*', visual: 'birds', text: 'A great flock of sky birds passes overhead, dropping feathers.', give: { feather: 4 } },
  lost_balloon:  { name: 'A Lost Balloon',       chance: 0.05, zones: '*', visual: 'balloon', text: 'A stray balloon snags on your fence. Tied to it: a little bag of seeds!', give: { 'seed:moon_melon': 1, 'seed:star_lily': 1 } },
  sock_rain:     { name: 'It\'s Raining Socks',  chance: 0.02, zones: '*', visual: 'socks', text: 'It\'s… raining socks? Mossby will be thrilled.', give: { lost_sock: 3 }, secret: true },
  bottle_cloud:  { name: 'Message in a Cloud',   chance: 0.03, zones: ['frozen', 'misty'], visual: 'bottle', text: 'A bottle bobs in a small cloud. Inside, a note in frozen ink.', give: { 'clue:frozen_note': 1 }, once: true },
  meteor:        { name: 'A Shooting Star',      chance: 0.04, zones: ['aurora', 'frozen', 'crystal'], night: true, visual: 'meteor', text: 'A shooting star streaks down and lands softly in your field. It leaves star dust behind.', give: { star_dust: 1 }, secret: true },
  crystal_rain:  { name: 'Crystal Hail',         chance: 0.06, zones: ['crystal'], visual: 'crystals', text: 'Tiny crystals tinkle down like hail.', give: { sky_crystal: 2 } },
  ember_drift:   { name: 'Drifting Embers',      chance: 0.08, zones: ['ember'], visual: 'embers', text: 'Glowing embers drift over from the volcanic isles. A few land in your coal bin.', give: { ember_coal: 2 } },
  storm_strike:  { name: 'Lightning Strike',     chance: 0.15, zones: ['stormy'], weather: 'storm', visual: 'lightning', text: 'Lightning strikes the rocks at the island\'s edge, fusing sand into glass.', give: { storm_glass: 1 } },
  sky_jellies:   { name: 'Sky Jellyfish',        chance: 0.04, zones: ['misty', 'aurora', 'crystal'], visual: 'jellies', text: 'Glowing sky jellyfish drift up past the island\'s edge, trailing droplets of moon dew.', give: { moon_dew: 2 }, secret: true },
  ghost_ship:    { name: 'The Ghost Ship',       chance: 0.03, zones: ['stormy', 'misty'], night: true, visual: 'ghostship', text: 'A pale, empty airship glides past in total silence. Something flutters down from its deck: a page from a logbook.', give: { 'clue:ghost_log': 1 }, once: true, secret: true },
  pollen_cloud:  { name: 'A Pollen Cloud',       chance: 0.05, zones: ['sunny', 'windy'], visual: 'pollen', text: 'A golden cloud of pollen from far-off islands settles over your field. One seed in it looks very unusual.', give: { 'seed:random_hybrid': 1 }, secret: true },
  seed_rain:     { name: 'Seed Rain',            chance: 0.06, zones: '*', weather: 'rain', visual: null, text: 'The rain carries seeds from somewhere upwind. A few take root in your bag.', give: { 'seed:snow_pea': 2, 'seed:velvet_rose': 1 } },
  great_comet:   { name: 'The Great Comet',      chance: 0.015, zones: ['aurora', 'frozen', 'crystal'], night: true, visual: 'comet', text: 'A huge comet crosses the whole sky, slowly, like it has somewhere to be. Glittering dust settles everywhere.', give: { star_dust: 3, prism_petal: 1 }, secret: true },
  feather_gust:  { name: 'Feather Gust',         chance: 0.07, zones: '*', weather: 'wind', visual: 'birds', text: 'A gust full of feathers and cloud scraps sweeps across the island.', give: { feather: 6, cloud_puff: 2 } },
  gale_breath:   { name: 'The Gale Sighs',       chance: 0.08, zones: '*', after: 'lit', visual: 'pollen', text: 'A warm, sleepy breeze rolls up from far below the clouds. It leaves a long silver feather behind.', give: { gale_feather: 1 } },
  wild_seedling: { name: 'A Surprise Sprout',    chance: 0.05, zones: '*', visual: null, text: 'The wind blew a strange seed onto your island.', give: { 'seed:random_hybrid': 1 }, secret: true },
};
