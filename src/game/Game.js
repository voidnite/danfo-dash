// Game.js — orchestrator + smooth RAF loop.
// States: loading → landing → menu → playing → paused → over
import { CONFIG }          from '../config.js'
import { SceneBuilder }    from './world/SceneBuilder.js'
import { Player }          from './entities/Player.js'
import { Traffic }         from './entities/Traffic.js'
import { Coins }           from './entities/Coins.js'
import { PowerUps }        from './entities/PowerUps.js'
import { Controls }        from './systems/Controls.js'
import { Storage }         from './systems/Storage.js'
import { Audio, transitionToMenuMusic, transitionToGameplayAudio, transitionToGameOverAudio } from './systems/Audio.js'
import { UI, CHARACTERS }  from './ui/UI.js'

const IDLE_SPEED = 7

export class Game {
  constructor(root) {
    this.root       = root
    this.canvasHost = root.querySelector('#canvas-host')
    this.uiRoot     = root.querySelector('#ui')
    this.state      = 'loading'
    this._lastRAF   = 0

    this.playerName    = 'Player'
    this.selectedChar  = CHARACTERS[0]
    this.unlockedChars = new Set(['tunde'])

    // run-state
    this.distance    = 0
    this.coinCount   = 0
    this.scoreFloat  = 0
    this.timePlayed  = 0
    this.baseSpeed   = CONFIG.world.baseSpeed
    this.activePower  = null
    this.magnetActive = false
    this.boostActive  = false
    
    // BRT tunnel spawning
    this._tunnelTimer = 0
    this._nextTunnel  = 15 + Math.random() * 5  // First tunnel in 15-20s
  }

