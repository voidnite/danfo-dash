// Audio.js — Complete audio manager for Danfo Dash
// Handles music, sound effects, and ambience with separate volume controls
// Respects browser autoplay restrictions and works across desktop + mobile

export class Audio {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.musicGain = null
    this.sfxGain = null
    this.ambienceGain = null

    // Volume levels (0-1)
    this.musicVolume = 0.5
    this.sfxVolume = 0.7
    this.ambienceVolume = 0.2

    // Mute state
    this.muted = false

    // Audio buffers storage
    this.buffers = new Map()

    // Currently playing sources (for stopping/cleanup)
    this.activeSources = new Map()

    // Music state
    this.currentMusic  = null
    this.musicSource   = null

    // Loading state
    this.loaded     = false
    this.loadErrors = []

    // Audio file definitions — MP3 for music, WAV for SFX
    this.audioFiles = {
      music_menu:      '/audio/danfo_dash_menu_theme.mp3',
      music_gameplay:  '/audio/danfo_dash_gameplay_loop.mp3',
      sfx_coin:        '/audio/sfx_coin_crystal.wav',
      sfx_jump:        '/audio/sfx_jump_whoosh.wav',
      sfx_slide:       '/audio/sfx_slide.wav',
      sfx_collision:   '/audio/sfx_collision.wav',
      sfx_powerup:     '/audio/sfx_powerup.wav',
      sfx_gameover:    '/audio/sfx_game_over.wav',
      sfx_victory:     '/audio/sfx_victory.wav',
      sfx_click:       '/audio/sfx_ui_click.wav',
      ambience_traffic:'/audio/sfx_lagos_traffic_ambience.wav',
    }
  }

  // ── Initialization ──────────────────────────────────────────────────────
  // Called during the loading screen. Creates the AudioContext (browsers
  // allow creation before a gesture — context starts suspended, resume()
  // unlocks it on first interaction) and pre-fetches all audio buffers so
  // they are ready the instant the user first interacts.
  async init() {
    this._ensureContext()
    if (!this.ctx) {
      console.warn('⚠️ AudioContext unavailable — audio disabled')
      return false
    }

    try {
      await this._loadAllAudio()
      this.loaded = true
      console.log('✅ Audio ready:', this.buffers.size, 'buffers loaded')
      if (this.loadErrors.length > 0) {
        console.warn('⚠️ Some audio skipped:', this.loadErrors.map(e => e.key).join(', '))
      }
      return true
    } catch (err) {
      console.error('❌ Audio init error:', err)
      return false
    }
  }

  _ensureContext() {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this.muted ? 0 : 1
      this.masterGain.connect(this.ctx.destination)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = this.musicVolume
      this.musicGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = this.sfxVolume
      this.sfxGain.connect(this.masterGain)

      this.ambienceGain = this.ctx.createGain()
      this.ambienceGain.gain.value = this.ambienceVolume
      this.ambienceGain.connect(this.masterGain)
    } catch (e) {
      console.error('AudioContext creation failed:', e)
      this.ctx = null
    }
  }

  // ── Audio Loading ───────────────────────────────────────────────────────
  async _loadAllAudio() {
    const tasks = Object.entries(this.audioFiles).map(([key, path]) =>
      this._loadAudioFile(key, path)
    )
    await Promise.allSettled(tasks)
  }

  async _loadAudioFile(key, path) {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${path}`)), 10000)
      )
      const load = fetch(path).then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`)
        const ab  = await res.arrayBuffer()
        const buf = await new Promise((resolve, reject) =>
          this.ctx.decodeAudioData(ab, resolve, reject)
        )
        return buf
      })
      const buf = await Promise.race([load, timeout])
      this.buffers.set(key, buf)
      return buf
    } catch (err) {
      this.loadErrors.push({ key, path, error: err.message })
      console.warn(`⚠️ Audio skipped (${key}): ${err.message}`)
      return null
    }
  }

  // ── Unlock AudioContext after user gesture ──────────────────────────────
  // Called on the first click / touchstart. Only needs to call ctx.resume().
  // All buffers are already loaded from init() so music plays immediately.
  async resume() {
    if (!this.ctx) return
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch (e) {
        console.warn('AudioContext resume failed:', e)
      }
    }
  }

  // ── Playback ────────────────────────────────────────────────────────────
  play(name) {
    const sfxMap = {
      coin:    'sfx_coin',
      jump:    'sfx_jump',
      slide:   'sfx_slide',
      hit:     'sfx_collision',
      powerup: 'sfx_powerup',
      gameover:'sfx_gameover',
      victory: 'sfx_victory',
      click:   'sfx_click',
      start:   'sfx_click',
    }
    this._playSound(sfxMap[name] || name, this.sfxGain, false)
  }

  playMusic(type) {
    const key = type === 'menu' ? 'music_menu' : 'music_gameplay'
    if (this.currentMusic === key && this.musicSource) return   // already playing
    this.stopMusic()
    this.currentMusic = key
    this._playSound(key, this.musicGain, true, source => {
      if (this.currentMusic === key) {
        this.musicSource = source
      } else {
        try { source.stop() } catch (_) {}
      }
    })
  }

  stopMusic() {
    if (this.musicSource) {
      try { this.musicSource.stop() } catch (_) {}
      this.musicSource = null
    }
    this.currentMusic = null
  }

  playAmbience() {
    if (this.activeSources.has('ambience_traffic')) return
    this._playSound('ambience_traffic', this.ambienceGain, true, src => {
      this.activeSources.set('ambience_traffic', src)
    })
  }

  stopAmbience() {
    const src = this.activeSources.get('ambience_traffic')
    if (src) {
      try { src.stop() } catch (_) {}
      this.activeSources.delete('ambience_traffic')
    }
  }

  _playSound(key, gainNode, loop = false, onSourceCreated = null) {
    if (this.muted && !loop) return
    if (!this.ctx || !gainNode) return
    const buffer = this.buffers.get(key)
    if (!buffer) return   // buffer not ready — silent fail
    try {
      const source = this.ctx.createBufferSource()
      source.buffer = buffer
      source.loop   = loop
      source.connect(gainNode)
      source.onended = () => {
        if (!loop) this.activeSources.delete(key + '_' + source._id)
      }
      source.start(0)
      if (onSourceCreated) onSourceCreated(source)
      if (!loop) {
        const id = Date.now() + Math.random()
        source._id = id
        this.activeSources.set(key + '_' + id, source)
      }
    } catch (e) {
      console.warn(`_playSound(${key}) failed:`, e)
    }
  }

  // ── Volume / mute ───────────────────────────────────────────────────────
  setMusicVolume(v) {
    this.musicVolume = Math.max(0, Math.min(1, v))
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume
  }

  setSfxVolume(v) {
    this.sfxVolume = Math.max(0, Math.min(1, v))
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume
  }

  setAmbienceVolume(v) {
    this.ambienceVolume = Math.max(0, Math.min(1, v))
    if (this.ambienceGain) this.ambienceGain.gain.value = this.ambienceVolume
  }

  setMuted(muted) {
    this.muted = muted
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 1,
        this.ctx.currentTime,
        0.05
      )
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────
  stopAll() {
    this.stopMusic()
    this.stopAmbience()
    for (const src of this.activeSources.values()) {
      try { src.stop() } catch (_) {}
    }
    this.activeSources.clear()
  }

  dispose() {
    this.stopAll()
    if (this.ctx) {
      try { this.ctx.close() } catch (_) {}
      this.ctx = null
    }
  }
}

// ── Integration helpers ─────────────────────────────────────────────────────
export function transitionToMenuMusic(audio) {
  audio.stopAmbience()
  audio.playMusic('menu')
}

export function transitionToGameplayAudio(audio) {
  audio.stopMusic()
  audio.playMusic('gameplay')
  audio.playAmbience()
}

export function transitionToGameOverAudio(audio) {
  audio.stopMusic()
  audio.stopAmbience()
}
