// Traffic — spawns vehicles in -Z (ahead of player) and treadmills them toward
// the player at +Z. Patterns always leave at least one lane free.
import * as THREE from 'three'
import { CONFIG } from '../../config.js'
import { createDanfo, createCar, createKeke, createBarrier, createOverhead, CAR_COLORS } from '../../assets.js'

const LANE_X = CONFIG.lanes.x

const KIND = {
  danfo:    { build: createDanfo,    type: 'full' },
  car:      { build: createCar,      type: 'full' },
  keke:     { build: createKeke,     type: 'full' },
  barrier:  { build: createBarrier,  type: 'low'  },
  overhead: { build: createOverhead, type: 'high' },
  brt:      { build: null,           type: 'full' },  // BRT buses handled separately
  motorbike: { build: null,           type: 'full' },  // Motorbike handled separately
}
const FULL_KINDS = ['danfo', 'car', 'keke', 'brt', 'motorbike']  // Added motorbike

export class Traffic {
  constructor(scene) {
    this.scene  = scene
    this.pool   = {}   // kindKey → [mesh, …]
    this.active = []
    this.distSinceRow = 0
    this.nextGap = CONFIG.spawn.maxRowGap
  }

  reset() {
    for (const obs of this.active) {
      this.scene.remove(obs.mesh)
      this._toPool(obs)
    }
    this.active.length    = 0
    this.distSinceRow     = 0
    this.nextGap          = CONFIG.spawn.maxRowGap
  }

  _toPool(obs) {
    if (!this.pool[obs.kindKey]) this.pool[obs.kindKey] = []
    this.pool[obs.kindKey].push(obs.mesh)
  }