  async init() {
    this.storage = new Storage()

    // ── Stage 1: Storage ready (5%) ──────────────────────────────────────
    this.ui = new UI(this.uiRoot, {
      onLandingPlay:  () => this._goMenu(),
      onGuestLogin:   (name) => { this.playerName = name; this.storage.setPlayerName(name); this._goMenu() },
      onSocialLogin:  ()     => { this._goMenu() },
      onMenuPlay:     () => this.startGame(),
      onRestart:      () => this.startGame(),
      onMenu:         () => this._goMenu(),
      onResume:       () => this.togglePause(),
      onPause:        () => this.togglePause(),
      onToggleSound:  () => this._toggleSound(),
      onSelectChar:   (ch) => this._selectChar(ch),
      onUnlockChar:   (ch) => this._tryUnlock(ch),
      isCharUnlocked: (id) => this.unlockedChars.has(id),
    })
    this.ui.showLoading()
    this.ui.setLoadProgress(5, 'LOADING...')
    await this.ui.waitForProgress()

    // ── Stage 2: Audio system (5% → 40%) ─────────────────────────────────
    this.audio = new Audio()
    this.ui.setLoadProgress(12, 'LOADING AUDIO...')
    await this.ui.waitForProgress()
    // 15-second overall cap — audio is non-essential; never block the game
    await Promise.race([
      this.audio.init(),
      new Promise(r => setTimeout(r, 15000))
    ])
    this.audio.setMuted(!this.storage.soundOn)
    this.ui.setLoadProgress(40, 'AUDIO READY')
    await this.ui.waitForProgress()

    // ── Stage 3: Restore saved data (40% → 48%) ───────────────────────────
    const saved = this.storage.data.unlockedChars
    if (Array.isArray(saved)) saved.forEach(id => this.unlockedChars.add(id))
    this.playerName = this.storage.playerName || 'Player'
    this.ui.setLoadProgress(48, 'LOADING...')
    await this.ui.waitForProgress()

    // ── Stage 4: Build 3D scene (48% → 72%) ──────────────────────────────
    this.ui.setLoadProgress(52, 'BUILDING SCENE...')
    await this.ui.waitForProgress()
    this.scene = new SceneBuilder(this.canvasHost)
    this.ui.setLoadProgress(72, 'SCENE READY')
    await this.ui.waitForProgress()

    // ── Stage 5: Spawn entities (72% → 88%) ───────────────────────────────
    this.ui.setLoadProgress(76, 'SPAWNING TRAFFIC...')
    await this.ui.waitForProgress()
    this.player    = new Player(this.scene.scene, this.selectedChar)
    this.traffic   = new Traffic(this.scene.scene)
    this.coinSys   = new Coins(this.scene.scene)
    this.powerupSys = new PowerUps(this.scene.scene)
    this.ui.setLoadProgress(88, 'ALMOST THERE...')
    await this.ui.waitForProgress()

    // ── Stage 6: Controls + resize (88% → 95%) ────────────────────────────
    this.ui.setMuteLabel(this.storage.soundOn)
    this.controls = new Controls(this.canvasHost)
    this.controls.bind({
      left:  () => this.player.moveLeft(),
      right: () => this.player.moveRight(),
      jump:  () => { if (this.player.jump()) this.audio.play('jump') },
      slide: () => { this.player.slide();     this.audio.play('slide') },
      pause: () => this.togglePause(),
    })
    this.controls.setEnabled(false)
    window.addEventListener('resize', () => this._onResize())
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this._onResize())
    }
    this.scene.resize()
    this.ui.setLoadProgress(95, 'ALMOST THERE...')
    await this.ui.waitForProgress()

    // ── Stage 7: Final render check — hold at 95% briefly, then 100% ──────
    // Wait for one full frame to confirm the renderer is producing output
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    this.ui.setLoadProgress(100, 'READY!')
    await this.ui.waitForProgress()

    // Hold 100% for 900ms so the player can see it, then enter landing
    await new Promise(r => setTimeout(r, 900))

    this.ui.showLanding()
    this.state = 'landing'
    document.addEventListener('click',      () => this.audio.resume(), { once: true })
    document.addEventListener('touchstart', () => this.audio.resume(), { once: true })

    this._startLoop()
  }

  // ── Debounced resize — prevents framebuffer realloc on every iOS scroll tick ──
  _onResize() {
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(() => { this.scene.resize() }, 150)
  }

  // ── State transitions ──────────────────────────────────────────────────
  _goMenu() {
    this._runReset()
    this.state = 'menu'
    this.controls.setEnabled(false)
    this.ui.showMenu(this.playerName, this.storage.totalCoins, this.storage.highScore)
    
    // Transition to menu music
    transitionToMenuMusic(this.audio)
    
    // Load leaderboard in background
    this.storage.fetchLeaderboard(this.playerName).then(entries => {
      this.ui.renderLeaderboard(entries, '')
    }).catch(() => {
      this.ui.renderLeaderboard(this.storage.getLeaderboard(this.playerName), '(offline)')
    })
  }

  startGame() {
    this._runReset()
    this.state = 'playing'
    this._frozenFrameRendered = false   // ensure render resumes from over/paused
    this.controls.setEnabled(true)
    this.ui.startGame()
    this.ui.hideOverlays()
    this.audio.resume()
    transitionToGameplayAudio(this.audio)
    this.audio.play('start')
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused'
      this.controls.setEnabled(false)
      this.ui.showPause()
    } else if (this.state === 'paused') {
      this.state = 'playing'
      this._frozenFrameRendered = false   // allow full render to resume
      this.controls.setEnabled(true)
      this.ui.hidePause()
    }
  }

  _gameOver() {
    this.state = 'over'
    this.controls.setEnabled(false)
    const score = Math.floor(this.scoreFloat)
    const { newBest } = this.storage.recordRun(score, this.coinCount, Math.floor(this.distance))
    
    // Stop gameplay audio and play game over sound
    transitionToGameOverAudio(this.audio, false)
    this.audio.play('gameover')
    
    this.ui.showGameOver({ score, coins: this.coinCount, distance: this.distance, best: this.storage.highScore, newBest })
    // Refresh leaderboard after recording
    this.storage.fetchLeaderboard(this.playerName).then(entries => {
      this.ui.renderLeaderboard(entries, '')
    }).catch(() => {})
  }

  // ── Character & sound ─────────────────────────────────────────────────
  _selectChar(ch) {
    this.selectedChar = ch
    this.player.reset(ch)
  }

  _tryUnlock(ch) {
    if (this.unlockedChars.has(ch.id) || this.storage.totalCoins < ch.cost) return
    this.storage.spendCoins(ch.cost)
    this.unlockedChars.add(ch.id)
    this.storage.saveUnlocked([...this.unlockedChars])
    this.ui.updateCharSelectCoins(this.storage.totalCoins)
  }

  _toggleSound() {
    const on = !this.storage.soundOn
    this.storage.setSoundOn(on)
    this.audio.setMuted(!on)
    this.ui.setMuteLabel(on)
    if (on) this.audio.play('click')
  }

  // ── Run reset ──────────────────────────────────────────────────────────
  _runReset() {
    this.distance    = 0
    this.coinCount   = 0
    this.scoreFloat  = 0
    this.timePlayed  = 0
    this.baseSpeed   = CONFIG.world.baseSpeed
    this.activePower  = null
    this.magnetActive = false
    this.boostActive  = false
    this._tunnelTimer = 0
    this._nextTunnel  = 15 + Math.random() * 5
    this.player.reset(this.selectedChar)
    this.player.setShield(false)
    this.traffic.reset()
    this.coinSys.reset()
    this.powerupSys.reset()
  }

  // ── Power-ups ──────────────────────────────────────────────────────────
  _activatePower(type) {
    this.audio.play('powerup')
    const conf = CONFIG.powerUps[type]
    this.activePower = { type, timeLeft: conf.duration, duration: conf.duration }
    if (type === 'shield') this.player.setShield(true)
    if (type === 'magnet') this.magnetActive = true
    if (type === 'boost')  this.boostActive  = true
  }

  _tickPower(dt) {
    if (!this.activePower) { this.ui.updatePowerUp(null); return }
    this.activePower.timeLeft -= dt
    if (this.activePower.timeLeft <= 0) {
      const t = this.activePower.type
      if (t === 'shield') this.player.setShield(false)
      if (t === 'magnet') this.magnetActive = false
      if (t === 'boost')  this.boostActive  = false
      this.activePower = null
      this.ui.updatePowerUp(null)
      return
    }
    this.ui.updatePowerUp(this.activePower.type, this.activePower.timeLeft / this.activePower.duration)
  }

  // ── Game tick ──────────────────────────────────────────────────────────
  _update(dt) {
    this.timePlayed += dt
    this.baseSpeed = Math.min(CONFIG.world.maxSpeed, CONFIG.world.baseSpeed + CONFIG.world.speedRamp * this.timePlayed)
    const eff = this.baseSpeed * (this.boostActive ? CONFIG.powerUps.boost.multiplier : 1)
    const diff = (this.baseSpeed - CONFIG.world.baseSpeed) / (CONFIG.world.maxSpeed - CONFIG.world.baseSpeed)

    this.scene.update(dt, eff)
    this.scene.updateCamera(dt, this.player.x, this.player.y, eff)
    this.player.update(dt, eff)
    this.traffic.update(dt, eff, diff)

    const got = this.coinSys.update(dt, eff, this.player.x, this.magnetActive, CONFIG.powerUps.magnet.radius)
    if (got > 0) { this.coinCount += got; this.scoreFloat += got * CONFIG.scoring.coinBonus; this.audio.play('coin') }

    const pu = this.powerupSys.update(dt, eff, this.player.x)
    if (pu) this._activatePower(pu)
    this._tickPower(dt)

    this.distance   += eff * dt
    this.scoreFloat += (eff * dt) / CONFIG.scoring.distancePerPoint

    for (const obs of this.traffic.getObstacles()) {
      if (this.player.collidesWith(obs, eff * dt)) {
        if (this.player.hit()) {
          this.audio.play('hit')
          if (this.player.lives <= 0) { this._gameOver(); return }
        }
        break
      }
    }

    this.ui.setHUD({ score: Math.floor(this.scoreFloat), coins: this.coinCount, distance: this.distance, lives: this.player.lives })
  }

  _idle(dt) {
    this.scene.update(dt, IDLE_SPEED)
    this.scene.updateCamera(dt, 0, 0, IDLE_SPEED)
    this.player.update(dt, IDLE_SPEED)
  }

  // ── RAF loop — smooth, capped dt ──────────────────────────────────────
  _loop(now) {
    // Guard: stop if this loop generation has been superseded
    if (!this._loopActive) return

    // Cap dt at 50ms (20fps minimum) to prevent spiral-of-death after tab switch
    const dt = Math.min(0.05, (now - (this._lastRAF || now)) / 1000)
    this._lastRAF = now

    if      (this.state === 'playing') this._update(dt)
    else if (this.state === 'menu' || this.state === 'landing' || this.state === 'loading') this._idle(dt)
    else {
      // paused / over — render one frozen frame then stop wasting GPU
      if (!this._frozenFrameRendered) {
        this.scene.render()
        this._frozenFrameRendered = true
      }
      requestAnimationFrame(t => this._loop(t))
      return
    }

    this._frozenFrameRendered = false
    this.scene.render()
    requestAnimationFrame(t => this._loop(t))
  }

  // Start (or restart) the RAF loop. Stops any previously running loop.
  _startLoop() {
    this._loopActive          = true
    this._frozenFrameRendered = false
    this._lastRAF             = 0
    requestAnimationFrame(t => this._loop(t))
  }

  // Stop the loop (used if we ever need to tear down cleanly)
  _stopLoop() {
    this._loopActive = false
  }
}
