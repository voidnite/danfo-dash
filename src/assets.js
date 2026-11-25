// assets.js — Clean, fast, visually clear assets.
// ALL MeshLambertMaterial + MeshBasicMaterial only. Zero MeshStandardMaterial.
// Vehicles: proportioned to look like reference image 2 (chunky, colourful).
// Character: slim tall runner (reference image 4 girl style).
// Obstacles: taller + clearly labelled.
// Coins: bright yellow flat disc.
import * as THREE from 'three'

// ── Material helpers ──────────────────────────────────────────────────────────
const _lm = {}
const lam = (c) => { const k=`l${c}`; if(!_lm[k]) _lm[k]=new THREE.MeshLambertMaterial({color:c}); return _lm[k] }
const lamT = (c, op=0.82) => new THREE.MeshLambertMaterial({color:c,transparent:true,opacity:op,depthWrite:false})
const basic= (c, op=1) => op<1
  ? new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide})
  : new THREE.MeshBasicMaterial({color:c})

// ── Canvas texture cache ──────────────────────────────────────────────────────
const _ct = {}
function ctex(key, fn) {
  if (_ct[key]) return _ct[key]
  const c = document.createElement('canvas'); c.width = 256; c.height = 96
  const ctx = c.getContext('2d'); fn(ctx, 256, 96)
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.needsUpdate = true
  _ct[key] = t; return t
}

function signTex(text, bg = '#FFD600', fg = '#111') {
  return ctex(text+bg, (ctx, W, H) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = fg; ctx.lineWidth = 7; ctx.strokeRect(4, 4, W-8, H-8)
    ctx.fillStyle = fg; ctx.font = 'bold 56px Arial Black,sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W/2, H/2)
  })
}

function coinFaceTex() {
  return ctex('coin', (ctx, W, H) => {
    // Bright gold
    const r = H/2 - 3
    const g = ctx.createRadialGradient(W/2, H/2, r*0.08, W/2, H/2, r)
    g.addColorStop(0,   '#FFFF88')
    g.addColorStop(0.5, '#FFD600')
    g.addColorStop(1,   '#C8860A')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W/2, H/2, r, 0, Math.PI*2); ctx.fill()
    // Rim
    ctx.strokeStyle = '#9A6400'; ctx.lineWidth = 7
    ctx.beginPath(); ctx.arc(W/2, H/2, r-3, 0, Math.PI*2); ctx.stroke()
    // White 5-point star
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const rad = i%2===0 ? r*0.6 : r*0.24
      const ang = (i/10)*Math.PI*2 - Math.PI/2
      if (i===0) ctx.moveTo(W/2+rad*Math.cos(ang), H/2+rad*Math.sin(ang))
      else       ctx.lineTo(W/2+rad*Math.cos(ang), H/2+rad*Math.sin(ang))
    }
    ctx.closePath(); ctx.fill()
  })
}

function puLabelTex(text, bg) {
  return ctex('pu'+text, (ctx, W, H) => {
    ctx.fillStyle = bg
    ctx.beginPath(); ctx.roundRect(2, 2, W-4, H-4, 18); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.font = 'bold 46px Arial Black,sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, W/2, H/2)
  })
}

