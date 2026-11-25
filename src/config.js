// Central tuning constants for Danfo Dash.
// Treadmill model: player at z=0, world moves +Z, camera behind player.

export const CONFIG = {
  lanes: {
    count: 3,
    width: 2.8,
    x: [-2.8, 0, 2.8],
  },

  player: {
    groundY: 0,
    laneSwitchSpeed: 12,
    jumpVelocity: 10.5,
    gravity: 30,
    slideDuration: 0.65,
    invincibilityDuration: 1.6,
  },

  world: {
    baseSpeed: 12,          // start slower = easier, smoother feel
    maxSpeed: 36,           // cap lower = stays playable on mobile
    speedRamp: 0.35,        // gentler ramp
    segmentLength: 40,
    segmentCount: 7,        // 7 segments = less geometry
    spawnZ: -180,           // spawn closer = less geometry in scene
    despawnZ: 16,
  },

  spawn: {
    minRowGap: 14,          // more space between obstacles = more breathable
    maxRowGap: 28,
    coinRunLength: 6,
    powerUpChance: 0.04,
  },

  coins: {
    height: 1.2,
    spacing: 2.4,
  },

  lives: {
    start: 3,
    max: 3,
  },

  powerUps: {
    shield: { duration: 7,   color: '#29B6F6' },
    magnet: { duration: 8,   color: '#EF5350', radius: 6.5 },
    boost:  { duration: 4.5, color: '#FFCA28', multiplier: 1.6 },
  },

  scoring: {
    distancePerPoint: 5,
    coinBonus: 10,
  },

  storageKey: 'danfoDash.v3',
}
