// =============================================================
//  DECORATIONS — placeable 1x1 (or small) pretty things.
//
//  art:     painter in js/art.js (drawDeco)
//  color:   default colour (dyes can recolour it)
//  light:   glow radius at night, in tiles
//  source:  where it usually comes from (shown as a hint):
//           craft | explore | festival | piece | shop
//  flower:  counts as a flower for sky bees
//  walk:    true = paths/bridges (drawn flat under everything)
//  weight:  tilts the island a tiny bit
//  Decorations are owned as inventory items 'deco:<id>'.
// =============================================================

export default {
  lantern:       { name: 'Paper Lantern',   art: 'lantern',   color: '#ffb36b', light: 2.2, source: 'craft',   desc: 'Warm light for cool nights.' },
  wind_chime:    { name: 'Wind Chime',      art: 'chime',     color: '#c0d8f0', source: 'craft',   desc: 'Tinkles in the breeze.' },
  flower_bed:    { name: 'Flower Bed',      art: 'flowers',   color: '#f39ac0', source: 'craft',   flower: true, desc: 'Bees love it.' },
  stone_path:    { name: 'Stone Path',      art: 'path',      color: '#c9c3b8', source: 'craft',   walk: true, desc: 'A neat little path.' },
  wood_path:     { name: 'Boardwalk',       art: 'boards',    color: '#c8945a', source: 'craft',   walk: true, desc: 'Creaks nicely underfoot.' },
  fence:         { name: 'Picket Fence',    art: 'fence',     color: '#f4ecdc', source: 'craft',   desc: 'Keeps nothing in. Looks lovely.' },
  bench:         { name: 'Garden Bench',    art: 'bench',     color: '#a8784a', source: 'craft',   desc: 'For watching the clouds go by.' },
  hammock:       { name: 'Hammock',         art: 'hammock',   color: '#f0a05a', source: 'craft',   desc: 'Sway with the island.' },
  kite:          { name: 'Kite Post',       art: 'kite',      color: '#ff7a8a', source: 'craft',   desc: 'A kite that never comes down.' },
  bridge:        { name: 'Little Bridge',   art: 'bridge',    color: '#b0804a', source: 'craft',   walk: true, desc: 'Arches over nothing in particular.' },
  bird_bath:     { name: 'Bird Bath',       art: 'birdbath',  color: '#c8d0d8', source: 'craft',   desc: 'Sky birds stop for a sip.' },
  sundial:       { name: 'Sundial',         art: 'sundial',   color: '#d8c8a0', source: 'craft',   desc: 'Tells time. Mostly.' },
  topiary:       { name: 'Cloud Topiary',   art: 'topiary',   color: '#6fbf6f', source: 'craft',   desc: 'Trimmed to look like a cloud.' },
  lamp_post:     { name: 'Lamp Post',       art: 'lamppost',  color: '#3a3a4a', light: 3, source: 'craft', desc: 'A proper street lamp.' },
  bunting:       { name: 'Bunting',         art: 'bunting',   color: '#ff8aa0', source: 'craft',   desc: 'Little flags for a big mood.' },
  planter:       { name: 'Herb Planter',    art: 'planter',   color: '#c46a4a', source: 'craft',   flower: true, desc: 'Fragrant herbs in a pot.' },
  swing:         { name: 'Tree Swing',      art: 'swing',     color: '#6a9a4a', source: 'craft',   desc: 'Swing out over the clouds!' },
  arch:          { name: 'Flower Arch',     art: 'arch',      color: '#f3a3c8', source: 'craft',   flower: true, desc: 'Walk through it for good luck.' },
  telescope:     { name: 'Telescope',       art: 'telescope', color: '#b08a50', source: 'craft',   desc: 'Spot islands from farther away (+1 glide range).' },
  star_lamp:     { name: 'Star Lamp',       art: 'starlamp',  color: '#c8c0ff', light: 3.5, source: 'craft', desc: 'Holds a little captured star.' },
  crystal_cluster:{ name: 'Crystal Cluster',art: 'crystals',  color: '#8fd8ff', light: 1.5, source: 'explore', desc: 'Grew on its own. Glows faintly.' },
  owl_statue:    { name: 'Owl Statue',      art: 'owl',       color: '#c8b8a0', source: 'explore', desc: 'A gift from the lighthouse owls.' },
  pirate_chest:  { name: 'Pirate Chest',    art: 'chest',     color: '#8a5a30', source: 'explore', desc: 'Empty. Captain Brindle swears.' },
  sock_line:     { name: 'Sock Line',       art: 'socks',     color: '#e07a9a', source: 'explore', desc: 'Mossby\'s finest socks, drying forever.' },
  picnic:        { name: 'Picnic Blanket',  art: 'picnic',    color: '#e05a5a', source: 'craft',   walk: true, desc: 'Checkered, of course.' },
  wishing_well:  { name: 'Wishing Well',    art: 'well',      color: '#a0a8b0', source: 'explore', desc: 'Toss in a shell. Nothing happens. Probably.' },
  mushroom_ring: { name: 'Mushroom Ring',   art: 'mushrooms', color: '#e05a5a', source: 'explore', desc: 'Don\'t step inside. Just in case.' },
  cloud_bench:   { name: 'Cloud Bench',     art: 'cloudbench',color: '#ffffff', source: 'explore', desc: 'Surprisingly firm.' },

  // Festival-only decorations
  festival_kite: { name: 'Champion Kite',   art: 'kite',      color: '#ffd84a', source: 'festival', desc: 'From the Kite Festival.' },
  float_lantern: { name: 'Harvest Float',   art: 'lantern',   color: '#ff9a4a', light: 2.5, source: 'festival', desc: 'From the Harvest Float.' },
  star_jar:      { name: 'Jar of Starlight',art: 'starlamp',  color: '#fff3a0', light: 3, source: 'festival', desc: 'From Starfall night.' },
  bloom_crown:   { name: 'Bloom Throne',    art: 'arch',      color: '#ffb3de', source: 'festival', flower: true, desc: 'From the Bloom Parade.' },
  ribbon_trophy: { name: 'Ribbon Trophy',   art: 'trophy',    color: '#f0c050', source: 'festival', desc: 'You won a contest!' },

  // Keepsakes from the lost island (recovered pieces)
  rocking_chair: { name: 'Grandma\'s Rocking Chair', art: 'chair', color: '#a0683a', source: 'piece', desc: 'It still creaks the same way.' },
  family_bell:   { name: 'The Family Bell', art: 'bell',     color: '#d8a840', source: 'piece', desc: 'It rang every evening at supper.' },
  old_sign:      { name: 'Island Sign',     art: 'sign',     color: '#b08050', source: 'piece', desc: 'Your island\'s name, a little scorched.' },
  picture_frame: { name: 'Picture Frame',   art: 'frame',    color: '#d8b070', source: 'piece', desc: 'Everyone, smiling, before the storm.' },
  first_scarecrow:{ name: 'Old Bramblejack', art: 'scarecrowdeco', color: '#d8a050', source: 'piece', desc: 'Your very first scarecrow.' },
};