// ── Shared wheel ──────────────────────────────────────────────────────────────
function wheel(r = 0.42) {
  const g = new THREE.Group()
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 14).rotateZ(Math.PI/2), lam(0x1A1A1A)))
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r*.42, r*.42, 0.32, 10).rotateZ(Math.PI/2), lam(0xE0E0E0)))
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  CHARACTER — slim tall runner (like reference image 4).
//  Uses cylinders for limbs = smooth, not blocky.
//  Total height ~3.4 units. Bright red/white striped shirt, yellow hair.
// ════════════════════════════════════════════════════════════════════════════
export function createPlayer(cfg = {}) {
  const {
    shirtColor  = 0xE53935,
    pantsColor  = 0x1565C0,
    skinColor   = 0xC68642,
    hairColor   = 0xFFB300,
    shoeColor   = 0x212121,
  } = cfg

  const g = new THREE.Group(); const parts = {}

  // Shoes
  for (const [k, sx] of [['shoeL',-1],['shoeR',1]]) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.44), lam(shoeColor))
    sh.position.set(sx*0.14, 0.07, 0.08)
    g.add(sh); parts[k] = sh
  }

  // Legs — slim cylinders, pivot at hip
  for (const [k, sx] of [['legL',-1],['legR',1]]) {
    const piv = new THREE.Group(); piv.position.set(sx*0.14, 0.72, 0)
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.52, 8), lam(pantsColor))
    thigh.position.y = -0.26; piv.add(thigh)
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.46, 8), lam(pantsColor))
    shin.position.y = -0.69; piv.add(shin)
    g.add(piv); parts[k] = piv
  }

  // Hips
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.26, 10), lam(pantsColor))
  hips.position.y = 0.74; g.add(hips)

  // Torso — slim tapered cylinder
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.9, 10), lam(shirtColor))
  torso.position.y = 1.32; g.add(torso); parts.torso = torso

  // White stripe around torso
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.1, 10), lam(0xFFFFFF))
  stripe.position.y = 1.08; g.add(stripe)
  const stripe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 10), lam(0xFFFFFF))
  stripe2.position.y = 1.22; g.add(stripe2)

  // Arms — slim cylinders, pivot at shoulder
  for (const [k, sx] of [['armL',-1],['armR',1]]) {
    const piv = new THREE.Group(); piv.position.set(sx*0.34, 1.76, 0)
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.42, 7), lam(shirtColor))
    up.position.y = -0.21; piv.add(up)
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.36, 7), lam(skinColor))
    lo.position.y = -0.57; piv.add(lo)
    g.add(piv); parts[k] = piv
  }

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8), lam(skinColor))
  neck.position.y = 1.9; g.add(neck)

  // HEAD — smooth sphere (SphereGeometry = not blocky)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), lam(skinColor))
  head.position.y = 2.3; head.scale.set(1, 1.08, 1)
  g.add(head); parts.head = head

  // Hair cap (sphere slightly larger)
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.31, 10, 8), lam(hairColor))
  hairCap.position.y = 2.5; hairCap.scale.set(1, 0.55, 1); g.add(hairCap)
  // Ponytail stub — visible from behind camera
  const pony = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.44, 7), lam(hairColor))
  pony.rotation.x = 0.65; pony.position.set(0, 2.38, 0.3); g.add(pony)
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 6), lam(hairColor))
  tip.position.set(0, 2.18, 0.5); g.add(tip)

  g.userData.parts = parts
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  DANFO BUS — Big yellow school bus with black stripes
//  Large, boxy, iconic. W=3.0, L=6.5, H=3.0 — HUGE and very visible
// ════════════════════════════════════════════════════════════════════════════
export function createDanfo() {
  const g = new THREE.Group()
  
  const W = 3.0, H = 3.0, L = 6.5
  const yellow = 0xFFD600
  const black = 0x1A1A1A
  
  // Main body - large boxy school bus shape
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.5, L),
    lam(yellow)
  )
  lowerBody.position.y = H * 0.35
  g.add(lowerBody)
  
  // Upper body (window section)
  const upperBody = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.95, H * 0.4, L * 0.98),
    lam(yellow)
  )
  upperBody.position.y = H * 0.75
  g.add(upperBody)
  
  // BLACK HORIZONTAL STRIPES (school bus style - 2 thick stripes)
  const stripe1 = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.02, 0.35, L + 0.02),
    lam(black)
  )
  stripe1.position.y = H * 0.45
  g.add(stripe1)
  
  const stripe2 = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.02, 0.3, L + 0.02),
    lam(black)
  )
  stripe2.position.y = H * 0.65
  g.add(stripe2)
  
  // Flat roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.95, 0.15, L * 0.98),
    lam(0xE8E0C8)
  )
  roof.position.y = H * 0.96
  g.add(roof)
  
  // Emergency exit on roof (school bus feature)
  const emergencyHatch = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 1.5),
    lam(0xC0C0C0)
  )
  emergencyHatch.position.y = H * 1.0
  g.add(emergencyHatch)
  
  // Front flat face (school bus style - very flat, vertical)
  const frontFace = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.9, 0.3),
    lam(yellow)
  )
  frontFace.position.set(0, H * 0.52, -L / 2 + 0.15)
  g.add(frontFace)
  
  // Large front windshield (nearly vertical, school bus style)
  const frontWindshield = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.85, H * 0.4),
    lamT(0xB3E5FC, 0.88)
  )
  frontWindshield.position.set(0, H * 0.78, -L / 2 + 0.16)
  g.add(frontWindshield)
  
  // Split windshield divider (vertical bar in middle)
  const windshieldDivider = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, H * 0.42, 0.04),
    lam(black)
  )
  windshieldDivider.position.set(0, H * 0.78, -L / 2 + 0.17)
  g.add(windshieldDivider)
  
  // Rear door/window
  const rearWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.8, H * 0.35),
    lamT(0xB3E5FC, 0.88)
  )
  rearWindow.position.set(0, H * 0.78, L / 2 - 0.02)
  rearWindow.rotation.y = Math.PI
  g.add(rearWindow)
  
  // Side windows - many windows (school bus has lots of windows!)
  const windowH = H * 0.32
  const windowW = L * 0.12
  const windowY = H * 0.78
  const numWindows = 6
  
  for (const side of [-1, 1]) {
    for (let i = 0; i < numWindows; i++) {
      const z = -L * 0.4 + i * (L * 0.75) / (numWindows - 1)
      const sideWindow = new THREE.Mesh(
        new THREE.PlaneGeometry(windowW, windowH),
        lamT(0xB3E5FC, 0.88)
      )
      sideWindow.position.set(side * (W / 2 + 0.01), windowY, z)
      sideWindow.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
      g.add(sideWindow)
      
      // Black window frames
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(windowW + 0.08, windowH + 0.08),
        lam(black)
      )
      frame.position.set(side * (W / 2 + 0.005), windowY, z)
      frame.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2
      g.add(frame)
    }
  }
  
  // Front door (right side, near front)
  const doorOutline = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, H * 0.5),
    lam(black)
  )
  doorOutline.position.set(W / 2 + 0.01, H * 0.4, -L * 0.35)
  doorOutline.rotation.y = Math.PI / 2
  g.add(doorOutline)
  
  // Front grille (black, lower front)
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.7, 0.4, 0.1),
    lam(black)
  )
  grille.position.set(0, H * 0.25, -L / 2 + 0.1)
  g.add(grille)
  
  // Headlights (large, round, school bus style)
  for (const x of [-W * 0.35, W * 0.35]) {
    const headlight = new THREE.Mesh(
      new THREE.CircleGeometry(0.22, 12),
      basic(0xFFF9C4)
    )
    headlight.position.set(x, H * 0.4, -L / 2 + 0.05)
    g.add(headlight)
    
    // Chrome ring around headlight
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.26, 12),
      lam(0xC0C0C0)
    )
    ring.position.set(x, H * 0.4, -L / 2 + 0.04)
    g.add(ring)
  }
  
  // Taillights (red, square, at back)
  for (const x of [-W * 0.38, W * 0.38]) {
    const taillight = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.3, 0.08),
      lam(0xFF1111)
    )
    taillight.position.set(x, H * 0.38, L / 2 - 0.04)
    g.add(taillight)
  }
  
  // "DANFO" text on front top (school bus style label)
  const frontLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.5),
    new THREE.MeshBasicMaterial({ 
      map: signTex('DANFO', '#1A1A1A', '#FFD600'),
      transparent: true 
    })
  )
  frontLabel.position.set(0, H * 0.95, -L / 2 + 0.16)
  g.add(frontLabel)
  
  // "DANFO" text on rear (big, visible)
  const rearLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.65),
    new THREE.MeshBasicMaterial({ 
      map: signTex('DANFO', '#FFD600', '#1A1A1A'),
      transparent: true 
    })
  )
  rearLabel.position.set(0, H * 0.92, L / 2 - 0.01)
  rearLabel.rotation.y = Math.PI
  g.add(rearLabel)
  
  // Side mirrors (large, school bus style)
  for (const side of [-1, 1]) {
    const mirrorArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.4),
      lam(black)
    )
    mirrorArm.position.set(side * (W / 2 + 0.1), H * 0.85, -L * 0.42)
    g.add(mirrorArm)
    
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.25, 0.08),
      lam(black)
    )
    mirror.position.set(side * (W / 2 + 0.3), H * 0.85, -L * 0.42)
    g.add(mirror)
  }
  
  // Front bumper (chrome)
  const frontBumper = new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.25, 0.2),
    lam(0xC0C0C0)
  )
  frontBumper.position.set(0, 0.22, -L / 2 + 0.1)
  g.add(frontBumper)
  
  // Rear bumper (chrome)
  const rearBumper = new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.25, 0.2),
    lam(0xC0C0C0)
  )
  rearBumper.position.set(0, 0.22, L / 2 - 0.1)
  g.add(rearBumper)
  
  // WHEELS - 6 wheels (school buses have dual rear wheels)
  const wheelR = 0.6
  const wheelY = wheelR * 0.85
  
  // Front wheels (2)
  const frontWheelLeft = wheel(wheelR)
  frontWheelLeft.position.set(-W * 0.42, wheelY, -L * 0.38)
  g.add(frontWheelLeft)
  
  const frontWheelRight = wheel(wheelR)
  frontWheelRight.position.set(W * 0.42, wheelY, -L * 0.38)
  g.add(frontWheelRight)
  
  // Rear wheels - dual wheels (4 wheels, 2 per side)
  for (const side of [-1, 1]) {
    for (const offset of [-0.15, 0.15]) {
      const rearWheel = wheel(wheelR * 0.95)
      rearWheel.position.set(side * W * 0.42 + offset, wheelY, L * 0.3)
      g.add(rearWheel)
    }
  }
  
  // Wheel wells/fenders
  for (const side of [-1, 1]) {
    // Front fender
    const frontFender = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.4, 1.4),
      lam(yellow)
    )
    frontFender.position.set(side * W * 0.44, 0.7, -L * 0.38)
    g.add(frontFender)
    
    // Rear fender (longer for dual wheels)
    const rearFender = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.4, 1.8),
      lam(yellow)
    )
    rearFender.position.set(side * W * 0.44, 0.7, L * 0.3)
    g.add(rearFender)
  }
  
  g.userData = { width: W, depth: L, height: H }
  return g
}



