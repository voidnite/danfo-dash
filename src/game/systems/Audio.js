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
    this.currentMusic = null
    this.musicSource = null
    this.musicStartTime = 0
    this.musicPauseTime = 0
    
    // Loading state
    this.loaded = false
    this.loadErrors = []
    
    // Audio file definitions
    this.audioFiles = {
      // Music (looped) - NEW SUNO AI GENERATED MP3 TRACKS
      music_menu: '/audio/danfo_dash_menu_theme.mp3',
      music_gameplay: '/audio/danfo_dash_gameplay_loop.mp3',
      
      // Sound effects (one-shot) - Original WAV files preserved
      sfx_coin: '/audio/sfx_coin_crystal.wav',
      sfx_jump: '/audio/sfx_jump_whoosh.wav',
      sfx_slide: '/audio/sfx_slide.wav',
      sfx_collision: '/audio/sfx_collision.wav',
      sfx_powerup: '/audio/sfx_powerup.wav',
      sfx_gameover: '/audio/sfx_game_over.wav',
      sfx_victory: '/audio/sfx_victory.wav',
      sfx_click: '/audio/sfx_ui_click.wav',
      
      // Ambience (looped, low volume) - Original WAV preserved
      ambience_traffic: '/audio/sfx_lagos_traffic_ambience.wav'
    }
  }

  // ── Initialization ─────────────────────────────────────────────────────
  
  async init() {
    this._ensureContext()
    if (!this.ctx) {
      console.warn('AudioContext not available')
      return false
    }
    
    try {
      await this._loadAllAudio()
      this.loaded = true
      console.log('✅ Audio system initialized:', this.buffers.size, 'files loaded')
      if (this.loadErrors.length > 0) {
        console.warn('⚠️ Some audio files failed to load:', this.loadErrors)
      }
      return true
    } catch (error) {
      console.error('❌ Audio initialization failed:', error)
      return false
    }
  }

  _ensureContext() {
    if (this.ctx) return
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create gain nodes for separate volume control
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
      
    } catch (error) {
      console.error('Failed to create AudioContext:', error)
      this.ctx = null
    }
  }

  // ── Audio Loading ──────────────────────────────────────────────────────
  
  async _loadAllAudio() {
    const promises = Object.entries(this.audioFiles).map(([key, path]) => 
      this._loadAudioFile(key, path)
    )
    await Promise.allSettled(promises)
  }

  async _loadAudioFile(key, path) {
    try {
      // Race the fetch + decode against a 10-second timeout so a stalled
      // file never blocks the entire loading sequence
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout loading ${path}`)), 10000)
      )

      const fetchPromise = fetch(path).then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`)
        const arrayBuffer = await response.arrayBuffer()
        // decodeAudioData wrapped in explicit Promise — some browsers stall
        // on the callback form; others stall on the promise form with bad data
        const audioBuffer = await new Promise((resolve, reject) => {
          this.ctx.decodeAudioData(arrayBuffer, resolve, reject)
        })
        return audioBuffer
      })

      const audioBuffer = await Promise.race([fetchPromise, timeoutPromise])
      this.buffers.set(key, audioBuffer)
      return audioBuffer

    } catch (error) {
      this.loadErrors.push({ key, path, error: error.message })
      console.warn(`⚠️ Audio skipped (non-fatal): ${key} — ${error.message}`)
      return null  // Never throw — let Promise.allSettled handle it gracefully
    }
  }

  // ── Playback Control ───────────────────────────────────────────────────
  
  /**
   * Resume AudioContext (required after user interaction due to autoplay policy)
   */
  async resume() {
    this._ensureContext()
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
        console.log('AudioContext resumed')
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error)
      }
    }
  }

  /**
   * Play a sound effect (non-looping, can overlap)
   */
  play(name) {
    // Map game event names to audio keys
    const sfxMap = {
      'coin': 'sfx_coin',
      'jump': 'sfx_jump',
      'slide': 'sfx_slide',
      'hit': 'sfx_collision',
      'powerup': 'sfx_powerup',
      'gameover': 'sfx_gameover',
      'victory': 'sfx_victory',
      'click': 'sfx_click',
      'start': 'sfx_click' // Use click sound for start until specific sound exists
    }
    
    const audioKey = sfxMap[name] || name
    this._playSound(audioKey, this.sfxGain, false)
  }

  /**
   * Play background music (looped)
   * @param {string} type - 'menu' or 'gameplay'
   */
  playMusic(type) {
    const musicKey = type === 'menu' ? 'music_menu' : 'music_gameplay'
    
    // Don't restart if already playing the same music
    if (this.currentMusic === musicKey && this.musicSource) {
      return
    }
    
    // Stop current music first
    this.stopMusic()
    
    this.currentMusic = musicKey
    this._playSound(musicKey, this.musicGain, true, (source) => {
      this.musicSource = source
      this.musicStartTime = this.ctx.currentTime
    })
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop()
      } catch (e) {
        // Already stopped
      }
      this.musicSource = null
    }
    this.currentMusic = null
  }

  /**
   * Play ambience (looped, quiet)
   */
  playAmbience() {
    // Only play if not already playing
    if (this.activeSources.has('ambience_traffic')) {
      return
    }
    
    this._playSound('ambience_traffic', this.ambienceGain, true, (source) => {
      this.activeSources.set('ambience_traffic', source)
    })
  }

  /**
   * Stop ambience
   */
  stopAmbience() {
    const source = this.activeSources.get('ambience_traffic')
    if (source) {
      try {
        source.stop()
      } catch (e) {
        // Already stopped
      }
      this.activeSources.delete('ambience_traffic')
    }
  }

  /**
   * Internal method to play any sound
   */
  _playSound(key, gainNode, loop = false, onSourceCreated = null) {
    if (this.muted && !loop) return // Allow looped sounds to be created but inaudible
    
    this._ensureContext()
    if (!this.ctx) return
    
    const buffer = this.buffers.get(key)
    if (!buffer) {
      // Silently fail for missing audio - game continues
      return
    }
    
    try {
      const source = this.ctx.createBufferSource()
      source.buffer = buffer
      source.loop = loop
      source.connect(gainNode)
      
      // Cleanup on end
      source.onended = () => {
        if (!loop && this.activeSources.get(key) === source) {
          this.activeSources.delete(key)
        }
      }
      
      source.start(0)
      
      if (onSourceCreated) {
        onSourceCreated(source)
      }
      
      // Track non-looped sources for potential cleanup
      if (!loop) {
        this.activeSources.set(key + '_' + Date.now(), source)
      }
      
    } catch (error) {
      console.warn(`Failed to play audio: ${key}`, error)
    }
  }

  // ── Volume Controls ────────────────────────────────────────────────────
  
  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.musicGain) {
      this.musicGain.gain.value = this.musicVolume
    }
  }

  /**
   * Set sound effects volume (0-1)
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume
    }
  }

  /**
   * Set ambience volume (0-1)
   */
  setAmbienceVolume(volume) {
    this.ambienceVolume = Math.max(0, Math.min(1, volume))
    if (this.ambienceGain) {
      this.ambienceGain.gain.value = this.ambienceVolume
    }
  }

  /**
   * Toggle mute for all audio
   */
  setMuted(muted) {
    this.muted = muted
    if (this.masterGain) {
      // Smooth volume transition
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 1,
        this.ctx.currentTime,
        0.05
      )
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────
  
  /**
   * Stop all audio and clean up
   */
  stopAll() {
    this.stopMusic()
    this.stopAmbience()
    
    // Stop all active sound effects
    for (const [key, source] of this.activeSources.entries()) {
      try {
        source.stop()
      } catch (e) {
        // Already stopped
      }
    }
    this.activeSources.clear()
  }

  /**
   * Dispose of audio context
   */
  dispose() {
    this.stopAll()
    
    if (this.ctx) {
      try {
        this.ctx.close()
      } catch (e) {
        console.warn('Error closing AudioContext:', e)
      }
      this.ctx = null
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// INTEGRATION HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Integration function: Call this when game state changes to menu
 * @param {Audio} audioSystem - The audio system instance
 */
export function transitionToMenuMusic(audioSystem) {
  audioSystem.stopAmbience()
  audioSystem.playMusic('menu')
}

/**
 * Integration function: Call this when gameplay starts
 * @param {Audio} audioSystem - The audio system instance
 */
export function transitionToGameplayAudio(audioSystem) {
  audioSystem.stopMusic()
  audioSystem.playMusic('gameplay')
  audioSystem.playAmbience()
}

/**
 * Integration function: Call this when game ends
 * @param {Audio} audioSystem - The audio system instance
 * @param {boolean} isVictory - Whether player won (for future victory music)
 */
export function transitionToGameOverAudio(audioSystem, isVictory = false) {
  audioSystem.stopMusic()
  audioSystem.stopAmbience()
  // Victory sound would play automatically via audioSystem.play('victory')
  // if called from game logic
}
