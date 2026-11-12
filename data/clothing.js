// =============================================================
//  CHARACTER CUSTOMISATION — outfits, hats and default colours.
//
//  unlock: how to get it. 'start' items are available immediately.
//          Others unlock through progress (see js/customize.js):
//          'festival', 'beacon:N' (beacon stage), 'pieces:N' (pieces found),
//          'discoveries:N' (total discoveries), 'quest:<id>'
// =============================================================

export const OUTFITS = {
  overalls:  { name: 'Farm Overalls',   unlock: 'start' },
  sweater:   { name: 'Cozy Sweater',    unlock: 'start' },
  raincoat:  { name: 'Raincoat',        unlock: 'start' },
  apron:     { name: 'Mixing Apron',    unlock: 'discoveries:15' },
  pilot:     { name: 'Glider Jacket',   unlock: 'discoveries:30' },
  captain:   { name: 'Captain\'s Coat', unlock: 'quest:brindle_rudder' },
  keeper:    { name: 'Beacon Keeper\'s Robe', unlock: 'beacon:5' },
};

export const HATS = {
  none:      { name: 'No Hat',          unlock: 'start' },
  straw:     { name: 'Straw Hat',       unlock: 'start' },
  beanie:    { name: 'Beanie',          unlock: 'start' },
  goggles:   { name: 'Flight Goggles',  unlock: 'discoveries:20' },
  flower:    { name: 'Flower Crown',    unlock: 'festival' },
  tricorn:   { name: 'Pirate Tricorn',  unlock: 'quest:brindle_sails' },
  sock:      { name: 'Sock Hat (yes)',  unlock: 'quest:mossby_socks' },
  owl:       { name: 'Owl Ears',        unlock: 'quest:owls_light' },
  crown:     { name: 'Star Crown',      unlock: 'beacon:5' },
};

// Starter palette. Every dye you make adds its colour to this list.
export const BASE_COLORS = ['#e05a5a', '#f5a35b', '#f5d742', '#7fc77f', '#5fb0e0', '#8a7ae0', '#e08ac0', '#f4ecdc', '#6b4f3a', '#3a3a4a'];

export const SKIN_TONES = ['#ffe0c8', '#f2c6a0', '#d9a37a', '#b07850', '#8a5a3a', '#5e3d2a'];

export const FLAG_PATTERNS = ['solid', 'stripe', 'split', 'cross', 'star', 'circle', 'chevron', 'checker'];