// ════════════════════════════════════════════════════════════════════════════
//  CARS — chunky cartoon, clearly coloured, like reference image 2
// ════════════════════════════════════════════════════════════════════════════
export function createCar(color = 0x1E88E5) {
  const g = new THREE.Group()

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 3.8), lam(color))
  body.position.y = 0.56; g.add(body)

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.64, 2.1), lam(color))
  cabin.position.set(0, 1.08, -0.1); g.add(cabin)

  // windscreens
  const fwS = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.52, 0.07), lamT(0xB3E5FC, 0.84))
  fwS.position.set(0, 1.06, -1.08); g.add(fwS)
  const rwS = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.52, 0.07), lamT(0xB3E5FC, 0.84))
  rwS.position.set(0, 1.06, 1.08); g.add(rwS)

  // lights
  for (const sx of [-0.64, 0.64]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), lam(0xFFFDE7))
    hl.position.set(sx, 0.56, -1.94); g.add(hl)
    const rl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.08), lam(0xFF1111))
    rl.position.set(sx, 0.56, 1.94); g.add(rl)
  }

  // wheels
  for (const [x, y, z] of [[-0.9,0.36,1.2],[0.9,0.36,1.2],[-0.9,0.36,-1.2],[0.9,0.36,-1.2]]) {
    const w = wheel(0.36); w.position.set(x, y, z); g.add(w)
  }

  g.userData = { width: 1.9, depth: 3.8, height: 1.44 }
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  KEKE NAPEP — BIG Tricycle with Yellow & Black Stripes + Passengers
//  Three-wheeled auto rickshaw with distinctive striped body
//  W=2.6, L=3.8, H=2.5 — big and prominent
// ════════════════════════════════════════════════════════════════════════════
export function createKeke() {
  const g = new THREE.Group()
  
  const W = 2.6, H = 2.5, L = 3.8
  const yellow = 0xFFD600  // Bright yellow
  const black = 0x1A1A1A   // Black
  
  // ========== FRONT MOTORCYCLE SECTION (Yellow with black stripes) ==========
  
  // Front fork/handlebar section
  const frontFork = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.9, 0.15),
    lam(black)
  )
  frontFork.position.set(0, 1.2, -L / 2 + 0.4)
  g.add(frontFork)
  
  // Handlebars
  const handlebar = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.12, 0.12),
    lam(black)
  )
  handlebar.position.set(0, 1.4, -L / 2 + 0.5)
  g.add(handlebar)
  
  // Front fender (yellow with black stripe)
  const frontFender = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.25, 0.8),
    lam(yellow)
  )
  frontFender.position.set(0, 0.85, -L / 2 + 0.5)
  g.add(frontFender)
  
  // Black stripe on front fender
  const fenderStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.1, 0.82),
    lam(black)
  )
  fenderStripe.position.set(0, 0.85, -L / 2 + 0.5)
  g.add(fenderStripe)
  
  // Headlight
  const headlight = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 12),
    basic(0xFFF9C4)
  )
  headlight.position.set(0, 1.0, -L / 2 + 0.05)
  g.add(headlight)
  
  // ========== PASSENGER CABIN (Yellow with black stripes) ==========
  
  // Main cabin floor
  const cabinFloor = new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.2, L * 0.6),
    lam(yellow)
  )
  cabinFloor.position.set(0, 0.7, L * 0.08)
  g.add(cabinFloor)
  
  // Lower body panels with black stripe
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(W, 0.6, L * 0.58),
    lam(yellow)
  )
  lowerBody.position.set(0, 1.0, L * 0.08)
  g.add(lowerBody)
  
  // BLACK STRIPE #1 (bottom horizontal stripe on lower body)
  const stripe1 = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.02, 0.18, L * 0.6),
    lam(black)
  )
  stripe1.position.set(0, 0.85, L * 0.08)
  g.add(stripe1)
  
  // Upper cabin body (yellow)
  const upperCabin = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.95, H * 0.65, L * 0.55),
    lam(yellow)
  )
  upperCabin.position.set(0, H * 0.75, L * 0.08)
  g.add(upperCabin)
  
  // BLACK STRIPE #2 (middle horizontal stripe on upper cabin)
  const stripe2 = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.97, 0.2, L * 0.57),
    lam(black)
  )
  stripe2.position.set(0, H * 0.6, L * 0.08)
  g.add(stripe2)
  
  // BLACK STRIPE #3 (top horizontal stripe)
  const stripe3 = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.97, 0.18, L * 0.57),
    lam(black)
  )
  stripe3.position.set(0, H * 0.95, L * 0.08)
  g.add(stripe3)
  
  // Curved roof canopy (yellow with black edge)
  const roofRadius = W * 0.52
  const roofCanopy = new THREE.Mesh(
    new THREE.CylinderGeometry(roofRadius, roofRadius, L * 0.6, 16, 1, true, 0, Math.PI),
    lam(yellow)
  )
  roofCanopy.rotation.z = Math.PI / 2
  roofCanopy.position.set(0, H * 1.05, L * 0.08)
  g.add(roofCanopy)
  
  // Black roof edges
  for (const side of [-1, 1]) {
    const roofEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, L * 0.62),
      lam(black)
    )
    roofEdge.position.set(side * (W / 2 - 0.05), H * 1.05, L * 0.08)
    g.add(roofEdge)
  }
  
  // Front windshield
  const windshield = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.85, H * 0.4),
    lamT(0xB3E5FC, 0.85)
  )
  windshield.position.set(0, H * 0.8, -L * 0.18)
  windshield.rotation.x = -0.15
  g.add(windshield)
  
  // Open sides - vertical black bars (keke style)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const barZ = -L * 0.05 + i * L * 0.22
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, H * 0.5, 8),
        lam(black)
      )
      bar.position.set(side * (W / 2 - 0.05), H * 0.7, barZ)
      g.add(bar)
    }
  }
  
  // Rear panel (yellow with black stripe)
  const rearPanel = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.9, H * 0.6, 0.15),
    lam(yellow)
  )
  rearPanel.position.set(0, H * 0.75, L / 2 - 0.1)
  g.add(rearPanel)
  
  // Black stripe on rear panel
  const rearStripe = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.92, 0.18, 0.16),
    lam(black)
  )
  rearStripe.position.set(0, H * 0.75, L / 2 - 0.1)
  g.add(rearStripe)
  
  // Rear window
  const rearWindow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 0.7, H * 0.35),
    lamT(0xB3E5FC, 0.8)
  )
  rearWindow.position.set(0, H * 0.75, L / 2 - 0.09)
  rearWindow.rotation.y = Math.PI
  g.add(rearWindow)
  
  // ========== PASSENGERS ==========
  
  // Driver (front)
  const driver = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.65, 0.45),
    lam(0x1565C0)  // Blue shirt
  )
  driver.position.set(0, 1.4, -L * 0.15)
  g.add(driver)
  
  const driverHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 6),
    lam(0x5D4037)  // Brown skin
  )
  driverHead.position.set(0, 1.85, -L * 0.15)
  g.add(driverHead)
  
  // Passengers - 3 passengers in back bench
  const passengerColors = [0xE53935, 0x43A047, 0xFB8C00]  // Red, Green, Orange
  const passengerPositions = [
    [-W * 0.32, L * 0.15],   // Left
    [0, L * 0.15],           // Center
    [W * 0.32, L * 0.15]     // Right
  ]
  
  passengerPositions.forEach(([x, z], idx) => {
    const passenger = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.6, 0.4),
      lam(passengerColors[idx])
    )
    passenger.position.set(x, 1.35, z)
    g.add(passenger)
    
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      lam(idx % 2 === 0 ? 0x5D4037 : 0x3E2723)
    )
    head.position.set(x, 1.75, z)
    g.add(head)
  })
  
  // ========== DETAILS ==========
  
  // Taillights
  for (const x of [-W * 0.3, W * 0.3]) {
    const taillight = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 10),
      lam(0xFF1111)
    )
    taillight.position.set(x, H * 0.5, L / 2 - 0.08)
    taillight.rotation.y = Math.PI
    g.add(taillight)
  }
  
  // "KEKE" sign on back
  const kekeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.38),
    new THREE.MeshBasicMaterial({ 
      map: signTex('KEKE', '#FFD600', '#000'),
      transparent: true 
    })
  )
  kekeSign.position.set(0, H * 1.15, L / 2 - 0.09)
  kekeSign.rotation.y = Math.PI
  g.add(kekeSign)
  
  // Side mirrors
  for (const side of [-1, 1]) {
    const mirrorArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
      lam(black)
    )
    mirrorArm.rotation.z = side * Math.PI / 5
    mirrorArm.position.set(side * 0.5, 1.5, -L / 2 + 0.6)
    g.add(mirrorArm)
    
    const mirror = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 10),
      lam(0x444444)
    )
    mirror.position.set(side * 0.65, 1.55, -L / 2 + 0.6)
    mirror.rotation.y = side > 0 ? -Math.PI / 3 : Math.PI / 3
    g.add(mirror)
  }
  
  // ========== THREE WHEELS (Tricycle!) ==========
  
  const wheelR = 0.45
  
  // SINGLE FRONT WHEEL (centered)
  const frontWheel = wheel(wheelR)
  frontWheel.position.set(0, wheelR * 0.85, -L / 2 + 0.4)
  g.add(frontWheel)
  
  // TWO REAR WHEELS (wide apart for stability)
  const rearWheelLeft = wheel(wheelR * 1.05)  // Slightly bigger rear wheels
  rearWheelLeft.position.set(-W * 0.48, wheelR * 0.9, L * 0.28)
  g.add(rearWheelLeft)
  
  const rearWheelRight = wheel(wheelR * 1.05)
  rearWheelRight.position.set(W * 0.48, wheelR * 0.9, L * 0.28)
  g.add(rearWheelRight)
  
  // Rear mudguards (yellow with black stripe)
  for (const side of [-1, 1]) {
    const mudguard = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR + 0.15, wheelR + 0.15, 0.16, 12, 1, true, 0, Math.PI),
      lam(yellow)
    )
    mudguard.rotation.z = Math.PI / 2
    mudguard.rotation.y = Math.PI / 2
    mudguard.position.set(side * W * 0.48, wheelR * 1.45, L * 0.28)
    g.add(mudguard)
    
    // Black stripe on mudguard
    const mudguardStripe = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR + 0.16, wheelR + 0.16, 0.08, 12, 1, true, 0, Math.PI),
      lam(black)
    )
    mudguardStripe.rotation.z = Math.PI / 2
    mudguardStripe.rotation.y = Math.PI / 2
    mudguardStripe.position.set(side * W * 0.48, wheelR * 1.45, L * 0.28)
    g.add(mudguardStripe)
  }
  
  // Exhaust pipe
  const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.65, 8),
    lam(0x424242)
  )
  exhaust.rotation.x = Math.PI / 2
  exhaust.position.set(W * 0.42, 0.65, L * 0.15)
  g.add(exhaust)
  
  g.userData = { width: W, depth: L, height: H }
  return g
}

// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
//  BARRIER — taller (1.4 units) so player must clearly jump
// ════════════════════════════════════════════════════════════════════════════
export function createBarrier() {
  const g = new THREE.Group()
  // Tall concrete base
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.4, 0.72), lam(0xE53935))
  base.position.y = 0.7; g.add(base)
  // Red/white diagonal stripes
  for (let i = -2; i <= 2; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.42, 0.74), lam(0xFFFFFF))
    s.position.set(i * 0.44, 0.7, 0); s.rotation.z = 0.52; g.add(s)
  }
  // End caps
  for (const sx of [-1.1, 1.1]) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.44, 0.74), lam(0x111111))
    cap.position.set(sx, 0.7, 0); g.add(cap)
  }
  // Large STOP label
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5),
    new THREE.MeshBasicMaterial({ map: signTex('STOP', '#E53935', '#fff'), transparent: true }))
  lbl.position.set(0, 0.7, 0.37); g.add(lbl)
  g.userData = { width: 2.5, depth: 0.72, height: 1.4 }
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  OVERHEAD SIGN — tall posts, clearly "duck under" (height 2.8 bar)
// ════════════════════════════════════════════════════════════════════════════
export function createOverhead() {
  const g = new THREE.Group()
  const pm = lam(0x37474F)
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 5.2, 7), pm)
    post.position.set(sx * 5.0, 2.6, 0); g.add(post)
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.44, 0.52), lam(0xE53935))
  bar.position.set(0, 2.4, 0); g.add(bar)
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.0, 0.18), lam(0xE53935))  // Changed from yellow to red
  sign.position.set(0, 1.6, 0); g.add(sign)
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.84),
    new THREE.MeshBasicMaterial({ map: signTex('DUCK!', '#E53935', '#FFF'), transparent: true }))  // Red background, white text
  lbl.position.set(0, 1.6, 0.1); g.add(lbl)
  g.userData = { width: 10.4, depth: 0.52, height: 2.8, isOverhead: true }
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  COIN — bright flat gold disc with star face (Subway Surfers style)
// ════════════════════════════════════════════════════════════════════════════
export function createCoin() {
  const g = new THREE.Group()
  // Disc — rotated so face looks at camera
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.1, 18).rotateX(Math.PI / 2),
    new THREE.MeshLambertMaterial({ map: coinFaceTex(), emissive: 0xFF8800, emissiveIntensity: 0.3 })
  )
  g.add(disc)
  // Edge torus
  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.055, 7, 22),
    lam(0xC8860A)
  )
  edge.rotation.x = Math.PI / 2; g.add(edge)
  // Soft glow
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({ color: 0xFFDD00, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide })
  )
  g.add(glow)
  return g
}

