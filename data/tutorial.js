// =============================================================
//  TUTORIAL — "The Perfect Island"
//
//  Each step: Wendell says `say`, the objective shows `task`,
//  and the step completes when the game emits `event`
//  (see js/events.js). `dark` (0-1) sets how stormy the sky gets,
//  foreshadowing the storm. `ui` highlights a button.
// =============================================================

export const TUTORIAL_STEPS = [
  {
    id: 'harvest', event: 'harvest', dark: 0.0, ui: 'tool-hand',
    say: [
      'Good morning, good morning! What a day! Not a cloud below us that isn\'t fluffy.',
      'Look at this place. Every field full, every building built, the Great Sky Beacon shining over there. Perfect.',
      'Let\'s start easy. Pick the Hand tool and tap a ripe crop to harvest it.',
    ],
    task: 'Harvest a ripe crop (Hand tool, tap a crop).',
  },
  {
    id: 'animal', event: 'animal:fed', dark: 0.08, ui: 'tool-hand',
    say: [
      'Lovely! Our animals are hungry too. What they eat changes what they make, you know.',
      'With the Hand tool, tap a cloud sheep and give it something tasty.',
    ],
    task: 'Feed an animal (Hand tool, tap an animal).',
  },
  {
    id: 'mix', event: 'mix:made', dark: 0.16, ui: 'btn-mix',
    say: [
      'Now, my favourite: the Mixing Station! Pick a base, then add ingredients one at a time.',
      'Every ingredient adds or changes effects. Order matters! Try making anything at all.',
    ],
    task: 'Make any product at the Mixing Station (Mix button).',
  },
  {
    id: 'breed', event: 'hybrid:seed', dark: 0.26, ui: 'tool-hand',
    say: [
      'See that sparkling crop? It was pollinated by its neighbour, a different crop.',
      'Harvest it and you\'ll get a hybrid seed, a brand-new variety! …Did the wind just change?',
    ],
    task: 'Harvest the sparkling crop to collect a hybrid seed.',
  },
  {
    id: 'trade', event: 'trade:sold', dark: 0.36, ui: 'btn-trade',
    say: [
      'An airship is docked! Captain Marigold always pays fair.',
      'Open Trade and sell something. Hmm. The birds are all flying the same way. Odd.',
    ],
    task: 'Sell something to the docked airship (Trade button).',
  },
  {
    id: 'glide', event: 'explore:gather', dark: 0.48, ui: 'btn-explore',
    say: [
      'An island is drifting past. Let\'s glide over! Open Explore and pick it.',
      'Gather anything you like… quickly, if you don\'t mind. I don\'t love those clouds.',
    ],
    task: 'Glide to the nearby island and gather something (Explore button).',
  },
  {
    id: 'steer', event: 'nav:steer', dark: 0.6, ui: 'btn-map',
    say: [
      'Our island has sails and a rudder, so we can steer! Open the Map and choose where to drift next.',
      'Maybe… somewhere away from that dark patch? Is the Beacon flickering, or is it just me?',
    ],
    task: 'Open the Map and choose the next zone to steer toward.',
  },
  {
    id: 'craft', event: 'craft:made', dark: 0.72, ui: 'btn-craft',
    say: [
      'Crafting! Put items on the workbench. Some recipes you know, others you discover by experimenting.',
      'Make anything. I just… I\'d feel better if we kept our hands busy.',
    ],
    task: 'Craft anything at the Workbench (Craft button).',
  },
  {
    id: 'decorate', event: 'deco:placed', dark: 0.85, ui: 'btn-build',
    say: [
      'Last one. Open Build, choose Decor, and place a lantern. We… might want the light.',
      'The Beacon is flickering. It never flickers. It\'s okay. It\'s okay. Place the lantern.',
    ],
    task: 'Place a decoration (Build → Decor).',
  },
];

// Played during the storm cinematic.
export const STORM_LINES = [
  'Wendell: The wind\'s turned all the way around. I\'ve never pointed this way before.',
  'Wendell: Hold on to something!',
  'Wendell: The Beacon! NO—',
];

// Played when you wake up on the rock.
export const WAKE_LINES = [
  '…',
  'Wendell: Hey. Hey, you. You\'re awake. Oh, thank the breeze.',
  'Wendell: It\'s all gone. The fields, the barn, the animals. Scattered across the whole sky.',
  'Wendell: But we\'re here. You\'ve got your seed pouch. And that old windmill landed with us. It\'s broken, but it\'s ours.',
  'Wendell: We built it once. We can build it again.',
  'Wendell: Let\'s plant something. Use the Hoe on the ground, then plant a seed and water it.',
];

// Gentle tips Wendell gives during the early game (in order).
export const EARLY_TIPS = [
  { when: 'day:1', text: 'Till soil with the Hoe, plant with Seeds, then Water. Crops grow a little every night.' },
  { when: 'day:2', text: 'Islands drift by all the time. Use Explore to glide over and gather wood and stone.' },
  { when: 'day:3', text: 'Crops only grow in their favourite climate. Check the seed info: the zone changes as we drift.' },
  { when: 'day:4', text: 'Repair the windmill! Tap it with the Hand tool once you have the materials.' },
  { when: 'day:5', text: 'Plant two different crops next to each other. When both are ripe, they might cross-pollinate.' },
  { when: 'day:6', text: 'Pieces of our old island are out there. Keep exploring. We\'ll find them.' },
];
