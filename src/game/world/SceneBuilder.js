// SceneBuilder — Looks like reference image 2.
// Road: dark grey, MeshBasicMaterial (crisp, no lighting blowout).
// Buildings: close to road, saturated cartoon colours with signs.
// Camera: angled like a runner game — slightly high, looking ahead down the road.
// Performance: NO shadows, NO standard material, pixel ratio ≤ 1.5.
import * as THREE from 'three'
import { CONFIG } from '../../config.js'

// ─── Textures — built once, reused forever ────────────────────────────────

function makeRoadTex() {
  const W = 512, H = 1024
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  // Solid dark charcoal — single consistent colour, no gradients
  ctx.fillStyle = '#303238'
  ctx.fillRect(0, 0, W, H)
  // White solid edge lines
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 14, H)
  ctx.fillRect(W - 14, 0, 14, H)
  // Bold white centre lane dashes
  const dh = 100, gh = 60, lw = 10
  const x1 = Math.round(W / 3) - lw / 2
  const x2 = Math.round((W * 2) / 3) - lw / 2
  for (let y = 0; y < H; y += dh + gh) {
    ctx.fillRect(x1, y, lw, dh)
    ctx.fillRect(x2, y, lw, dh)
  }
  const t = new THREE.CanvasTexture(c)
  // NoColorSpace = texture is already in the correct colour space,
  // renderer must not apply any additional gamma conversion
  t.colorSpace = THREE.NoColorSpace
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

function makePaveTex() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#B8B0A0'; ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = '#9A9080'; ctx.lineWidth = 1.5
  for (let x = 0; x < 128; x += 40) ctx.strokeRect(x, 0, 40, 128)
  for (let y = 0; y < 128; y += 40) ctx.strokeRect(0, y, 128, 40)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

// Building colours matching reference image 2: saturated reds, blues, greens,
// NO YELLOW - removed yellow buildings per user request
const BLDG_PALETTE = [
  { wall: '#E53935', dark: '#B71C1C', sign: 'STORE' },
  { wall: '#1E88E5', dark: '#1565C0', sign: 'CAFE'  },
  { wall: '#43A047', dark: '#2E7D32', sign: 'FOOD'  },
  { wall: '#D32F2F', dark: '#C62828', sign: 'HOTEL' },  // Changed from yellow to red
  { wall: '#8E24AA', dark: '#6A1B9A', sign: 'SHOP'  },
  { wall: '#00ACC1', dark: '#007C91', sign: 'BANK'  },
  { wall: '#F4511E', dark: '#BF360C', sign: 'BUKA'  },
  { wall: '#5E35B1', dark: '#4527A0', sign: 'VEEP'  },  // Changed from yellow to purple
]
const _bldgTexCache = {}
function bldgTex(idx) {
  if (_bldgTexCache[idx]) return _bldgTexCache[idx]
  const p = BLDG_PALETTE[idx % BLDG_PALETTE.length]
  const W = 256, H = 512
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = p.wall; ctx.fillRect(0, 0, W, H)
  // Darker base section
  ctx.fillStyle = p.dark; ctx.fillRect(0, H * 0.78, W, H * 0.22)
  // Windows 4×6
  const cols = 4, rows = 6, px = 22, py = 44
  const ww = (W - px * (cols + 1)) / cols
  const wh = (H * 0.7 - py * (rows + 1)) / rows
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = px + col * (ww + px)
      const y = py + r * (wh + py)
      ctx.fillStyle = Math.random() < 0.4 ? '#FFF9C4' : '#0A1929'
      ctx.fillRect(x, y, ww, wh)
    }
  }
  // Bold sign at bottom
  ctx.fillStyle = '#111'; ctx.fillRect(0, H - 120, W, 120)
  ctx.fillStyle = '#E53935'; ctx.fillRect(14, H - 110, W - 28, 96)  // Changed from yellow to red
  ctx.fillStyle = '#FFFFFF'  // White text for better contrast on red
  ctx.font = 'bold 48px Arial Black,sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(p.sign, W / 2, H - 62)
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4
  _bldgTexCache[idx] = t; return t
}