  _getMesh(kindKey) {
    const arr = this.pool[kindKey]
    if (arr && arr.length) return arr.pop()
    
    // Handle BRT separately since it's not in assets.js
    if (kindKey === 'brt') return this._createBRT()
    
    // Handle Motorbike separately
    if (kindKey === 'motorbike') return this._createMotorbike()
    
    const mesh = KIND[kindKey].build()
    if (kindKey === 'car')
      mesh.children[0]?.material?.color?.set(CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0])
    return mesh
  }

  _createBRT() {
    const w = 2.4, h = 2.8, d = 8.5  // Wider, taller, very long
    
    const container = new THREE.Group()
    
    // Main body - bright orange/red like reference
    const bodyColor = Math.random() < 0.5 ? 0xFF5722 : 0xF44336  // Orange-red or red
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    )
    body.position.y = h / 2
    container.add(body)
    
    // Roof stripe - darker red/brown
    const roofStripe = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.02, 0.3, d),
      new THREE.MeshLambertMaterial({ color: 0xB71C1C })
    )
    roofStripe.position.set(0, h, 0)
    container.add(roofStripe)
    
    // Windows on both sides - light blue/white
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xB3E5FC })
    const windowWidth = 0.8
    const windowHeight = 0.7
    const windowSpacing = 1.2
    const numWindows = 6
    
    for (const side of [-1, 1]) {
      for (let i = 0; i < numWindows; i++) {
        const windowZ = -d / 2 + 1 + i * windowSpacing
        const window = new THREE.Mesh(
          new THREE.PlaneGeometry(windowWidth, windowHeight),
          windowMat
        )
        window.position.set(side * (w / 2 + 0.01), h * 0.55, windowZ)
        window.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
        container.add(window)
      }
    }
    
    // Front windshield - larger window at front
    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.7, h * 0.4),
      windowMat
    )
    windshield.position.set(0, h * 0.65, -d / 2 + 0.02)
    container.add(windshield)
    
    // Yellow accent stripe along the middle
    const yellowStripe = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, d * 0.9),
      new THREE.MeshBasicMaterial({ color: 0xFFD600 })
    )
    yellowStripe.position.set(w / 2 + 0.02, h * 0.35, 0)
    yellowStripe.rotation.y = Math.PI / 2
    container.add(yellowStripe)
    
    // Articulation joint (middle section darker)
    const joint = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.9, h * 0.8, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x212121 })
    )
    joint.position.set(0, h * 0.45, 0)
    container.add(joint)
    
    // Wheels
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
    const wheelPositions = [
      [-w/2 - 0.1, 0.3, -d/2 + 1],
      [w/2 + 0.1, 0.3, -d/2 + 1],
      [-w/2 - 0.1, 0.3, d/2 - 1],
      [w/2 + 0.1, 0.3, d/2 - 1],
    ]
    for (const [wx, wy, wz] of wheelPositions) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8),
        wheelMat
      )
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(wx, wy, wz)
      container.add(wheel)
    }
    
    container.userData = { width: w, height: h, depth: d }
    return container
  }

  _createMotorbike() {
    const container = new THREE.Group()
    
    // BIG MOTORBIKE dimensions - larger and sportier
    const bikeW = 1.2, bikeH = 1.4, bikeD = 2.6
    
    // Sportbike colors - aggressive colors
    const bikeColors = [0xE53935, 0x1A1A1A, 0x1565C0, 0xFFD600, 0x00E676, 0xFF6F00]
    const bikeColor = bikeColors[Math.floor(Math.random() * bikeColors.length)]
    
    // Main bike body - larger, more aggressive
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(bikeW, 0.7, bikeD * 0.6),
      new THREE.MeshLambertMaterial({ color: bikeColor })
    )
    body.position.y = 0.9
    container.add(body)
    
    // Fuel tank - sporty, bigger
    const tank = new THREE.Mesh(
      new THREE.BoxGeometry(bikeW * 0.9, 0.5, 1.0),
      new THREE.MeshLambertMaterial({ color: bikeColor })
    )
    tank.position.set(0, 1.3, -0.2)
    container.add(tank)
    
    // Front fairing - racing style
    const fairing = new THREE.Mesh(
      new THREE.BoxGeometry(bikeW * 1.1, 0.8, 0.5),
      new THREE.MeshLambertMaterial({ color: bikeColor })
    )
    fairing.position.set(0, 1.1, -bikeD / 2 + 0.4)
    container.add(fairing)
    
    // Windscreen
    const windscreen = new THREE.Mesh(
      new THREE.BoxGeometry(bikeW * 0.8, 0.5, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 0.6 })
    )
    windscreen.position.set(0, 1.6, -bikeD / 2 + 0.3)
    windscreen.rotation.x = -0.3
    container.add(windscreen)
    
    // Handlebars - wide and sporty
    const handlebar = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.12, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
    )
    handlebar.position.set(0, 1.3, -bikeD / 2 + 0.5)
    container.add(handlebar)
    
    // Seat - racing style
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(bikeW * 0.95, 0.25, 1.1),
      new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
    )
    seat.position.set(0, 1.15, 0.3)
    container.add(seat)
    
    // Rear tail section - sporty
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(bikeW * 0.7, 0.4, 0.6),
      new THREE.MeshLambertMaterial({ color: bikeColor })
    )
    tail.position.set(0, 1.2, bikeD / 2 - 0.2)
    container.add(tail)
    
    // Wheels - BIG racing wheels
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x888888 })
    
    // Front wheel - larger
    const frontWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12),
      wheelMat
    )
    frontWheel.rotation.z = Math.PI / 2
    frontWheel.position.set(0, 0.45, -bikeD / 2 + 0.5)
    container.add(frontWheel)
    
    // Front rim
    const frontRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.27, 12),
      rimMat
    )
    frontRim.rotation.z = Math.PI / 2
    frontRim.position.set(0, 0.45, -bikeD / 2 + 0.5)
    container.add(frontRim)
    
    // Rear wheel - larger
    const backWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12),
      wheelMat
    )
    backWheel.rotation.z = Math.PI / 2
    backWheel.position.set(0, 0.5, bikeD / 2 - 0.5)
    container.add(backWheel)
    
    // Rear rim
    const backRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.32, 12),
      rimMat
    )
    backRim.rotation.z = Math.PI / 2
    backRim.position.set(0, 0.5, bikeD / 2 - 0.5)
    container.add(backRim)
    
    // Front fork
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.8, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    )
    fork.position.set(0, 0.85, -bikeD / 2 + 0.5)
    container.add(fork)
    
    // Solo rider - sporty riding position (leaning forward)
    const riderBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.0, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x1A1A1A })  // Black leather jacket
    )
    riderBody.position.set(0, 1.8, 0.1)
    riderBody.rotation.x = 0.3  // Leaning forward
    container.add(riderBody)
    
    // Rider head with full-face helmet
    const helmetColors = [0xE53935, 0x1A1A1A, 0xFFD600, 0xFFFFFF, 0x1565C0]
    const helmetColor = helmetColors[Math.floor(Math.random() * helmetColors.length)]
    const riderHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshLambertMaterial({ color: helmetColor })
    )
    riderHead.position.set(0, 2.4, -0.1)
    container.add(riderHead)
    
    // Helmet visor
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.15, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x111111, transparent: true, opacity: 0.8 })
    )
    visor.position.set(0, 2.4, -0.3)
    container.add(visor)
    
    // Dual exhaust pipes - racing style
    for (const side of [-0.35, 0.35]) {
      const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8),
        new THREE.MeshLambertMaterial({ color: 0x424242 })
      )
      exhaust.rotation.x = Math.PI / 2
      exhaust.position.set(side, 0.7, bikeD / 2 - 0.3)
      container.add(exhaust)
      
      // Exhaust tip (chrome)
      const exhaustTip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.1, 0.1, 8),
        new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
      )
      exhaustTip.rotation.x = Math.PI / 2
      exhaustTip.position.set(side, 0.7, bikeD / 2 + 0.1)
      container.add(exhaustTip)
    }
    
    // Headlight (single racing LED)
    const headlight = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0xFFFFFF, emissive: 0xFFFFAA })
    )
    headlight.position.set(0, 1.1, -bikeD / 2 + 0.42)
    container.add(headlight)
    
    // Rear taillight
    const taillight = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.12, 0.08),
      new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0x880000 })
    )
    taillight.position.set(0, 1.3, bikeD / 2 + 0.05)
    container.add(taillight)
    
    container.userData = { width: bikeW + 0.5, height: 2.7, depth: bikeD }
    return container
  }

  _spawnObs(kindKey, lane) {
    const mesh = this._getMesh(kindKey)
    // Player is at z=0 and world runs forward (player runs toward -Z, so
    // obstacles start far at -Z and move toward +Z)
    const spawnZ = CONFIG.world.spawnZ   // e.g. -180
    mesh.position.set(lane === null ? 0 : LANE_X[lane], 0, spawnZ)
    this.scene.add(mesh)
    this.active.push({ mesh, kindKey, lane })
  }

  _pickFull() { return FULL_KINDS[(Math.random() * FULL_KINDS.length) | 0] }

  _spawnRow(difficulty) {
    const lanes = [0, 1, 2]
    const rand3 = () => (Math.random() * 3) | 0
    const pattern = this._pickPattern(difficulty)

    switch (pattern) {
      case 'single':
        this._spawnObs(Math.random() < 0.7 ? this._pickFull() : 'barrier', rand3())
        break
      case 'double': {
        const free = rand3()
        for (const l of lanes) if (l !== free) this._spawnObs(this._pickFull(), l)
        break
      }
      case 'overhead':
        this._spawnObs('overhead', null)
        break
      case 'barriers': {
        const free = rand3()
        for (const l of lanes) if (l !== free) this._spawnObs('barrier', l)
        break
      }
      case 'mixed': {
        const order = [...lanes].sort(() => Math.random() - 0.5)
        this._spawnObs(this._pickFull(), order[0])
        this._spawnObs('barrier',         order[1])
        break
      }
    }
  }

  _pickPattern(d) {
    // d goes 0→1 as difficulty increases
    const w = [
      { name: 'single',   w: 1.0            },
      { name: 'double',   w: 0.1 + 0.7 * d  },
      { name: 'overhead', w: 0.08 + 0.5 * d },
      { name: 'barriers', w: 0.05 + 0.4 * d },
      { name: 'mixed',    w: 0.05 + 0.35 * d},
    ]
    const total = w.reduce((s, x) => s + x.w, 0)
    let r = Math.random() * total
    for (const p of w) { if ((r -= p.w) <= 0) return p.name }
    return 'single'
  }

  update(dt, speed, difficulty) {
    const move = speed * dt

    for (let i = this.active.length - 1; i >= 0; i--) {
      const obs = this.active[i]
      obs.mesh.position.z += move
      if (obs.mesh.position.z > CONFIG.world.despawnZ + 2) {
        this.scene.remove(obs.mesh)
        this._toPool(obs)
        this.active.splice(i, 1)
      }
    }

    this.distSinceRow += move
    if (this.distSinceRow >= this.nextGap) {
      this._spawnRow(difficulty)
      this.distSinceRow = 0
      this.nextGap = THREE.MathUtils.lerp(
        CONFIG.spawn.maxRowGap, CONFIG.spawn.minRowGap, difficulty
      ) * (0.82 + Math.random() * 0.36)
      this.nextGap = Math.max(this.nextGap, CONFIG.spawn.minRowGap)
    }
  }

  getObstacles() {
    return this.active.map(o => ({
      x:      o.mesh.position.x,
      z:      o.mesh.position.z,
      width:  o.mesh.userData.width  || 2,
      depth:  o.mesh.userData.depth  || 2,
      height: o.mesh.userData.height || 1.5,
      type:   KIND[o.kindKey].type,
    }))
  }
}
