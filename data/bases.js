// =============================================================
//  MIX BASES — what you start a mix with at the Mixing Station.
//
//  needs:   items consumed to start (keys from data/items.js, or
//           'tag:<tag>' to accept any item with that tag)
//  start:   effects the base begins with
//  value:   base sell price
//  mult:    multiplier applied to the value of effects
//  use:     how the finished product is used (see js/mixing.js)
//  color:   colour before any effects are added
// =============================================================

export default {
  juice:      { name: 'Juice',      needs: { jar: 1 },                 start: ['refreshing'], value: 6,  mult: 1.0, use: 'drink', color: '#ffd38a', desc: 'Squeezed fresh. Drink for a buff that lasts the day.' },
  jam:        { name: 'Jam',        needs: { jar: 1 },                 start: ['sweet'],      value: 8,  mult: 1.1, use: 'sell',  color: '#e0607e', desc: 'Traders love a good jam.' },
  tea:        { name: 'Tea',        needs: { jar: 1 },                 start: ['gentle'],     value: 6,  mult: 1.1, use: 'drink', color: '#c8a070', desc: 'Steeped slowly. Drink for a buff that lasts the day.' },
  honey:      { name: 'Honey',      needs: { 'tag:honey': 1 },         start: ['sticky'],     value: 12, mult: 1.3, use: 'sell',  color: '#f2b640', desc: 'Start from honey made by your sky bees.' },
  soup:       { name: 'Soup',       needs: { jar: 1 },                 start: ['savory'],     value: 9,  mult: 1.0, use: 'drink', color: '#d9955a', desc: 'Hearty. Drink for a buff that lasts the day.' },
  fertilizer: { name: 'Fertilizer',  needs: { compost: 1 },            start: ['earthy'],     value: 5,  mult: 0.8, use: 'fertilize', color: '#6b4f2f', desc: 'Spread on soil. Effects like Speedy, Rich and Bountiful help crops.' },
  dye:        { name: 'Dye',        needs: { jar: 1 },                 start: [],             value: 5,  mult: 0.9, use: 'dye',   color: '#ffffff', desc: 'Its colour comes from its effects. Paint buildings, sails, wool and clothes.' },
  potion:     { name: 'Potion',     needs: { jar: 1, sky_crystal: 1 }, start: ['mysterious'], value: 18, mult: 1.5, use: 'drink', color: '#a070e0', desc: 'Powerful. Floaty potions let you glide much farther.' },
  feed:       { name: 'Feed',       needs: { fiber: 2 },               start: ['earthy'],     value: 4,  mult: 0.7, use: 'feed',  color: '#c9b27a', desc: 'Animal feed. What animals eat changes what they make.' },
};
