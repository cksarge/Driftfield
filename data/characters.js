// =============================================================
//  CHARACTERS — the quirky folk of the sky.
//
//  color:    portrait colour
//  portrait: painter shape in js/art.js (drawPortrait)
//  intro:    said the first time you meet
//  lines:    random chatter
//  loves:    gift preferences. Matches on item key, kind, effect or rare trait.
//            Giving a loved gift raises friendship by 2, other gifts by 1.
//  quests:   quest ids (data/quests.js) offered in order
//  shop:     (optional) items they sell: { key, price }
// =============================================================

export default {
  wendell: {
    name: 'Wendell', title: 'Weather Vane (talking)', color: '#d0a040', portrait: 'vane',
    intro: ['Hello, hello! Wendell the Weathervane, at your service. I point where the wind goes. Mostly.'],
    lines: [
      'I feel a breeze coming. I always feel a breeze coming. It\'s my whole job.',
      'Try mixing things in a different order. You\'d be amazed.',
      'Plant two different crops side by side and see what the bees think.',
      'What do you think sheep dream about? Probably clouds. They ARE clouds.',
      'I spin when I\'m happy. Whee.',
    ],
  },
  fern: {
    name: 'Fern Thistlewhite', title: 'Botanist of Sunpatch', color: '#7fbf6a', portrait: 'botanist',
    intro: ['Oh! A visitor! Mind the seedlings. I study how sky plants cross-pollinate. You lost your island? Then let me help you grow a new one.'],
    lines: [
      'Two parents, a dozen possible children. Plants are wonderfully unpredictable.',
      'Some varieties only appear in special skies. The aurora does strange things to pollen.',
      'Hybrids of hybrids… that\'s where the real surprises live.',
      'Rare traits sometimes skip a generation. Keep breeding!',
    ],
    loves: { kinds: ['crop'], rare: ['glowing', 'crystal', 'starry'] },
    quests: ['fern_hybrid', 'fern_glow'],
    shop: [{ key: 'seed:crystal_root', price: 40 }, { key: 'seed:windsong_reed', price: 30 }, { key: 'seed:aurora_fig', price: 60 }],
  },
  mossby: {
    name: 'Old Mossby', title: 'Hermit & Sock Collector', color: '#8a9a6a', portrait: 'hermit',
    intro: ['Eh? A visitor? Have you got any socks? Single ones. Lost ones. They\'re the only kind worth having.'],
    lines: [
      'Every lost sock has a story. Usually a sad one. Usually involving a dryer.',
      'Seven hundred and twelve socks. No two match. Perfect.',
      'I lost my whole house once too, you know. Blew right off. Built a better one. Socks and all.',
      'The wind takes things. The wind gives things back. That\'s the deal.',
    ],
    loves: { keys: ['lost_sock'], effects: ['cozy', 'velvet'] },
    quests: ['mossby_socks', 'mossby_cozy'],
  },
  pip: {
    name: 'Pip Kestrel', title: 'Kite Maker (age 11)', color: '#ff8a8a', portrait: 'kid',
    intro: ['WHOA, did you glide here?! That\'s so cool. I make kites! The best kites. Wanna see?'],
    lines: [
      'A good kite needs three things: string, colour, and courage.',
      'I\'m gonna win the Kite Festival this year. Or next year. Definitely by the year after.',
      'Dyes make the best kite tails. The weirder the colour, the better!',
      'Grandpa says the Beacon used to sing. I wish I\'d heard it.',
    ],
    loves: { kinds: ['dye'], effects: ['bright', 'prismatic'] },
    quests: ['pip_dye', 'pip_feathers'],
    shop: [{ key: 'deco:kite', price: 80 }, { key: 'deco:bunting', price: 50 }],
  },
  owls: {
    name: 'Hoot & Tawny', title: 'Keepers of Lumen Lighthouse', color: '#b8a080', portrait: 'owls',
    intro: ['HOOT: Who goes there?', 'TAWNY: Who indeed. A farmer, from the look of the boots. We keep the light, and we kept the Beacon\'s log, once.'],
    lines: [
      'HOOT: Lights must be kept. Logs must be logged.',
      'TAWNY: The Beacon\'s song was going flat for years. We wrote it down. Nobody listened.',
      'HOOT: Owls see far. Owls see everything. Except what\'s right under our beaks.',
      'TAWNY: Bring us moon dew and we\'ll tell you a secret about lenses.',
    ],
    loves: { keys: ['moon_dew', 'feather'], effects: ['dreamy', 'starry'] },
    quests: ['owls_lens', 'owls_light'],
    shop: [{ key: 'deco:owl_statue', price: 120 }, { key: 'recipe:crystal_lens', price: 100 }],
  },
  brindle: {
    name: 'Captain Rue Brindle', title: 'Retired Sky Pirate', color: '#8a5a4a', portrait: 'pirate',
    intro: ['Arr— ahem. Sorry. Old habits. Captain Brindle, retired. I don\'t do pirating anymore. Just gardening. And… regretting.'],
    lines: [
      'Steering an island is just like steering a ship. Only slower. And with more cows.',
      'I sailed every route in this sky. Every single one.',
      'Sails and a rudder, that\'s what you need. Then the sky\'s yours.',
      'Some treasures aren\'t worth taking. I learned that too late.',
    ],
    loves: { effects: ['smoky', 'warm', 'rich'], keys: ['ember_coal'] },
    quests: ['brindle_sails', 'brindle_rudder', 'brindle_truth', 'brindle_amends'],
  },
  juniper: {
    name: 'Juniper Fairweather', title: 'Herder of Clover Downs', color: '#c9a86a', portrait: 'herder',
    intro: ['Oh, hello! Mind the bunnies, they\'re everywhere. I raise animals here, and I\'m a bit obsessed with what babies inherit from their parents.'],
    lines: [
      'Two happy, well-fed animals and a bit of luck: that\'s how families grow.',
      'Traits run in families. A Quick mother and a Quick father? Very likely a Quick baby.',
      'Every so often a baby turns up with something neither parent had. Those are the best days.',
      'Feed a cow something sweet and her cream comes out sweet. It\'s not complicated, it\'s just lovely.',
    ],
    loves: { kinds: ['product'], effects: ['gentle', 'cozy', 'rich'] },
    quests: ['juniper_fluff', 'juniper_cream'],
    shop: [{ key: 'animal:puff_bunny', price: 80 }, { key: 'animal:drift_duck', price: 90 }],
  },
  marlo: {
    name: 'Marlo Quill', title: 'Sky Cartographer', color: '#6a8ac0', portrait: 'cartographer',
    intro: ['Hold still, I\'m drawing you. There. You\'re on the map now. Marlo Quill, cartographer. I chart every zone the sky has to offer.'],
    lines: [
      'The zones aren\'t fixed, you know. They drift, like everything else up here.',
      'Every zone leaves something behind: glass in the storms, frost in the north, coals in the Ember Isles.',
      'Some zones only open in certain seasons. Keep a calendar handy.',
      'There\'s a gap in my charts, right below the Beacon. Nobody\'s ever been down there.',
    ],
    loves: { keys: ['map_fragment', 'storm_glass', 'frost_shard'], effects: ['mysterious', 'ancient'] },
    quests: ['marlo_samples', 'marlo_stars'],
    shop: [{ key: 'glider_wing', price: 200 }, { key: 'recipe:telescope', price: 140 }],
  },
  gale: {
    name: 'The Hundred-Year Gale', title: 'A very old wind', color: '#a8b8e0', portrait: 'gale',
    intro: ['…oh. You\'re the little one who lit the light.', 'I\'m sorry about your island. I was having such a bad dream. When the song stopped, I couldn\'t stay asleep.'],
    lines: [
      'I\'ve been blowing since before the islands floated. I\'m very, very tired.',
      'The Beacon\'s song helps. But it\'s been a long hundred years.',
      'Everything you lost, I carried somewhere. I don\'t always remember where.',
      'If you hum, I can hear you. Even from all the way down there.',
    ],
    loves: { effects: ['musical', 'dreamy', 'calming', 'sleepy'], keys: ['gale_feather'] },
    quests: ['gale_lullaby', 'gale_feathers', 'gale_garden'],
  },
};
