// =============================================================
//  LOST PIECES — parts of the Perfect Island scattered by the storm.
//
//  kind:   deco      → gives the decoration 'deco:<ref>'
//          building  → gives a free building 'bld:<ref>' (+ unlocks it)
//          animal    → an animal returns home (name optional)
//          recipes   → unlocks the listed recipe ids
//  memory: a short line Wendell says when you find it.
//  Each piece is placed on an island in data/islands.js.
// =============================================================

export default {
  rocking_chair:    { name: 'Grandma\'s Rocking Chair', kind: 'deco', ref: 'rocking_chair', memory: 'She used to rock in this and watch the sunset. I can almost hear the creak.' },
  family_bell:      { name: 'The Family Bell', kind: 'deco', ref: 'family_bell', memory: 'Ding-dong, supper time! The owls must have heard it ringing as it flew past.' },
  picture_frame:    { name: 'Picture Frame', kind: 'deco', ref: 'picture_frame', memory: 'Look at us. Everyone squinting into the sun. We\'ll take a new one someday.' },
  old_sign:         { name: 'Island Sign', kind: 'deco', ref: 'old_sign', memory: 'Our name, scorched but readable. Home is still home.' },
  first_scarecrow:  { name: 'Old Bramblejack', kind: 'deco', ref: 'first_scarecrow', memory: 'Bramblejack! He never scared a single bird. We loved him anyway.' },
  biscuit:          { name: 'Biscuit the Breeze Pup', kind: 'animal', ref: 'breeze_pup', animalName: 'Biscuit', memory: 'BISCUIT! Oh, good dog. Good, good dog. He was waiting for us.' },
  bramble:          { name: 'Bramble the Cloud Sheep', kind: 'animal', ref: 'cloud_sheep', animalName: 'Bramble', memory: 'Bramble! A little scruffy, but that\'s our girl.' },
  hens:             { name: 'The Puff Hens', kind: 'animal', ref: 'puff_hen', count: 2, animalName: 'Dumpling', memory: 'The hens! Still bickering. Some things never change.' },
  old_barn:         { name: 'The Old Barn', kind: 'building', ref: 'barn', memory: 'The barn roof is dented but the beams are strong. Let\'s bring it home.' },
  greenhouse_frame: { name: 'Greenhouse Frame', kind: 'building', ref: 'greenhouse', memory: 'Our greenhouse frame! With some new glass, it\'ll grow anything, anywhere.' },
  old_dock:         { name: 'The Old Dock', kind: 'building', ref: 'dock', memory: 'The dock where every trader used to tie up. They\'ll come back.' },
  mix_notebook:     { name: 'Mixing Notebook', kind: 'recipes', ref: ['star_lamp', 'telescope', 'swing', 'hammock'], memory: 'Your old notebook! Smudged recipes, doodles of jam jars… it\'s all here.' },
};
