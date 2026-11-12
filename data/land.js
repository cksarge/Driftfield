// =============================================================
//  LAND PIECES — chunks of sky rock you attach to your island
//  like puzzle pieces. Owned as items 'land:<id>'.
//
//  shape: rows of characters; '#' = ground tile, '.' = empty.
//  Pieces can be rotated before placing. A piece must touch the
//  island on at least one side and can't overlap existing land.
// =============================================================

export default {
  pebble: { name: 'Pebble Chunk', value: 30, shape: ['##', '##'] },
  square: { name: 'Square Chunk', value: 80, shape: ['###', '###', '###'] },
  long:   { name: 'Long Chunk',   value: 70, shape: ['####', '####'] },
  ell:    { name: 'Corner Chunk', value: 60, shape: ['##.', '##.', '###'] },
  tee:    { name: 'Tee Chunk',    value: 60, shape: ['###', '.#.', '.#.'] },
  plus:   { name: 'Cross Chunk',  value: 70, shape: ['.#.', '###', '.#.'] },
  big:    { name: 'Meadow Chunk', value: 150, shape: ['####', '####', '####', '####'] },
};

// The tiny rock you wake up on after the storm.
export const START_ROCK = ['.##.', '####', '####', '.##.'];
