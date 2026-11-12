// =============================================================
//  CRAFTING RECIPES
//
//  inputs:  { key: qty } — item keys, or 'tag:x' / 'kind:x' for any
//           item with that tag / kind (e.g. 'kind:dye' = any dye)
//  output:  { key: qty } — any item key (deco:, bld:, material…)
//  station: 'bench' (Workbench) or 'workshop' (Workshop needed)
//  known:   true = shown from the start
//           otherwise it's discovered by experimenting at the bench
//           (putting in exactly the right items) or by finding
//           a blueprint/recipe ('recipe:<id>' items) while exploring.
//  hint:    a gentle nudge shown for undiscovered recipes
// =============================================================

export default {
  // ---- basics (known) ----
  plank:     { inputs: { wood: 2 }, output: { plank: 1 }, station: 'bench', known: true },
  rope:      { inputs: { fiber: 3 }, output: { rope: 1 }, station: 'bench', known: true },
  jar:       { inputs: { stone: 1 }, output: { jar: 2 }, station: 'bench', known: true },
  compost:   { inputs: { fiber: 2 }, output: { compost: 1 }, station: 'bench', known: true },
  brick:     { inputs: { clay: 1, stone: 1 }, output: { brick: 2 }, station: 'bench', known: true },
  wood_path: { inputs: { wood: 2 }, output: { 'deco:wood_path': 2 }, station: 'bench', known: true },
  stone_path:{ inputs: { stone: 2 }, output: { 'deco:stone_path': 2 }, station: 'bench', known: true },
  fence:     { inputs: { wood: 2, fiber: 1 }, output: { 'deco:fence': 2 }, station: 'bench', known: true },
  bench:     { inputs: { plank: 2 }, output: { 'deco:bench': 1 }, station: 'bench', known: true },

  // ---- discovered by experiment or found ----
  lantern:     { inputs: { fiber: 2, ember_coal: 1 }, output: { 'deco:lantern': 2 }, station: 'bench', hint: 'Something that burns, wrapped in something that bends.' },
  wind_chime:  { inputs: { feather: 1, sky_crystal: 1, rope: 1 }, output: { 'deco:wind_chime': 1 }, station: 'bench', hint: 'Something light, something that rings, and something to hang it on.' },
  flower_bed:  { inputs: { wood: 2, 'crop:honey_blossom': 2 }, output: { 'deco:flower_bed': 1 }, station: 'bench', hint: 'A box of wood and a few blooms bees adore.' },
  planter:     { inputs: { brick: 1, wild_herb: 2 }, output: { 'deco:planter': 1 }, station: 'bench', hint: 'Baked clay and something green.' },
  hammock:     { inputs: { rope: 3, cloud_silk: 1 }, output: { 'deco:hammock': 1 }, station: 'bench', hint: 'Plenty of rope and something soft.' },
  kite:        { inputs: { plank: 1, cloud_silk: 1, 'kind:dye': 1 }, output: { 'deco:kite': 1 }, station: 'bench', hint: 'A frame, a sail and a splash of colour.' },
  bunting:     { inputs: { rope: 1, 'kind:dye': 2 }, output: { 'deco:bunting': 2 }, station: 'bench', hint: 'A line strung with two colours.' },
  bird_bath:   { inputs: { stone: 4, moon_dew: 1 }, output: { 'deco:bird_bath': 1 }, station: 'bench', hint: 'A stone bowl, filled with something dewy.' },
  sundial:     { inputs: { stone: 3, sunstone: 1 }, output: { 'deco:sundial': 1 }, station: 'bench', hint: 'Stone that tells time, with a little stored sunlight.' },
  topiary:     { inputs: { 'crop:tea_bush': 3, cloud_puff: 1 }, output: { 'deco:topiary': 1 }, station: 'bench', hint: 'Leafy crops trimmed into the shape of the sky.' },
  picnic:      { inputs: { fiber: 4, 'kind:dye': 1 }, output: { 'deco:picnic': 1 }, station: 'bench', hint: 'Woven fibers with a dash of colour.' },
  arch:        { inputs: { plank: 2, 'crop:honey_blossom': 3 }, output: { 'deco:arch': 1 }, station: 'bench', hint: 'Planks woven with plenty of flowers.' },
  swing:       { inputs: { rope: 2, plank: 1, wood: 2 }, output: { 'deco:swing': 1 }, station: 'bench', hint: 'Rope, a seat, and a branch to hang from.' },
  bridge:      { inputs: { plank: 4, rope: 2 }, output: { 'deco:bridge': 1 }, station: 'bench', hint: 'Lots of planks, tied together.' },
  lamp_post:   { inputs: { stone: 2, old_gear: 1, ember_coal: 1 }, output: { 'deco:lamp_post': 1 }, station: 'workshop', hint: 'A proper lamp: stone, metal and a flame.' },
  telescope:   { inputs: { crystal_lens: 1, old_gear: 1, plank: 1 }, output: { 'deco:telescope': 1 }, station: 'workshop', hint: 'A lens, a gear and something to stand on.' },
  star_lamp:   { inputs: { star_dust: 1, jar: 1, rope: 1 }, output: { 'deco:star_lamp': 1 }, station: 'bench', hint: 'Catch a star in a jar and hang it up.' },
  crystal_lens:{ inputs: { sky_crystal: 2, frost_shard: 1 }, output: { crystal_lens: 1 }, station: 'workshop', hint: 'Crystal ground cold. Very cold.' },
  sailcloth:   { inputs: { cloud_silk: 2, rope: 1 }, output: { sailcloth: 1 }, station: 'workshop', hint: 'Weightless cloth, stitched strong.' },
  land_small:  { inputs: { stone: 8, clay: 2, compost: 2 }, output: { 'land:pebble': 1 }, station: 'bench', known: true },
  land_medium: { inputs: { stone: 20, clay: 5, compost: 4 }, output: { 'land:square': 1 }, station: 'workshop', known: true },
  land_long:   { inputs: { stone: 18, clay: 4, compost: 3, rope: 2 }, output: { 'land:long': 1 }, station: 'workshop', hint: 'More stone, clay and compost, tied with rope.' },
  clay:        { inputs: { stone: 1, moon_dew: 1 }, output: { clay: 3 }, station: 'bench', hint: 'Stone softened with dew.' },
  clay2:       { inputs: { stone: 2, cloud_puff: 1 }, output: { clay: 2 }, station: 'bench', known: true },
  sky_crystal: { inputs: { star_dust: 1, stone: 3 }, output: { sky_crystal: 2 }, station: 'workshop', hint: 'Stardust, pressed into stone.' },
  feed_bag:    { inputs: { fiber: 3, 'crop:sky_wheat': 2 }, output: { compost: 1, fiber: 1 }, station: 'bench', hint: 'Fiber and grain… you know, this just makes a mess.' },
  trophy:      { inputs: { festival_ribbon: 2, old_gear: 1 }, output: { 'deco:ribbon_trophy': 1 }, station: 'workshop', hint: 'Two ribbons and a little brass.' },
};
