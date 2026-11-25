// Player — runs away from camera down -Z. Camera follows from behind.
// Lane switching is smooth exponential interpolation with a leaning tilt.
// Jump arc uses gravity; slide crouches the torso; run cycle swings limbs.
import * as THREE from 'three'
import { CONFIG } from '../../config.js'
import { createPlayer } from '../../assets.js'

const LANES = CONFIG.lanes.x

export class Player {
  constructor(scene, charConfig = {}) {
    this.scene = scene
    this.group = createPlayer(charConfig)
    scene.add(this.group)
    this.parts = this.group.userData.parts

    // Shield bubble
    this.shield = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 18, 18),
      new THREE.MeshBasicMaterial({ color: '#39D0FF', transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    )
    this.shield.visible = false
    scene.add(this.shield)

    // Fake blob shadow on the ground
    this.blobShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.75, 20),
      new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3 })
    )
    this.blobShadow.rotation.x = -Math.PI / 2
    this.blobShadow.position.y = 0.03
    scene.add(this.blobShadow)

    this.reset()
  }

  reset(charConfig) {
    if (charConfig) {
      // swap the mesh for a new character skin
      this.scene.remove(this.group)
      this.group = createPlayer(charConfig)
      this.scene.add(this.group)
      this.parts = this.group.userData.parts
    }
    this.laneIndex = 1
    this.targetX   = LANES[1]
    this.y  = 0
    this.vy = 0
    this.jumping  = false
    this.sliding  = false
    this.slideTimer = 0
    this.invTimer = 0
    this.shielded = false
    this.lives    = CONFIG.lives.start
    this.phase    = 0
    this.group.position.set(LANES[1], 0, 0)
    this.group.rotation.set(0, 0, 0)
    this.group.scale.set(1, 1, 1)
    this.group.visible = true
    this.shield.visible = false
  }

  get x()         { return this.group.position.x }
  get invincible(){ return this.invTimer > 0 || this.shielded }

  moveLeft()  { if (this.laneIndex > 0 && !this.sliding)                   this.laneIndex-- }
  moveRight() { if (this.laneIndex < LANES.length - 1 && !this.sliding)    this.laneIndex++ }

  jump() {
    if (!this.jumping && !this.sliding) {
      this.jumping = true
      this.vy = CONFIG.player.jumpVelocity
      return true
    }
    return false
  }

  slide() {
    if (!this.jumping && !this.sliding) {
      this.sliding   = true
      this.slideTimer = CONFIG.player.slideDuration
    }
  }

  hit() {
    if (this.invincible) return false
    this.lives    = Math.max(0, this.lives - 1)
    this.invTimer = CONFIG.player.invincibilityDuration
    return true
  }

  setShield(on) { this.shielded = on; this.shield.visible = on }

  update(dt, speed) {
    // ── Lane interpolation ──
    this.targetX = LANES[this.laneIndex]
    const prevX  = this.group.position.x
    const f = 1 - Math.exp(-dt * CONFIG.player.laneSwitchSpeed)
    this.group.position.x += (this.targetX - prevX) * f

    // sideways lean
    const leanErr = this.targetX - this.group.position.x
    this.group.rotation.z = THREE.MathUtils.clamp(-leanErr * 0.22, -0.28, 0.28)

    // ── Jump physics ──
    if (this.jumping) {
      this.vy -= CONFIG.player.gravity * dt
      this.y  += this.vy * dt
      if (this.y <= 0) { this.y = 0; this.vy = 0; this.jumping = false }
    }
    this.group.position.y = this.y

    // ── Slide ──
    if (this.sliding) {
      this.slideTimer -= dt
      if (this.slideTimer <= 0) this.sliding = false
    }
    // forward lean + squash when sliding
    const targetPitch = this.sliding ? -0.65 : 0
    this.group.rotation.x += (targetPitch - this.group.rotation.x) * (1 - Math.exp(-dt * 14))
    // scale squat
    const targetScaleY = this.sliding ? 0.62 : 1
    this.group.scale.y += (targetScaleY - this.group.scale.y) * (1 - Math.exp(-dt * 14))

    // ── Invincibility flash ──
    if (this.invTimer > 0) {
      this.invTimer -= dt
      this.group.visible = Math.floor(this.invTimer * 14) % 2 === 0
    } else {
      this.group.visible = true
    }

    // ── Run cycle (limb swing visible from behind) ──
    this.phase += dt * speed * 0.55
    const swing = Math.sin(this.phase) * 0.95
    const { legL, legR, armL, armR } = this.parts
    if (this.y < 0.05 && !this.sliding) {
      legL.rotation.x  =  swing
      legR.rotation.x  = -swing
      armL.rotation.x  = -swing * 0.75
      armR.rotation.x  =  swing * 0.75
    } else if (this.jumping) {
      // tuck for jump
      legL.rotation.x += (1.0  - legL.rotation.x) * 0.18
      legR.rotation.x += (0.65 - legR.rotation.x) * 0.18
      armL.rotation.x += (-1.2 - armL.rotation.x) * 0.18
      armR.rotation.x += (-1.2 - armR.rotation.x) * 0.18
    }

    // ── Shield bubble tracks player ──
    if (this.shielded) {
      this.shield.position.set(this.group.position.x, 1.1, 0)
      this.shield.scale.setScalar(1 + Math.sin(performance.now() * 0.007) * 0.045)
    }

    // ── Blob shadow ──
    this.blobShadow.position.x = this.group.position.x
    const hf = THREE.MathUtils.clamp(1 - this.y / 3.5, 0.2, 1)
    this.blobShadow.scale.setScalar(hf)
    this.blobShadow.material.opacity = 0.3 * hf
  }

  // zPad: extra depth padding to prevent tunnelling at high speed
  collidesWith(obs, zPad = 0) {
    if (this.invincible) return false
    const dz = Math.abs(this.group.position.z - obs.z)
    if (dz > obs.depth / 2 + 0.42 + zPad) return false
    const dx = Math.abs(this.group.position.x - obs.x)
    if (dx > obs.width / 2 + 0.38) return false
    if (obs.type === 'low')  return this.y < obs.height - 0.12   // must jump
    if (obs.type === 'high') return !this.sliding                  // must slide
    return true
  }
}
