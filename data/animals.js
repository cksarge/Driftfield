// =============================================================
//  ANIMALS — species, what they make, and how they vary.
//
//  product:   base name of what the animal produces
//  every:     days between products
//  home:      building id that houses them (capacity comes from there)
//  baseHue / baseLight: natural colouring
//  productEffects: effects the plain product always has
//  patterns:  coat patterns that can appear when breeding
//  price:     cost at traders that sell this animal
//
//  What an animal EATS changes what it makes (js/animals.js):
//   - the food's colour tints the product (pink wool, blue eggs…)
//   - the food's first effects pass into the product
//   - golden food => Golden product, glowing food => Glowing product
//
//  ANIMAL_TRAITS are inherited genes. Babies get each parent's
//  traits with a good chance, and sometimes a brand-new one
//  (js/animals.js → breedAnimals). Bought animals occasionally
//  arrive with one. An animal holds at most 3.
//    value:    flat bonus to product value
//    valueMult: multiplier on product value
//    faster:   days removed from `every` (never below 1)
//    steady:   happiness doesn't drop on hungry days
//    doubles:  chance to make two products
//    effect:   extra effect added to products
//    fertile:  extra chance to have babies
// =============================================================

export const ANIMALS = {
  cloud_sheep: {
    name: 'Cloud Sheep', product: 'Wool', productIcon: 'puff', every: 2, home: 'barn',
    baseHue: 0, baseLight: 96, productEffects: ['cozy'], productValue: 14, price: 120,
    desc: 'Fleece so soft it is basically weather.',
    patterns: ['plain', 'curly', 'spotted', 'stormcloud', 'sunset', 'glow'],
  },
  float_goat: {
    name: 'Floating Goat', product: 'Milk', productIcon: 'bottle', every: 1, home: 'barn',
    baseHue: 30, baseLight: 82, productEffects: ['gentle'], productValue: 10, price: 140,
    desc: 'Hooves never quite touch the ground.',
    patterns: ['plain', 'patched', 'bearded', 'tiny', 'starry'],
  },
  puff_hen: {
    name: 'Puff Hen', product: 'Egg', productIcon: 'egg', every: 1, home: 'coop',
    baseHue: 40, baseLight: 88, productEffects: ['savory'], productValue: 6, price: 60,
    desc: 'Round as a dumpling. Bounces when startled.',
    patterns: ['plain', 'speckled', 'crested', 'fluffy', 'rainbow'],
  },
  sky_bee: {
    name: 'Sky Bees', product: 'Honey', productIcon: 'honey', every: 2, home: 'beehive', hive: true,
    baseHue: 45, baseLight: 60, productEffects: ['sweet'], productValue: 16, price: 90,
    desc: 'Honey tastes like whatever flowers grow nearby.',
    patterns: ['plain'],
  },
  mist_moth: {
    name: 'Mist Moth', product: 'Silk', productIcon: 'cloth', every: 3, home: 'barn',
    baseHue: 260, baseLight: 85, productEffects: ['floaty'], productValue: 18, price: 160,
    desc: 'Spins cloud silk on misty nights.',
    patterns: ['plain', 'mooneye', 'dusted', 'glow'],
  },
  breeze_pup: {
    name: 'Breeze Pup', product: 'Trinket', productIcon: 'star', every: 3, home: 'barn',
    baseHue: 25, baseLight: 70, productEffects: ['lucky'], productValue: 12, price: 0,
    desc: 'Digs up little treasures in the soil. Only found, never sold.',
    patterns: ['plain', 'floppy', 'spotted', 'windswept'],
  },
  puff_bunny: {
    name: 'Puff Bunny', product: 'Fluff', productIcon: 'puff', every: 2, home: 'coop',
    baseHue: 30, baseLight: 92, productEffects: ['gentle'], productValue: 12, price: 80,
    desc: 'Sheds the softest fluff in the sky. Mostly when hugged.',
    patterns: ['plain', 'lop', 'patched', 'cottontail', 'starry'],
  },
  drift_duck: {
    name: 'Drift Duck', product: 'Down', productIcon: 'feather', every: 2, home: 'coop',
    baseHue: 50, baseLight: 80, productEffects: ['floaty'], productValue: 13, price: 90,
    desc: 'Paddles through clouds as if they were ponds.',
    patterns: ['plain', 'mallard', 'speckled', 'crested', 'rainbow'],
  },
  cumulus_cow: {
    name: 'Cumulus Cow', product: 'Cream', productIcon: 'bottle', every: 2, home: 'barn',
    baseHue: 30, baseLight: 90, productEffects: ['rich'], productValue: 22, price: 180,
    desc: 'A big, gentle cloud with hooves. Her cream is famous.',
    patterns: ['plain', 'spotted', 'belted', 'stormcloud', 'sunset'],
  },
};

export const ANIMAL_TRAITS = {
  fluffy:   { name: 'Extra Fluffy', desc: 'Products are worth more.', value: 6, mutate: 3 },
  big:      { name: 'Big-Boned',    desc: 'Products are worth 25% more.', valueMult: 1.25, mutate: 2 },
  quick:    { name: 'Quick',        desc: 'Makes products a day sooner.', faster: 1, mutate: 2 },
  steady:   { name: 'Steady',       desc: 'Stays happy even on hungry days.', steady: true, mutate: 3 },
  lucky:    { name: 'Lucky',        desc: 'Sometimes makes two products at once.', doubles: 0.25, mutate: 2 },
  sparkly:  { name: 'Sparkly',      desc: 'Products sparkle.', effect: 'sparkling', value: 4, mutate: 1 },
  musical:  { name: 'Musical',      desc: 'Hums while it works. Products are musical.', effect: 'musical', value: 4, mutate: 1 },
  fertile:  { name: 'Family-Minded', desc: 'More likely to have babies.', fertile: 0.1, mutate: 2 },
};
