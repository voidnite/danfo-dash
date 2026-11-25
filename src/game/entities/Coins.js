// Coins — large Subway-Surfers-style standing discs that arc through the lane.
// They face +Z (toward the camera) and spin. Spawn in arcs and straight lines.
import { CONFIG } from '../../config.js'
import { createCoin } from '../../assets.js'

const LANE_X = CONFIG.lanes.x

export class Coins {
  constructor(scene) {
    this.scene  = scene
    this.pool   = []
    this.active = []
    this.dist   = 0
    this.nextAt = 10
  }

  reset() {
    for (const c of this.active) { this.scene.remove(c); this.pool.push(c) }
    this.active.length = 0
    this.dist = 0; this.nextAt = 10
  }

  _get() { return this.pool.pop() || createCoin() }

  _spawnPattern(type) {
    const lane = (Math.random() * 3) | 0
    const x    = LANE_X[lane]
    const spZ  = CONFIG.world.spawnZ

    if (type === 'arc') {
      // Arc of coins over a hump — 10 coins
      const count = 10
      for (let i = 0; i < count; i++) {
        const c = this._get()
        const arcH = Math.sin((i / (count - 1)) * Math.PI) * 2.4
        c.position.set(x, CONFIG.coins.height + arcH, spZ - i * 2.4)
        c.rotation.set(0, 0, 0)
        this.scene.add(c); this.active.push(c)
      }
    } else {
      // Straight row in a lane — 7 coins
      const count = 7 + ((Math.random() * 4) | 0)
      for (let i = 0; i < count; i++) {
        const c = this._get()
        c.position.set(x, CONFIG.coins.height, spZ - i * CONFIG.coins.spacing)
        c.rotation.set(0, 0, 0)
        this.scene.add(c); this.active.push(c)
      }
    }
  }

  update(dt, speed, playerX, magnetActive, magnetRadius) {
    const move = speed * dt
    let collected = 0

    for (let i = this.active.length - 1; i >= 0; i--) {
      const c = this.active[i]
      c.position.z += move
      c.rotation.y += dt * 4   // spin

      // Coin always faces the camera
      c.rotation.x = 0

      // Magnet pull
      if (magnetActive) {
        const d = Math.hypot(c.position.x - playerX, c.position.z)
        if (d < magnetRadius) {
          c.position.x += (playerX - c.position.x) * (1 - Math.exp(-dt * 10))
          c.position.z += (0 - c.position.z)         * (1 - Math.exp(-dt * 10))
        }
      }

      // Collect
      if (Math.abs(c.position.x - playerX) < 1.0 && Math.abs(c.position.z) < 1.1) {
        collected++
        this.scene.remove(c); this.pool.push(c)
        this.active.splice(i, 1)
        continue
      }
      // Despawn
      if (c.position.z > CONFIG.world.despawnZ + 2) {
        this.scene.remove(c); this.pool.push(c)
        this.active.splice(i, 1)
      }
    }

    this.dist += move
    if (this.dist >= this.nextAt) {
      this._spawnPattern(Math.random() < 0.4 ? 'arc' : 'line')
      this.dist = 0
      this.nextAt = 12 + Math.random() * 20
    }
    return collected
  }
}