// ════════════════════════════════════════════════════════════════════════════
//  POWER-UPS — CLEARLY labelled, obviously different from obstacles
// ════════════════════════════════════════════════════════════════════════════
const PU_CFG = {
  shield: { col: 0x29B6F6, lblBg: '#0288D1', label: '🛡 SHIELD' },
  magnet: { col: 0xEF5350, lblBg: '#C62828', label: '🧲 MAGNET' },
  boost:  { col: 0xFFCA28, lblBg: '#E65100', label: '⚡ BOOST'  },
}
const PU_GEO = {
  shield: () => new THREE.IcosahedronGeometry(0.56, 1),
  magnet: () => new THREE.TorusGeometry(0.42, 0.14, 10, 22),
  boost:  () => new THREE.ConeGeometry(0.44, 0.9, 14),
}

export function createPowerUp(type) {
  const cfg = PU_CFG[type] || PU_CFG.boost
  const g = new THREE.Group()
  g.add(new THREE.Mesh(
    PU_GEO[type] ? PU_GEO[type]() : PU_GEO.boost(),
    new THREE.MeshLambertMaterial({ color: cfg.col, emissive: cfg.col, emissiveIntensity: 0.55, transparent: true, opacity: 0.95 })
  ))
  // Glow sphere
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 10, 8),
    new THREE.MeshBasicMaterial({ color: cfg.col, transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false })
  ))
  // Pulsing ring
  g.add(new THREE.Mesh(
    new THREE.TorusGeometry(0.76, 0.055, 7, 24),
    new THREE.MeshBasicMaterial({ color: cfg.col, transparent: true, opacity: 0.5 })
  ))
  // Large label ABOVE
  const lbl = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.72),
    new THREE.MeshBasicMaterial({ map: puLabelTex(cfg.label, cfg.lblBg), transparent: true, depthWrite: false, side: THREE.DoubleSide })
  )
  lbl.position.y = 1.56; g.add(lbl)
  g.userData = { type }
  return g
}

export const CAR_COLORS = [0x1E88E5, 0xE53935, 0x8E24AA, 0x00897B, 0xF4511E, 0x546E7A]
