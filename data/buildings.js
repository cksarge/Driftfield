// =============================================================
//  BUILDINGS — things you place on your island.
//
//  size:      [width, height] in tiles
//  cost:      items (and 'coins') needed to build
//  weight:    how much it tilts the island (balloons are negative!)
//  art:       which painter in js/art.js draws it
//  roofs:     roof styles the player can choose from (customisable)
//  wall/roof: default colours (dyes can recolour them)
//  blueprint: true = must be unlocked (exploration, story, pieces)
//  light:     glow radius at night (in tiles)
//  power:     needs the repaired windmill to work fully
//  Behaviour is implemented in js/buildings.js keyed by id.
// =============================================================

export const ROOF_STYLES = {
  gable:  { name: 'Gable' },
  round:  { name: 'Round' },
  flat:   { name: 'Flat' },
  spire:  { name: 'Spire' },
  thatch: { name: 'Thatch' },
};

export default {
  house: {
    name: 'Cottage', size: [2, 2], cost: { wood: 20, stone: 10 }, weight: 4, art: 'cottage',
    roofs: ['gable', 'round', 'thatch', 'spire', 'flat'], wall: '#f3e2c3', roof: '#c0584a', light: 2.5,
    desc: 'Home. Sleep here to end the day, and change your outfit.',
  },
  workbench: {
    name: 'Workbench', size: [1, 1], cost: { wood: 5 }, weight: 1, art: 'bench',
    wall: '#b07a45', roof: '#8a5a30', desc: 'Basic crafting. Experiment with any items!',
  },
  workshop: {
    name: 'Workshop', size: [2, 2], cost: { wood: 30, stone: 15, plank: 6 }, weight: 4, art: 'cottage',
    roofs: ['gable', 'flat', 'round'], wall: '#d8b48a', roof: '#6f7f9a', light: 1.5,
    desc: 'Advanced crafting, tool upgrades and glider upgrades.',
  },
  mixing_station: {
    name: 'Mixing Station', size: [2, 1], cost: { wood: 10, stone: 6, jar: 2 }, weight: 2, art: 'mixer',
    wall: '#c98a5a', roof: '#7fb7a8', desc: 'Combine a base with ingredients to discover new products.',
  },
  windmill: {
    name: 'Windmill', size: [2, 2], cost: { wood: 25, stone: 20, rope: 4 }, weight: 4, art: 'windmill',
    roofs: ['spire', 'round'], wall: '#efe4d0', roof: '#a3584a',
    desc: 'Powers machines once repaired: sprinklers reach farther and the mill makes compost.',
  },
  barn: {
    name: 'Barn', size: [3, 2], cost: { wood: 40, stone: 10, plank: 8 }, weight: 5, art: 'barn',
    roofs: ['gable', 'round'], wall: '#c0584a', roof: '#6b4a3a', capacity: 4,
    desc: 'Houses 4 sheep, goats, moths or pups.',
  },
  coop: {
    name: 'Coop', size: [2, 1], cost: { wood: 20, fiber: 10 }, weight: 2, art: 'coop',
    wall: '#e8c07a', roof: '#a06a3a', capacity: 4, desc: 'Houses 4 puff hens.',
  },
  beehive: {
    name: 'Beehive', size: [1, 1], cost: { wood: 8, fiber: 4 }, weight: 1, art: 'hive',
    wall: '#f0c060', roof: '#c08a40', desc: 'Add sky bees. Honey flavour depends on nearby flowers.',
  },
  greenhouse: {
    name: 'Greenhouse', size: [3, 2], cost: { wood: 20, sky_crystal: 6, plank: 6 }, weight: 3, art: 'greenhouse',
    wall: '#e0f4ff', roof: '#9fd8c8', blueprint: true,
    desc: 'Crops within 2 tiles ignore weather and climate.',
  },
  mill: {
    name: 'Mill', size: [2, 2], cost: { wood: 25, stone: 20 }, weight: 5, art: 'mill', power: true,
    roofs: ['gable', 'flat'], wall: '#d9c3a0', roof: '#7a5a40',
    desc: 'Grinds crops into compost. With windmill power it makes 2 compost every day.',
  },
  dock: {
    name: 'Airship Dock', size: [2, 2], cost: { wood: 30, plank: 10, rope: 6 }, weight: 3, art: 'dock',
    wall: '#a87a4a', roof: '#f2e6c8', desc: 'Airship traders visit much more often.',
  },
  market_stall: {
    name: 'Market Stall', size: [2, 1], cost: { wood: 15, fiber: 8, plank: 4 }, weight: 2, art: 'stall',
    wall: '#c08a50', roof: '#f08a8a', desc: 'Sell goods any time (at a lower price). Traders visit more often.',
  },
  weather_vane: {
    name: 'Weather Vane', size: [1, 1], cost: { wood: 6, old_gear: 1 }, weight: 1, art: 'vane',
    wall: '#8a6a4a', roof: '#d0a040', desc: 'Predicts the weather for the next 3 days, storms included.',
  },
  sprinkler: {
    name: 'Sprinkler', size: [1, 1], cost: { stone: 4, old_gear: 1 }, weight: 1, art: 'sprinkler', power: true,
    wall: '#9aa3ad', roof: '#6fb8e8', desc: 'Waters the 8 tiles around it every morning (radius 2 with windmill power).',
  },
  scarecrow: {
    name: 'Scarecrow', size: [1, 1], cost: { wood: 4, fiber: 6 }, weight: 1, art: 'scarecrow',
    wall: '#d8a050', roof: '#8a5a3a', desc: 'Keeps sky birds away from crops within 3 tiles.',
  },
  compost_bin: {
    name: 'Compost Bin', size: [1, 1], cost: { wood: 6 }, weight: 1, art: 'bin',
    wall: '#7a5a3a', roof: '#5a7a3a', desc: 'Makes 1 compost every morning.',
  },
  balloon: {
    name: 'Lift Balloon', size: [1, 1], cost: { cloud_silk: 2, rope: 3 }, weight: -4, art: 'balloon',
    wall: '#ff9a8a', roof: '#ffd1a8', desc: 'Lifts its side of the island. Fixes tilting.',
  },
  counterweight: {
    name: 'Counterweight', size: [1, 1], cost: { stone: 12 }, weight: 5, art: 'weight',
    wall: '#8a8f99', roof: '#6a6f79', desc: 'A heavy stone to balance the island.',
  },
  lightning_rod: {
    name: 'Lightning Rod', size: [1, 1], cost: { stone: 6, old_gear: 2, sky_crystal: 1 }, weight: 1, art: 'rod', blueprint: true,
    wall: '#9aa3ad', roof: '#b0a0ff', desc: 'Catches lightning on storm days and turns it into storm glass.',
  },
  sails: {
    name: 'Sky Sails', size: [2, 1], cost: { sailcloth: 2, plank: 6, rope: 6 }, weight: 2, art: 'sails', blueprint: true,
    wall: '#a87a4a', roof: '#fff6e0', desc: 'Your island drifts 50% faster.',
  },
  rudder: {
    name: 'Rudder', size: [1, 1], cost: { plank: 8, old_gear: 3, rope: 4 }, weight: 2, art: 'rudder', blueprint: true,
    wall: '#8a5a30', roof: '#d0a040', desc: 'Steer! Choose which zone to drift to next on the map.',
  },
  flagpole: {
    name: 'Flagpole', size: [1, 1], cost: { wood: 4, fiber: 4 }, weight: 1, art: 'flag',
    wall: '#8a6a4a', roof: '#ff8a8a', desc: 'Flies your island\'s flag. Design it in Customize.',
  },
};
