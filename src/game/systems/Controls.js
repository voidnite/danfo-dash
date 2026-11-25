// Input: keyboard (arrows/WASD/space) + touch swipes. Emits discrete actions to
// callbacks. Disabled while not actively playing so menu taps don't move a
// non-existent player.
export class Controls {
  constructor(target) {
    this.target = target
    this.handlers = {}
    this.enabled = false

    this._onKey = this._onKey.bind(this)
    this._onTouchStart = this._onTouchStart.bind(this)
    this._onTouchEnd = this._onTouchEnd.bind(this)

    window.addEventListener('keydown', this._onKey, { passive: false })
    target.addEventListener('touchstart', this._onTouchStart, { passive: false })
    target.addEventListener('touchend', this._onTouchEnd, { passive: false })
    // prevent the browser from doing touch-scroll/zoom during play
    target.addEventListener('touchmove', (e) => { if (this.enabled) e.preventDefault() }, { passive: false })
  }

  bind(handlers) { this.handlers = handlers }

  setEnabled(v) { this.enabled = v }

  _emit(name) {
    if (!this.enabled) return
    const fn = this.handlers[name]
    if (fn) fn()
  }

  _onKey(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault(); this._emit('left'); break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault(); this._emit('right'); break
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        e.preventDefault(); this._emit('jump'); break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault(); this._emit('slide'); break
      case 'p':
      case 'P':
      case 'Escape':
        this._emit('pause'); break
    }
  }

  _onTouchStart(e) {
    if (!this.enabled) return
    if (e.touches.length === 1) {
      this._sx = e.touches[0].clientX
      this._sy = e.touches[0].clientY
      this._startTime = performance.now()
    }
  }

  _onTouchEnd(e) {
    if (!this.enabled || this._sx == null) return
    const t = e.changedTouches[0]
    const dx = t.clientX - this._sx
    const dy = t.clientY - this._sy
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    const threshold = 24
    if (adx < threshold && ady < threshold) {
      // tap = jump (feels natural on mobile)
      this._emit('jump')
    } else if (adx > ady) {
      this._emit(dx > 0 ? 'right' : 'left')
    } else {
      this._emit(dy > 0 ? 'slide' : 'jump')
    }
    this._sx = null
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey)
    this.target.removeEventListener('touchstart', this._onTouchStart)
    this.target.removeEventListener('touchend', this._onTouchEnd)
  }
}