// ─── Constants ────────────────────────────────────────────────────────────
const ROAD_W  = CONFIG.lanes.width * 3 + 1.0  // 9.4
const SEG_LEN = CONFIG.world.segmentLength     // 40
const NUM_SEG = CONFIG.world.segmentCount      // 8
const TOTAL   = SEG_LEN * NUM_SEG              // 320
const SPAWN_Z = CONFIG.world.spawnZ            // -200
const DESPAWN = CONFIG.world.despawnZ          // 16
const RANGE   = Math.abs(SPAWN_Z) + DESPAWN    // 216

// ═══════════════════════════════════════════════════════════════════════════
export class SceneBuilder {
  constructor(container) {
    this.container = container

    // ── RENDERER — MAXIMUM mobile performance + NO GLITCHES ───────────
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      precision: 'mediump',  // lowp caused colour banding on mobile GPUs
      alpha: true,
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: false,
    })
    this.renderer.setClearColor(0x64B5F6, 1)
    // Pixel ratio: cap at 1.5 on mobile, 2 on desktop
    const isMobile = window.innerWidth < 768
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = false
    this.renderer.sortObjects = false   // renderOrder handles layering explicitly
    // NoToneMapping + SRGBColorSpace = colours render exactly as authored
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.toneMappingExposure = 1.0
    if ('outputColorSpace' in this.renderer) this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)

    // ── SCENE ────────────────────────────────────────────────────────────
    this.scene = new THREE.Scene()
    this.scene.background = null
    this.scene.fog = new THREE.Fog(0x90CAF9, 80, 160)  // far enough to never fog the road

    // ── CAMERA — Adaptive FOV keeps full road width visible on any screen ──
    // We target a fixed horizontal FOV (~58° covers road + both buildings).
    // Three.js FOV is vertical, so we derive the vertical FOV from the
    // horizontal target using: vFOV = 2 * atan(tan(hFOV/2) / aspect)
    // On portrait phones (narrow aspect) this produces a larger vFOV,
    // which widens the horizontal view back to the target — fixing cropping.
    const W = window.innerWidth
    const H = window.innerHeight
    const aspect = W / H
    const vFov = SceneBuilder._calcFov(aspect)

    this.camera = new THREE.PerspectiveCamera(vFov, aspect, 0.5, 220)
    this._camX  = 0
    this._bobPh = 0

    // Camera position adapts to portrait vs landscape:
    // Portrait (tall): pull back more and raise up so both road sides fit
    // Landscape (wide): standard position
    this._applyOrientationCamera(aspect)

    this.camera.position.set(0, this._camY, this._camZ)
    this.camera.lookAt(0, 0.5, this._lookZ)

    this._buildSky()
    this._buildLight()
    this._buildRoad()
    this._buildProps()
    this._buildBridge()  // Add pedestrian bridge across road
    this._buildBillboard()  // Add "THIS IS LAGOS" billboard
    this._buildPedestrians()  // Add pedestrians on sidewalks
  }

  // ── Adaptive FOV helper ───────────────────────────────────────────────
  // Derives vertical FOV from a target horizontal FOV.
  // We target 72° horizontal — wide enough to show road + buildings on all
  // devices without distortion.
  static _calcFov(aspect) {
    const H_FOV_DEG = 72
    const hFovRad   = (H_FOV_DEG * Math.PI) / 180
    const vFovRad   = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect)
    const vFovDeg   = (vFovRad * 180) / Math.PI
    // 105° max keeps portrait usable; 42° min prevents over-zoom on wide screens
    return Math.min(105, Math.max(42, vFovDeg))
  }

  // Camera position tuned so the player fills ~22-28% of screen height.
  // Rule: camZ ≈ playerHeight / (targetFraction * 2 * tan(vFOV/2))
  // Player is ~2.2 units tall. At camZ=6, camY=4.5 → player is prominent.
  _applyOrientationCamera(aspect) {
    if (aspect < 0.65) {
      // ── Narrow portrait phone (360×800, 390×844, 412×915) ────────────
      this._camY   = 4.2    // low angle — road perspective, player dominates
      this._camZ   = 6.5    // close — player fills lower 25% of screen
      this._lookZ  = -8     // look just ahead, keeps road visible
    } else if (aspect < 0.85) {
      // ── Wider portrait / small tablet ────────────────────────────────
      this._camY   = 5.0
      this._camZ   = 7.5
      this._lookZ  = -10
    } else if (aspect < 1.2) {
      // ── Landscape phone ───────────────────────────────────────────────
      this._camY   = 5.5
      this._camZ   = 9.0
      this._lookZ  = -14
    } else {
      // ── Desktop / wide ────────────────────────────────────────────────
      this._camY   = 6.5
      this._camZ   = 11.0
      this._lookZ  = -18
    }
  }

  // ── Sky + sun ────────────────────────────────────────────────────────────
  _buildSky() {
    // Blue sky gradient - removed yellow per user request
    const c = document.createElement('canvas'); c.width = 2; c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0,    '#1565C0')  // Dark blue top
    g.addColorStop(0.3,  '#1E88E5')  // Medium blue
    g.addColorStop(0.6,  '#42A5F5')  // Light blue
    g.addColorStop(0.85, '#64B5F6')  // Lighter blue
    g.addColorStop(1,    '#90CAF9')  // Pale blue
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2, 256)
    const skyMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 300),  // Taller — covers down to horizon
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false })
    )
    skyMesh.position.set(0, 30, -145)  // Lowered so bottom edge reaches ground horizon
    skyMesh.renderOrder = -1
    this.scene.add(skyMesh)
    this._skyMesh = skyMesh

    // Clouds - white for blue sky
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    this._clouds = []
    const cloudPos = [[-30, 28, -90], [22, 32, -110], [-50, 26, -75], [44, 30, -130]]
    for (const [cx, cy, cz] of cloudPos) {
      const cg = new THREE.Group()
      for (const [dx, dy, r] of [[0,0,2.5],[-2.6,0,1.9],[2.6,0,1.9],[0,1.5,1.6]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), cloudMat)
        m.position.set(dx, dy, 0); cg.add(m)
      }
      cg.position.set(cx, cy, cz)
      this.scene.add(cg); this._clouds.push(cg)
    }
  }

  // ── Minimal lighting — low intensity so Lambert doesn't wash out ─────────
  _buildLight() {
    // Soft ambient — keeps colours visible without overexposure
    this.scene.add(new THREE.AmbientLight(0xFFFFFF, 0.65))
    // Directional for mild depth shading only
    const dir = new THREE.DirectionalLight(0xFFFDE7, 0.9)
    dir.position.set(-8, 18, 8); dir.castShadow = false
    this.scene.add(dir)
  }

  // ── Road, pavement, kerbs ────────────────────────────────────────────────
  _buildRoad() {
    const roadTex = makeRoadTex(); roadTex.repeat.set(1, SEG_LEN / 40)
    const paveTex = makePaveTex(); paveTex.repeat.set(3, SEG_LEN / 6)

    // Road uses MeshBasicMaterial — IMMUNE to lighting blowout
    const roadMat = new THREE.MeshBasicMaterial({ map: roadTex })
    // Pavement also MeshBasicMaterial — no lighting differences at seam
    const paveMat = new THREE.MeshBasicMaterial({ map: paveTex })
    const kerbMat = new THREE.MeshLambertMaterial({ color: 0xD5CCBC })

    this._roadSegs = []; this._sideSegs = []

    // Ground plane — rendered first, road draws on top.
    // y=-0.1 gives solid separation for mediump depth precision.
    const groundMat = new THREE.MeshBasicMaterial({ color: 0xB5A48A })
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(200, Math.abs(SPAWN_Z) + DESPAWN + 40),
      groundMat
    )
    groundPlane.rotation.x = -Math.PI / 2
    groundPlane.position.set(0, -0.1, SPAWN_Z / 2 + DESPAWN / 2)
    groundPlane.renderOrder = 0
    this.scene.add(groundPlane)

    for (let i = 0; i < NUM_SEG; i++) {
      const z = SPAWN_Z + SEG_LEN / 2 + i * SEG_LEN
      const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, SEG_LEN), roadMat)
      road.rotation.x = -Math.PI / 2
      road.position.set(0, 0, z)
      this.scene.add(road); this._roadSegs.push(road)
      for (const side of [-1, 1]) {
        const pave = new THREE.Mesh(new THREE.PlaneGeometry(2.5, SEG_LEN), paveMat.clone())
        pave.rotation.x = -Math.PI / 2
        // y=0.004 — 4mm above the road. Enough for mediump depth buffer at
        // any camera distance within the game, eliminates z-fighting without
        // needing renderOrder tricks.
        pave.position.set(side * (ROAD_W / 2 + 1.25), 0.004, z)
        this.scene.add(pave); this._sideSegs.push(pave)
        const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, SEG_LEN), kerbMat)
        kerb.position.set(side * (ROAD_W / 2 + 0.15), 0.08, z)
        this.scene.add(kerb); this._sideSegs.push(kerb)
      }
    }
    // Ground plane covers all gaps beyond the sidewalks
  }

  // ── Side props — buildings very close to road, like reference image 2 ────
  _buildProps() {
    this._props = []; let idx = 0
    const spacing = 10
    for (let z = SPAWN_Z; z < DESPAWN + spacing; z += spacing) {
      this._props.push(this._prop(-1, z, idx++))
      this._props.push(this._prop(1,  z, idx++))
    }
  }

  _prop(side, z, idx) {
    const xBase = ROAD_W / 2 + 5.5  // base of pavement outer edge
    const r = idx % 10
    let obj

    if (r < 6) {
      // Colourful building RIGHT next to road — like reference image 2
      const w = 5 + (r % 3) * 2
      const h = 10 + (idx % 5) * 5
      const d = 3.5 + (r % 2) * 1.5
      const mat = new THREE.MeshLambertMaterial({ map: bldgTex(idx % BLDG_PALETTE.length) })
      obj = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      obj.position.set(side * (xBase + w / 2), h / 2, z)
    } else if (r < 8) {
      obj = this._palm(); obj.position.set(side * (ROAD_W / 2 + 1.4), 0, z)
    } else if (r === 8) {
      obj = this._light(side); obj.position.set(side * (ROAD_W / 2 + 0.9), 0, z)
    } else {
      obj = this._kiosk(idx); obj.position.set(side * (ROAD_W / 2 + 2.4), 0, z)
    }
    this.scene.add(obj); return obj
  }

  _palm() {
    const g = new THREE.Group()
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 5.5, 6),
      new THREE.MeshLambertMaterial({ color: 0x8D6E63 }))
    trunk.position.y = 2.75; g.add(trunk)
    const lm = new THREE.MeshLambertMaterial({ color: 0x2E7D32, side: THREE.DoubleSide })
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2
      const lf = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.2, 4), lm)
      lf.position.set(Math.cos(ang) * 0.6, 5.4, Math.sin(ang) * 0.6)
      lf.rotation.set(Math.PI / 2.4, 0, ang); g.add(lf)
    }
    return g
  }

  _light(side) {
    const g = new THREE.Group()
    const pm = new THREE.MeshLambertMaterial({ color: 0x37474F })
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 7, 6), pm)
    pole.position.y = 3.5; g.add(pole)
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 5), pm)
    arm.rotation.z = Math.PI / 2; arm.position.set(side * 0.8, 7.0, 0); g.add(arm)
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xFFF9C4, emissive: 0xFFEE58, emissiveIntensity: 1.2 }))
    lamp.position.set(side * 1.6, 7.0, 0); g.add(lamp)
    return g
  }

  _kiosk(idx) {
    const cols = [0xE53935, 0x43A047, 0xFB8C00, 0x1E88E5, 0x8E24AA]
    const g = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 1.6),
      new THREE.MeshLambertMaterial({ color: cols[idx % cols.length] }))
    body.position.y = 1.2; g.add(body)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.14, 2.0),
      new THREE.MeshLambertMaterial({ color: 0x37474F }))  // Changed from yellow to grey
    roof.position.y = 2.47; g.add(roof)
    return g
  }

  // ── Pedestrian bridge across road (Lagos landmark) ──────────────────────
  _buildBridge() {
    // Build a STATIONARY pedestrian bridge that the player runs under
    // The bridge is attached to the camera so it stays in place while world scrolls
    const bridgeZ = -30  // Distance from camera - player will pass under it
    const bridgeHeight = 8  // High enough for player and vehicles to pass under
    const bridgeWidth = ROAD_W + 6  // Spans entire road width plus extra
    
    // Create a group attached to camera (stays fixed in world space)
    this._bridgeGroup = new THREE.Group()
    this._bridgeGroup.position.set(0, 0, bridgeZ)
    
    // ── Support pillars on both sides (outside the road) ──
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x424242 })
    
    // Left pillar
    const leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, bridgeHeight, 1.2),
      pillarMat
    )
    leftPillar.position.set(-(ROAD_W / 2 + 2.5), bridgeHeight / 2, 0)
    this._bridgeGroup.add(leftPillar)
    
    // Right pillar
    const rightPillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, bridgeHeight, 1.2),
      pillarMat
    )
    rightPillar.position.set(ROAD_W / 2 + 2.5, bridgeHeight / 2, 0)
    this._bridgeGroup.add(rightPillar)
    
    // ── Main bridge deck ──
    const deckMat = new THREE.MeshLambertMaterial({ color: 0x757575 })
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeWidth, 0.5, 6),
      deckMat
    )
    deck.position.set(0, bridgeHeight, 0)
    this._bridgeGroup.add(deck)
    
    // ── Side railings ──
    const railingMat = new THREE.MeshLambertMaterial({ color: 0x37474F })  // Grey railings
    
    // Left railing
    const leftRailing = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 1.5, 6),
      railingMat
    )
    leftRailing.position.set(-bridgeWidth / 2 + 0.15, bridgeHeight + 0.95, 0)
    this._bridgeGroup.add(leftRailing)
    
    // Right railing
    const rightRailing = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 1.5, 6),
      railingMat
    )
    rightRailing.position.set(bridgeWidth / 2 - 0.15, bridgeHeight + 0.95, 0)
    this._bridgeGroup.add(rightRailing)
    
    // ── Railing posts (vertical yellow bars) ──
    for (let i = -2; i <= 2; i++) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
        railingMat
      )
      post.position.set(-bridgeWidth / 2 + 0.15, bridgeHeight + 0.95, i * 1.4)
      this._bridgeGroup.add(post)
      
      const post2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8),
        railingMat
      )
      post2.position.set(bridgeWidth / 2 - 0.15, bridgeHeight + 0.95, i * 1.4)
      this._bridgeGroup.add(post2)
    }
    
    // ── Cross beams for support (underneath) ──
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x616161 })
    for (let i = -2; i <= 2; i++) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(bridgeWidth - 3, 0.5, 0.5),
        beamMat
      )
      beam.position.set(0, bridgeHeight - 0.7, i * 1.5)
      this._bridgeGroup.add(beam)
    }
    
    // Diagonal support beams
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const diag = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 6, 0.3),
          beamMat
        )
        diag.position.set(
          side * (ROAD_W / 2 + 1.5),
          bridgeHeight / 2,
          -2 + i * 2
        )
        diag.rotation.set(0, 0, side * 0.3)
        this._bridgeGroup.add(diag)
      }
    }
    
    // ── Stairs on both sides ──
    const stairMat = new THREE.MeshLambertMaterial({ color: 0x757575 })
    
    // Left stairs (going up)
    for (let step = 0; step < 12; step++) {
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.3, 1.1),
        stairMat
      )
      const stepHeight = (step + 1) * (bridgeHeight / 12)
      stair.position.set(
        -(ROAD_W / 2 + 2.5),
        stepHeight,
        4 + step * 0.65
      )
      this._bridgeGroup.add(stair)
      
      // Stair railings
      const stairRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.0, 1.1),
        railingMat
      )
      stairRail.position.set(
        -(ROAD_W / 2 + 2.5) - 1.2,
        stepHeight + 0.6,
        4 + step * 0.65
      )
      this._bridgeGroup.add(stairRail)
    }
    
    // Right stairs (going down)
    for (let step = 0; step < 12; step++) {
      const stair = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.3, 1.1),
        stairMat
      )
      const stepHeight = (step + 1) * (bridgeHeight / 12)
      stair.position.set(
        ROAD_W / 2 + 2.5,
        stepHeight,
        -4 - step * 0.65
      )
      this._bridgeGroup.add(stair)
      
      // Stair railings
      const stairRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 1.0, 1.1),
        railingMat
      )
      stairRail.position.set(
        ROAD_W / 2 + 2.5 + 1.2,
        stepHeight + 0.6,
        -4 - step * 0.65
      )
      this._bridgeGroup.add(stairRail)
    }
    
    // ── Add overhead sign ──
    const signBoardMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(bridgeWidth - 4, 1.0, 0.15),
      signBoardMat
    )
    signBoard.position.set(0, bridgeHeight + 2.5, -3.1)
    this._bridgeGroup.add(signBoard)
    
    // Yellow stripe on sign
    const signStripe = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.6, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xE53935 })  // Red stripe
    )
    signStripe.position.set(0, bridgeHeight + 2.5, -3.15)
    this._bridgeGroup.add(signStripe)
    
    // Add bridge group to scene at a fixed world position.
    // It will scroll with the world in update() like any other prop.
    this._bridgeGroup.position.set(0, 0, SPAWN_Z + 80)  // appears mid-distance ahead
    this.scene.add(this._bridgeGroup)
    this._props.push(this._bridgeGroup)  // recycled by the prop treadmill
  }

  // ── Billboard with "THIS IS LAGOS" ─────────────────────────────────────
  _buildBillboard() {
    // Create billboard ON TOP of the bridge like a highway overhead sign
    const billboardZ = -30  // Same Z as bridge
    const billboardHeight = 11  // Mounted high above road
    const billboardWidth = 10  // Wide enough to span over road
    
    this._billboardGroup = new THREE.Group()
    // Position ABOVE the road (centered, high up)
    this._billboardGroup.position.set(0, billboardHeight, billboardZ)
    
    // ── Main billboard panel (blue background) ──
    const panelMat = new THREE.MeshBasicMaterial({ 
      color: 0x1565C0,  // Blue background
      side: THREE.DoubleSide  // Visible from both sides
    })
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(billboardWidth, 4, 0.3),
      panelMat
    )
    panel.position.set(0, 0, 0)
    this._billboardGroup.add(panel)
    
    // ── "THIS IS LAGOS" text using canvas texture ──
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    
    // Background
    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, 0, 1024, 512)
    
    // Text shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
    
    // "THIS IS" text
    ctx.fillStyle = '#1565C0'  // Blue text
    ctx.font = 'bold 100px Arial Black, Impact, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('THIS IS', 512, 160)
    
    // "LAGOS" - bigger and bolder
    ctx.font = 'bold 150px Arial Black, Impact, sans-serif'
    ctx.fillText('LAGOS', 512, 340)
    
    // White outline for contrast
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 6
    ctx.font = 'bold 100px Arial Black, Impact, sans-serif'
    ctx.strokeText('THIS IS', 512, 160)
    ctx.font = 'bold 150px Arial Black, Impact, sans-serif'
    ctx.strokeText('LAGOS', 512, 340)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    
    const textMat = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: false,
      side: THREE.DoubleSide
    })
    
    const textMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(billboardWidth - 0.4, 3.8),
      textMat
    )
    textMesh.position.set(0, 0, 0.35)
    this._billboardGroup.add(textMesh)
    
    // ── Red frame around billboard ──
    const frameMat = new THREE.MeshLambertMaterial({ color: 0xE53935 })
    
    // Top frame
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(billboardWidth + 0.4, 0.3, 0.4),
      frameMat
    )
    topFrame.position.set(0, 2.15, 0)
    this._billboardGroup.add(topFrame)
    
    // Bottom frame
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(billboardWidth + 0.4, 0.3, 0.4),
      frameMat
    )
    bottomFrame.position.set(0, -2.15, 0)
    this._billboardGroup.add(bottomFrame)
    
    // Left frame
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4.3, 0.4),
      frameMat
    )
    leftFrame.position.set(-billboardWidth / 2 - 0.15, 0, 0)
    this._billboardGroup.add(leftFrame)
    
    // Right frame
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4.3, 0.4),
      frameMat
    )
    rightFrame.position.set(billboardWidth / 2 + 0.15, 0, 0)
    this._billboardGroup.add(rightFrame)
    
    // ── Corner lights (glowing yellow bulbs) ──
    const lightMat = new THREE.MeshBasicMaterial({ 
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 1
    })
    
    const corners = [
      [-billboardWidth / 2, 2.15],
      [billboardWidth / 2, 2.15],
      [-billboardWidth / 2, -2.15],
      [billboardWidth / 2, -2.15]
    ]
    
    for (const [x, y] of corners) {
      const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        lightMat
      )
      light.position.set(x, y, 0.5)
      this._billboardGroup.add(light)
    }
    
    // ── Support brackets connecting to bridge ──
    const bracketMat = new THREE.MeshLambertMaterial({ color: 0x424242 })
    
    // Left bracket
    const leftBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.3),
      bracketMat
    )
    leftBracket.position.set(-billboardWidth / 2 - 0.5, -3.5, 0)
    leftBracket.rotation.z = -0.3
    this._billboardGroup.add(leftBracket)
    
    // Right bracket
    const rightBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.3),
      bracketMat
    )
    rightBracket.position.set(billboardWidth / 2 + 0.5, -3.5, 0)
    rightBracket.rotation.z = 0.3
    this._billboardGroup.add(rightBracket)

    // Add billboard to scene (not camera) — scrolls with world like a prop
    this._billboardGroup.position.set(0, billboardHeight, SPAWN_Z + 80)
    this.scene.add(this._billboardGroup)
    this._props.push(this._billboardGroup)
  }

  // ── Pedestrians on sidewalks ──────────────────────────────────────────
  // 80 total (40 per side) — busy Lagos street without the 270-pedestrian
  // freeze. Each pedestrian is ~10 child meshes = ~800 objects total.
  // Spaced evenly and treadmilled like props.
  _buildPedestrians() {
    this._pedestrians = []
    const perSide = 40
    const zRange  = Math.abs(SPAWN_Z) + DESPAWN   // full world depth

    for (const side of [-1, 1]) {
      for (let i = 0; i < perSide; i++) {
        const z    = SPAWN_Z + (i / perSide) * zRange
        const seed = i * 7.3 + (side < 0 ? 0 : 100)
        const ped  = this._createPedestrian(seed)
        // Vary X position slightly so they don't line up perfectly
        const xOff = 2.2 + (Math.abs(Math.sin(seed * 3.1)) * 1.4)
        ped.position.set(side * (ROAD_W / 2 + xOff), 0, z)
        this.scene.add(ped)
        this._pedestrians.push(ped)
      }
    }
  }

  _createPedestrian(seed) {
    // Shared material cache — avoids a new MeshLambertMaterial per mesh
    if (!this._pedMats) {
      this._pedMats = {}
    }
    const pm = (c) => {
      if (!this._pedMats[c]) this._pedMats[c] = new THREE.MeshLambertMaterial({ color: c })
      return this._pedMats[c]
    }

    const group = new THREE.Group()
    const rand = Math.abs(Math.sin(seed * 12.9898))
    
    // Determine gender
    const isMale = rand > 0.5
    
    // Determine activity: walking, hawking, or carrying bag
    const activity = rand < 0.33 ? 'hawking' : (rand < 0.66 ? 'walking' : 'bag')
    
    // Body colors - varied clothing
    const shirtColors = [0x2196F3, 0xE53935, 0x43A047, 0xFFB300, 0x8E24AA, 0xFFFFFF, 0x1A1A1A]
    const pantsColors = [0x1565C0, 0x424242, 0x5D4037, 0x1A1A1A]
    const skirtColors = [0xE53935, 0x8E24AA, 0xFF6F00, 0x00ACC1]
    
    const shirtColor = shirtColors[Math.floor(rand * 7) % shirtColors.length]
    const bottomColor = isMale ? 
      pantsColors[Math.floor(rand * 10) % pantsColors.length] :
      skirtColors[Math.floor(rand * 13) % skirtColors.length]
    
    // Torso
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.7, 0.3),
      pm(shirtColor)
    )
    torso.position.y = 1.2
    group.add(torso)
    
    // Head - skin tones
    const skinTones = [0x8D5524, 0xC68642, 0xE0AC69, 0x4A312C]
    const skinColor = skinTones[Math.floor(rand * 17) % skinTones.length]
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      pm(skinColor)
    )
    head.position.y = 1.75
    group.add(head)
    
    // Hair for females
    if (!isMale) {
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 6),
        pm(0x1A1A1A)
      )
      hair.position.y = 1.85
      hair.scale.set(1, 0.7, 1)
      group.add(hair)
    }
    
    // Legs/Skirt - store for animation
    group.userData.legs = []
    if (isMale) {
      // Pants - two legs
      for (const legX of [-0.15, 0.15]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.7, 0.2),
          pm(bottomColor)
        )
        leg.position.set(legX, 0.55, 0)
        group.add(leg)
        group.userData.legs.push(leg)
      }
    } else {
      // Skirt
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.25, 0.6, 8),
        pm(bottomColor)
      )
      skirt.position.y = 0.65
      group.add(skirt)
    }
    
    // Arms - store for animation
    group.userData.arms = []
    for (const armX of [-0.35, 0.35]) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.5, 0.12),
        pm(skinColor)
      )
      arm.position.set(armX, 1.0, 0)
      group.add(arm)
      group.userData.arms.push(arm)
    }
    
    // Activity-specific items
    if (activity === 'hawking') {
      const tray = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.3, 0.15, 8),
        pm(0xD84315)
      )
      tray.position.y = 2.1
      group.add(tray)
      const fruitColors = [0xFF9800, 0xFFEB3B, 0xE53935]
      for (let i = 0; i < 4; i++) {
        const fruit = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 4),
          pm(fruitColors[i % fruitColors.length])
        )
        const angle = (i / 4) * Math.PI * 2
        fruit.position.set(Math.cos(angle) * 0.2, 2.2, Math.sin(angle) * 0.2)
        group.add(fruit)
      }
    } else if (activity === 'bag') {
      const bag = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.3, 0.15),
        pm(0x5D4037)
      )
      bag.position.set(0.4, 0.9, 0)
      group.add(bag)
    }
    
    // Animation phase - random start so not all in sync
    group.userData.walkPhase = rand * Math.PI * 2
    group.userData.isMale = isMale
    
    return group
  }

  // ── Camera follow ──────────────────────────────────────────────────────
  updateCamera(dt, playerX, playerY, speed) {
    this._bobPh += dt * speed * 0.3
    const bob = Math.sin(this._bobPh) * 0.025
    // Smooth camera X follow
    this._camX += (playerX * 0.3 - this._camX) * (1 - Math.exp(-dt * 10))
    // Camera rises with player jump (40% of jump height) for natural follow
    const camYTarget = this._camY + playerY * 0.4
    this.camera.position.set(
      this._camX,
      camYTarget + bob,
      this._camZ
    )
    // Look slightly ahead of player and track their height (25% tracking)
    this.camera.lookAt(playerX * 0.15, 1.1 + playerY * 0.25, this._lookZ)
    if (this._skyMesh) {
      this._skyMesh.position.x = this._camX
    }
  }

  // ── Treadmill ──────────────────────────────────────────────────────────
  update(dt, speed) {
    const move = speed * dt
    for (const s of this._roadSegs) {
      s.position.z += move
      if (s.position.z - SEG_LEN / 2 > DESPAWN) s.position.z -= TOTAL
    }
    for (const s of this._sideSegs) {
      s.position.z += move
      if (s.position.z > DESPAWN + SEG_LEN) s.position.z -= TOTAL
    }
    for (const p of this._props) {
      p.position.z += move
      if (p.position.z > DESPAWN + 12) p.position.z -= RANGE + 20
    }
    // Clouds drift slowly (only if sky was built)
    if (this._clouds) {
      for (const cl of this._clouds) {
        cl.position.z += move * 0.06
        if (cl.position.z > 20) cl.position.z -= 200
      }
    }
    // Move and animate pedestrians
    if (this._pedestrians) {
      for (const ped of this._pedestrians) {
        ped.position.z += move
        if (ped.position.z > DESPAWN + 12) ped.position.z -= RANGE + 20
        
        // Animate walking - arms and legs swing
        ped.userData.walkPhase += dt * 4  // Walking speed
        const swing = Math.sin(ped.userData.walkPhase) * 0.3
        
        // Animate arms swinging
        if (ped.userData.arms && ped.userData.arms.length === 2) {
          ped.userData.arms[0].rotation.x = swing
          ped.userData.arms[1].rotation.x = -swing
        }
        
        // Animate legs swinging (only for males with visible legs)
        if (ped.userData.legs && ped.userData.legs.length === 2 && ped.userData.isMale) {
          ped.userData.legs[0].rotation.x = -swing * 0.8
          ped.userData.legs[1].rotation.x = swing * 0.8
        }
        
        // Slight body bob while walking
        ped.position.y = Math.abs(Math.sin(ped.userData.walkPhase * 2)) * 0.05
      }
    }
  }

  resize() {
    const W = window.innerWidth
    const H = window.innerHeight
    const aspect = W / H

    // Recompute adaptive FOV for the new aspect ratio
    this.camera.fov    = SceneBuilder._calcFov(aspect)
    this.camera.aspect = aspect
    this.camera.updateProjectionMatrix()

    // Reposition camera for portrait vs landscape
    this._applyOrientationCamera(aspect)
    this.camera.position.set(this._camX, this._camY, this._camZ)
    this.camera.lookAt(0, 0.5, this._lookZ)

    this.renderer.setSize(W, H)
    // Raise pixel ratio slightly in landscape where there's more GPU headroom
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, aspect >= 1 ? 1.5 : 1.0))
  }

  render() { this.renderer.render(this.scene, this.camera) }

  dispose() {
    if (this.renderer.domElement.parentNode)
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    this.renderer.dispose()
  }
}
