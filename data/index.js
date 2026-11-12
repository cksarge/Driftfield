// =============================================================
//  DATA INDEX — one import for all game content.
//  Game logic reads content only through this object, so adding
//  new content means editing the files in /data, never the logic.
// =============================================================

import { EFFECTS, COMBOS, MAX_EFFECTS, MAX_STEPS } from './effects.js';
import BASES from './bases.js';
import { CROPS, LEGENDARIES, FLAVORS, RARE_TRAITS, CLIMATES } from './crops.js';
import ITEMS from './items.js';
import { ANIMALS, ANIMAL_TRAITS } from './animals.js';
import BUILDINGS, { ROOF_STYLES } from './buildings.js';
import DECOR from './decorations.js';
import ZONES, { WEATHER } from './zones.js';
import ISLANDS from './islands.js';
import CHARACTERS from './characters.js';
import TRADERS from './traders.js';
import QUESTS, { DELIVERY_TEMPLATES } from './quests.js';
import { BEACON_STAGES, CLUES, TRUTH, ENDING, CHAPTER_TWO, EPILOGUE } from './story.js';
import RECIPES from './recipes.js';
import PIECES from './pieces.js';
import LAND, { START_ROCK } from './land.js';
import FESTIVALS from './festivals.js';
import EVENTS from './events.js';
import { OUTFITS, HATS, BASE_COLORS, SKIN_TONES, FLAG_PATTERNS } from './clothing.js';
import { TUTORIAL_STEPS, STORM_LINES, WAKE_LINES, EARLY_TIPS } from './tutorial.js';

export const DATA = {
  EFFECTS, COMBOS, MAX_EFFECTS, MAX_STEPS,
  BASES,
  CROPS, LEGENDARIES, FLAVORS, RARE_TRAITS, CLIMATES,
  ITEMS, ANIMALS, ANIMAL_TRAITS, BUILDINGS, ROOF_STYLES, DECOR,
  ZONES, WEATHER, ISLANDS, CHARACTERS, TRADERS,
  QUESTS, DELIVERY_TEMPLATES,
  BEACON_STAGES, CLUES, TRUTH, ENDING, CHAPTER_TWO, EPILOGUE,
  RECIPES, PIECES, LAND, START_ROCK, FESTIVALS, EVENTS,
  OUTFITS, HATS, BASE_COLORS, SKIN_TONES, FLAG_PATTERNS,
  TUTORIAL_STEPS, STORM_LINES, WAKE_LINES, EARLY_TIPS,
};

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const DAYS_PER_SEASON = 14;
