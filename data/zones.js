// =============================================================
//  ZONES — the climate regions your island drifts through.
//
//  climate:   which crops grow (see CLIMATES in data/crops.js)
//  weather:   weights for each weather type
//  days:      how many days the island stays (before sails)
//  next:      where the drift carries you by default
//  neighbors: zones you can steer to with a rudder
//  rare:      special zones; reached by luck (rareFrom) or steering
//  seasons:   (optional) only reachable in these seasons (0-3)
//  mutation:  extra crossbreeding mutation chance here
//  favored:   rare traits more likely to mutate here
//  sky:       [top, bottom] daytime sky colours
//  pos:       position on the map (0-100)
// =============================================================

export const WEATHER = {
  clear:  { name: 'Clear',      waters: false, icon: 'sun' },
  cloudy: { name: 'Cloudy',     waters: false, icon: 'cloud' },
  rain:   { name: 'Rain',       waters: true,  icon: 'rain' },
  mist:   { name: 'Mist',       waters: true,  icon: 'mist' },
  snow:   { name: 'Snow',       waters: true,  icon: 'snow' },
  storm:  { name: 'Lightning Storm', waters: true, icon: 'storm' },
  wind:   { name: 'Gusty',      waters: false, icon: 'wind' },
  aurora: { name: 'Aurora',     waters: false, icon: 'aurora' },
};

export default {
  sunny: {
    name: 'Sunlit Meadows', climate: 'warm', days: 3, next: 'windy', neighbors: ['windy', 'stormy', 'ember'],
    weather: { clear: 6, cloudy: 2, rain: 1, wind: 1 }, sky: ['#7cc4f5', '#ffe7c2'], pos: [22, 70],
    desc: 'Golden light and warm air. Sunfruit and tomatoes love it here.', mutation: 0, favored: ['golden'],
  },
  windy: {
    name: 'Whistling Straits', climate: 'windy', days: 2, next: 'misty', neighbors: ['sunny', 'misty', 'crystal'],
    weather: { wind: 5, clear: 3, cloudy: 2, rain: 1 }, sky: ['#8fd0f0', '#e8f6ff'], pos: [40, 40],
    desc: 'Leaves and kites everywhere. Traders ride the tailwinds.', mutation: 0.01, favored: ['singing', 'floating'],
  },
  misty: {
    name: 'Misty Vale', climate: 'misty', days: 3, next: 'frozen', neighbors: ['windy', 'frozen', 'crystal'],
    weather: { mist: 6, cloudy: 2, rain: 2 }, sky: ['#a7b4d8', '#ece6f6'], pos: [62, 22],
    desc: 'Soft and quiet. Cloud cotton and star lilies thrive.', mutation: 0.02, favored: ['dreamy', 'floating'],
  },
  frozen: {
    name: 'Frostreach', climate: 'cold', days: 3, next: 'stormy', neighbors: ['misty', 'stormy', 'aurora'],
    weather: { snow: 5, clear: 3, cloudy: 2 }, sky: ['#9dc8e8', '#f2fbff'], pos: [84, 42],
    desc: 'Crisp air and sparkling snow. Frost berries everywhere.', mutation: 0.01, favored: ['frosted', 'crystal'],
  },
  stormy: {
    name: 'Thunderhead Expanse', climate: 'stormy', days: 2, next: 'sunny', neighbors: ['frozen', 'sunny', 'ember'],
    weather: { storm: 5, rain: 3, cloudy: 2, wind: 1 }, sky: ['#5b6390', '#b8bede'], pos: [62, 80],
    desc: 'Loud, bright, a little scary. Storm peppers only grow here during lightning.', mutation: 0.03, favored: ['charged'],
  },
  // ---------------- rare zones ----------------
  ember: {
    name: 'Ember Isles', climate: 'warm', days: 2, next: 'stormy', neighbors: ['sunny', 'stormy'], rare: true,
    rareFrom: { sunny: 0.25 }, seasons: [1, 2],
    weather: { clear: 5, wind: 2, cloudy: 2 }, sky: ['#f08a6a', '#ffd8a8'], pos: [42, 92],
    desc: 'Warm volcanic islands with glowing vents. Visited in summer and autumn.', mutation: 0.04, favored: ['glowing', 'golden'],
  },
  aurora: {
    name: 'Aurora Drift', climate: 'cold', days: 2, next: 'stormy', neighbors: ['frozen', 'stormy'], rare: true,
    rareFrom: { frozen: 0.3 }, seasons: [3, 0],
    weather: { aurora: 6, snow: 2, clear: 2 }, sky: ['#2a3d6a', '#7a9ad0'], pos: [96, 18],
    desc: 'The sky dances green and violet. Only in winter and spring.', mutation: 0.06, favored: ['starry', 'shimmering', 'glowing'],
  },
  crystal: {
    name: 'Crystal Shoals', climate: 'misty', days: 2, next: 'misty', neighbors: ['windy', 'misty'], rare: true,
    rareFrom: { windy: 0.15 },
    weather: { clear: 4, mist: 3, cloudy: 2 }, sky: ['#9ae0e8', '#f0fffe'], pos: [36, 10],
    desc: 'Floating crystals ring like bells. Sky crystals are common here.', mutation: 0.05, favored: ['crystal', 'shimmering'],
  },
};
