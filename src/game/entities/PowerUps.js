// Power-up pickups — pooled, spawned ahead and treadmilled.
import * as THREE from 'three'
import { CONFIG } from '../../config.js'
import { createPowerUp } from '../../assets.js'

const TYPES = ['shield', 'magnet', 'boost']

export class PowerUps {
  constructor(scene) {
    this.scene  = scene
    this.pool   = {}
    this.active = []
    this.dist   = 0
    this.nextAt = 60
  }

  reset() {
    for (const p of this.active) { this.scene.remove(p.mesh); this._pool(p) }
    this.active.length = 0
    this.dist   = 0
    this.nextAt = 60
  }

  _pool(p) {
    if (!this.pool[p.type]) this.pool[p.type] = []
    this.pool[p.type].push(p.mesh)
  }
  _get(type) {
    const a = this.pool[type]
    if (a && a.length) return a.pop()
    return createPowerUp(type)
  }

  _spawn() {
    const type = TYPES[(Math.random() * TYPES.length) | 0]
    const mesh = this._get(type)
    mesh.position.set(CONFIG.lanes.x[(Math.random() * 3) | 0], 1.1, CONFIG.world.spawnZ)
    this.scene.add(mesh)
    this.active.push({ mesh, type })
  }

  update(dt, speed, playerX) {
    const move = speed * dt
    let got = null

    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]
      p.mesh.position.z += move
      p.mesh.rotation.y += dt * 2
      p.mesh.position.y = 1.1 + Math.sin(performance.now() * 0.004 + i) * 0.18

      if (Math.abs(p.mesh.position.x - playerX) < 1.0 && Math.abs(p.mesh.position.z) < 1.0) {
        got = p.type
        this.scene.remove(p.mesh); this._pool(p)
        this.active.splice(i, 1)
        continue
      }
      if (p.mesh.position.z > CONFIG.world.despawnZ + 2) {
        this.scene.remove(p.mesh); this._pool(p)
        this.active.splice(i, 1)
      }
    }

    this.dist += move
    if (this.dist >= this.nextAt) {
      this._spawn()
      this.dist   = 0
      this.nextAt = 55 + Math.random() * 75
    }

    return got
  }
}
