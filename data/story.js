// =============================================================
//  STORY — the Great Sky Beacon and the mystery of the storm.
//
//  BEACON_STAGES: repaired in order from the Journal → Beacon tab.
//    needs uses the same format as quests (data/quests.js).
//  CLUES: found in chests, quests and events. When the player has
//    found every clue marked `core`, the truth is revealed.
// =============================================================

export const BEACON_STAGES = [
  {
    title: 'Clear the Rubble',
    desc: 'The Beacon\'s base is buried in storm debris. Haul it away and shore up the foundation.',
    needs: [{ item: 'stone', qty: 25 }, { item: 'wood', qty: 25 }],
    say: 'The foundation is clear! It\'s a start. A real start.',
  },
  {
    title: 'Rebuild the Frame',
    desc: 'The tower frame is twisted. It needs planks, gears and storm glass, which only forms in the Thunderhead Expanse.',
    needs: [{ item: 'plank', qty: 12 }, { item: 'old_gear', qty: 6 }, { item: 'storm_glass', qty: 4 }],
    say: 'The frame stands again! I can see it from here: a little crooked, a lot brave.',
  },
  {
    title: 'Polish the Lenses',
    desc: 'The great lenses shattered. Grind new ones, chill them with frost shards, and anoint them with a Glowing potion.',
    needs: [{ item: 'crystal_lens', qty: 2 }, { item: 'frost_shard', qty: 6 }, { mix: { base: 'potion', effects: ['glowing'] }, qty: 1 }],
    say: 'The lenses catch the light… but there\'s nothing inside to shine. The heart is missing.',
  },
  {
    title: 'Restore the Heart',
    desc: 'The Beacon needs its true Tuning Crystal. The one inside was… a fake? Find the real one.',
    needs: [{ item: 'tuning_crystal', qty: 1 }],
    say: 'It fits perfectly. It\'s humming! Just one last thing: it needs to bloom.',
  },
  {
    title: 'Light the Beacon',
    desc: 'Legend says the Beacon was first lit with a Beacon Bloom and a handful of stars.',
    needs: [{ item: 'crop:beacon_bloom', qty: 1 }, { item: 'star_dust', qty: 5 }],
    say: 'Look! LOOK! The Great Sky Beacon is shining again!',
  },
];

export const CLUES = {
  owl_log:            { core: true, title: 'The Owls\' Logbook', text: 'Night 4,012. Beacon pitch drifting flat again. Requested a new tuning crystal from the Keepers\' Guild. No reply. Night 5,880: still flat. Hoot is worried. So am I. —T.' },
  frozen_note:        { core: true, title: 'A Frozen Note', text: '"The Beacon\'s crystal sings one note, low and kind. While it sings, the Hundred-Year Gale sleeps beneath the clouds."' },
  wreck_manifest:     { core: true, title: 'Rustbolt Manifest', text: 'Cargo: rope, 40 coils. Biscuits, 12 tins. One (1) very large crystal, "acquired" from the Great Beacon, replaced with glass. Do NOT tell the crew. —R.B.' },
  ember_ash:          { core: false, title: 'Patterns in the Ash', text: 'The storm\'s path is burned into the Ember Isles. It began right where the Beacon\'s light reached the least.' },
  aurora_carving:     { core: false, title: 'The Aurora Carving', text: 'An ancient carving of many small islands, all drifting in a circle around one light. Beneath it: "We keep it together."' },
  crystal_echo:       { core: false, title: 'The Crystal Echo', text: 'Inside the crystal cache, a note still rings: the Beacon\'s true song, low and kind. It sounds like home.' },
  owl_warning:        { core: true, title: 'The Owls\' Warning', text: 'The Glowing potion shines at the wrong pitch, just like the Beacon in its final years. Its crystal wasn\'t cracked by age. It was never the real crystal at all.' },
  fern_pollen:        { core: false, title: 'Glowing Pollen', text: 'Fern says the Beacon once shed glowing pollen across the sky. A flower bred with glow, crystal and song might carry the same light.' },
  tiny_door:          { core: false, title: 'A Very Small Letter', text: '"Dear Big Folk. We saw a pirate swap the shiny rock at the Beacon twenty years ago. He looked sad about it. We kept quiet because we are mice. Sorry. —The Glade Mice"' },
  sock_secret:        { core: false, title: 'The Truth About Socks', text: 'Lost socks are carried off by tiny updrafts that form only near laundry. The Sock King has documented 14,000 cases. This has nothing to do with the Beacon. It just felt important.' },
  brindle_confession: { core: true, title: 'The Captain\'s Confession', text: 'Captain Brindle swapped the Beacon\'s Tuning Crystal for glass twenty years ago. The fake cracked slowly, the song faded, and the Gale woke. He kept the real crystal all this time, too ashamed to return it. Now it\'s yours to return.' },
};

// Shown when every `core` clue is found.
export const TRUTH = 'The storm wasn\'t bad luck. A crystal was taken, a song went quiet, and a sleeping gale woke up. But a crystal can be returned. A song can be sung again. And an island, it turns out, can be rebuilt.';

// Shown after the Beacon is lit, then the game continues (endless mode).
export const ENDING = [
  'The Great Sky Beacon blazes across the sky.',
  'Somewhere far below, the Hundred-Year Gale yawns, rolls over, and goes back to sleep.',
  'Islands you\'ve never seen begin to drift closer, curious about the light.',
  'Wendell spins so fast he squeaks. "We built it again. We really did."',
  'The sky is calm. The sky is wide. There\'s still so much left to discover.',
];
