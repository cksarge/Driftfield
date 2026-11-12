// =============================================================
//  QUESTS — character requests and their rewards.
//
//  needs: list of requirements (all consumed on turn-in unless noted)
//    { item: 'key', qty }                     exact item
//    { tag: 'sock', qty }                     any item with tag
//    { kind: 'dye', qty }                     any item of that kind
//    { mix: { base?, effects: [...] }, qty }  a mix with ALL those effects
//    { crop: { hybrid?, rare?:[...] }, qty }  produce matching traits
//    { clue: 'id' }                           clue known (not consumed)
//  after: 'lit'   (optional) only offered once the Beacon is lit
//  final: true    (optional) finishing it ends the post-Beacon chapter
//  reward:
//    coins, items: { key: qty }, unlock: ['bp:x' | 'recipe:y'],
//    clue: 'id', say: 'what the character says on completion'
// =============================================================

export default {
  fern_hybrid: {
    title: 'A Curious Cross', giver: 'fern',
    desc: 'Fern wants to see any hybrid crop you\'ve bred yourself.',
    needs: [{ crop: { hybrid: true }, qty: 1 }],
    reward: { coins: 60, items: { 'seed:crystal_root': 2 }, say: 'Look at those traits! You have a gardener\'s luck.' },
  },
  fern_glow: {
    title: 'Light in the Leaves', giver: 'fern',
    desc: 'Fern wants a crop with the Glowing trait. Glow can be bred in, or passed on by glowing fertilizer.',
    needs: [{ crop: { rare: ['glowing'] }, qty: 1 }],
    reward: { coins: 200, unlock: ['recipe:topiary', 'recipe:arch'], clue: 'fern_pollen', say: 'Glowing pollen… the Beacon gave off pollen like this, years ago.' },
  },
  mossby_socks: {
    title: 'Five Lonely Socks', giver: 'mossby',
    desc: 'Mossby wants 5 lost socks. Islands are full of them, if you look.',
    needs: [{ tag: 'sock', qty: 5 }],
    reward: { coins: 50, unlock: ['recipe:hammock'], items: { 'deco:sock_line': 1 }, say: 'Magnificent. None of them match. Perfect.' },
  },
  mossby_cozy: {
    title: 'Something Cozy', giver: 'mossby',
    desc: 'Mossby wants a mix with the Cozy effect, for cold nights.',
    needs: [{ mix: { effects: ['cozy'] }, qty: 1 }],
    reward: { coins: 80, items: { glider_wing: 1 }, say: 'Ahh. Warm toes, warm heart. Take this old wing kit. I don\'t glide anymore.' },
  },
  pip_dye: {
    title: 'Kite Colours', giver: 'pip',
    desc: 'Pip needs 2 dyes, any colours, for new kite tails.',
    needs: [{ kind: 'dye', qty: 2 }],
    reward: { coins: 40, items: { 'deco:kite': 1 }, unlock: ['recipe:bunting'], say: 'These colours are WILD. Have a kite! I made it myself!' },
  },
  pip_feathers: {
    title: 'Featherweight', giver: 'pip',
    desc: 'Pip wants 6 feathers and 2 rope to build a record-breaking glider.',
    needs: [{ item: 'feather', qty: 6 }, { item: 'rope', qty: 2 }],
    reward: { coins: 60, items: { glider_wing: 1 }, say: 'It flew SO far. Here, you have the spare wing kit!' },
  },
  owls_lens: {
    title: 'Dew for the Owls', giver: 'owls',
    desc: 'The owls want 3 moon dew to polish their lighthouse lamp.',
    needs: [{ item: 'moon_dew', qty: 3 }],
    reward: { coins: 50, unlock: ['recipe:crystal_lens'], say: 'HOOT: Shiny. TAWNY: As promised: a lens is ground from sky crystal and frost. Here is how.' },
  },
  owls_light: {
    title: 'A Light for the Log', giver: 'owls',
    desc: 'The owls want a potion with the Glowing effect to test their old Beacon notes.',
    needs: [{ mix: { base: 'potion', effects: ['glowing'] }, qty: 1 }],
    reward: { coins: 120, items: { beacon_key: 1 }, clue: 'owl_warning', say: 'TAWNY: It glows at the wrong pitch… just like the Beacon did. Something was wrong with its heart. Take the Keeper\'s Key.' },
  },
  brindle_sails: {
    title: 'Old Sails, New Wind', giver: 'brindle',
    desc: 'Captain Brindle will share his sail plans for 10 planks and 5 rope.',
    needs: [{ item: 'plank', qty: 10 }, { item: 'rope', qty: 5 }],
    reward: { coins: 0, unlock: ['bp:sails', 'recipe:sailcloth'], say: 'There. Sails will push your island along faster. Fair winds, farmer.' },
  },
  brindle_rudder: {
    title: 'Hand on the Rudder', giver: 'brindle',
    desc: 'Brindle needs 5 old gears and a Speedy mix to test a rudder design.',
    needs: [{ item: 'old_gear', qty: 5 }, { mix: { effects: ['speedy'] }, qty: 1 }],
    reward: { coins: 50, unlock: ['bp:rudder'], say: 'With a rudder you choose your own course. Steer it on the map.' },
  },
  brindle_truth: {
    title: 'The Captain\'s Confession', giver: 'brindle',
    desc: 'You found the Rustbolt manifest signed "R.B." and the owls\' warning. Ask Brindle about it.',
    needs: [{ clue: 'wreck_manifest' }, { clue: 'owl_warning' }],
    reward: { items: { tuning_crystal: 1 }, clue: 'brindle_confession', say: 'I took it. Twenty years ago. I swapped the Beacon\'s crystal for a glass fake and sold the fake story as treasure. The fake cracked, the song faded, and the Gale woke up. Your island… that was me. I\'m sorry. Here. Put it back where it belongs.' },
  },
  brindle_amends: {
    title: 'Tea with the Owls', giver: 'brindle', after: 'lit',
    desc: 'Brindle wants to apologise to Hoot and Tawny properly. He needs a calming tea to bring, and some moon dew as a peace offering.',
    needs: [{ mix: { base: 'tea', effects: ['calming'] }, qty: 1 }, { item: 'moon_dew', qty: 3 }],
    reward: { coins: 150, items: { 'deco:pirate_chest': 1 }, clue: 'brindle_letter', say: 'They hooted at me for an hour. Then Tawny poured the tea. I think… I think we\'re alright. Thank you, friend.' },
  },
  juniper_fluff: {
    title: 'Fluff for the Nest', giver: 'juniper',
    desc: 'Juniper is lining a nursery barn and needs 3 Fluff from Puff Bunnies.',
    needs: [{ tag: 'fluff', qty: 3 }],
    reward: { coins: 90, items: { 'animal:drift_duck': 1 }, say: 'So soft! Take this duckling. She\'s got a Quick look about her.' },
  },
  juniper_cream: {
    title: 'The Cream of the Crop', giver: 'juniper',
    desc: 'Juniper wants 2 Cream from a Cumulus Cow for the Honey Fair pies.',
    needs: [{ tag: 'cream', qty: 2 }],
    reward: { coins: 220, items: { feather: 6, 'deco:picnic': 1 }, say: 'Perfect. Pies for everyone! Come to the Honey Fair in summer, you\'ll see.' },
  },
  marlo_samples: {
    title: 'Samples from Every Sky', giver: 'marlo',
    desc: 'Marlo wants proof of three different zones: storm glass, frost shards and ember coal.',
    needs: [{ item: 'storm_glass', qty: 2 }, { item: 'frost_shard', qty: 2 }, { item: 'ember_coal', qty: 2 }],
    reward: { coins: 160, items: { glider_wing: 1, map_fragment: 1 }, say: 'Wonderful. The chart is filling in. Take this wing kit: you\'ll need range to reach the edges.' },
  },
  marlo_stars: {
    title: 'Stars on the Chart', giver: 'marlo',
    desc: 'Marlo wants a crop with the Starry trait to mark north on the new chart.',
    needs: [{ crop: { rare: ['starry'] }, qty: 1 }],
    reward: { coins: 250, unlock: ['recipe:telescope'], clue: 'marlo_gap', say: 'North, marked in starlight. Look here, though: below the Beacon there\'s a gap no wind has ever charted.' },
  },
  gale_lullaby: {
    title: 'A Lullaby for the Gale', giver: 'gale', after: 'lit',
    desc: 'The Gale can\'t get back to sleep. Mix something both Musical and Dreamy for it.',
    needs: [{ mix: { effects: ['musical', 'dreamy'] }, qty: 1 }],
    reward: { coins: 200, items: { gale_feather: 2 }, clue: 'gale_song', say: 'Mmm. That\'s nearly the Beacon\'s song. Nearly. Hum it again sometime?' },
  },
  gale_feathers: {
    title: 'What the Wind Carried', giver: 'gale', after: 'lit',
    desc: 'The Gale drops silver feathers when it sighs. Bring 5 back and it will try to remember where it carried things.',
    needs: [{ item: 'gale_feather', qty: 5 }],
    reward: { items: { 'land:pebble': 2, old_gear: 4, 'seed:random_hybrid': 1 }, say: 'I remember now. Bits of your island are everywhere: I scattered them like seeds. Here are a few I kept close.' },
  },
  gale_garden: {
    title: 'A Garden to Sleep Beside', giver: 'gale', after: 'lit', final: true,
    desc: 'The Gale wants a legendary crop to drift beside while it sleeps, and 3 floating crops to keep it company.',
    needs: [{ crop: { legendary: true }, qty: 1 }, { crop: { rare: ['floating'] }, qty: 3 }],
    reward: { coins: 600, items: { 'deco:gale_chime': 1 }, say: 'There. That\'s… very nice. I think I could sleep a hundred years beside this. Goodnight, little farmer.' },
  },
};

// Templates for airship delivery requests (see js/trading.js).
// {crop} {qty} {zone} are filled in automatically.
export const DELIVERY_TEMPLATES = [
  { type: 'crop',  text: '{qty} {crop} before we reach {zone}', qty: [6, 20], days: [3, 6] },
  { type: 'crop',  text: 'We\'re hungry! {qty} {crop}, please', qty: [4, 12], days: [2, 5] },
  { type: 'mix',   text: 'Any {base} with the {effect} effect', qty: [1, 2], days: [3, 7] },
  { type: 'mix2',  text: 'A {base} that is both {effect} and {effect2}', qty: [1, 1], days: [4, 8] },
  { type: 'rare',  text: '{qty} crops with the {rare} trait', qty: [1, 3], days: [5, 9] },
  { type: 'hybrid',text: '{qty} hybrid crops of any kind', qty: [2, 5], days: [4, 8] },
  { type: 'item',  text: '{qty} {item} for the engine room', qty: [3, 8], days: [3, 6], pool: ['wood', 'stone', 'fiber', 'rope', 'plank', 'feather', 'cloud_puff'] },
];
