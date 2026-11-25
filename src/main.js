import './style.css'
import { Game } from './game/Game.js'

// Show errors visibly on screen so we can debug on mobile
window.onerror = (msg, src, line, col, err) => {
  const d = document.createElement('div')
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;color:#f00;padding:20px;font:14px monospace;overflow:auto;white-space:pre-wrap;'
  d.textContent = `ERROR:\n${msg}\n\nFile: ${src}\nLine: ${line}:${col}\n\n${err ? err.stack : ''}`
  document.body.appendChild(d)
}
window.onunhandledrejection = (e) => {
  const d = document.createElement('div')
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;color:#f00;padding:20px;font:14px monospace;overflow:auto;white-space:pre-wrap;'
  d.textContent = `UNHANDLED PROMISE:\n${e.reason}`
  document.body.appendChild(d)
}

// Splash shows for 2.4s (animation delay) + 0.4s (exit animation) = 2.8s total.
// We remove it at 2.8s, then immediately start game init so the loading screen
// appears the instant the splash is gone — no overlap, no z-index conflict.
const SPLASH_DURATION = 2800

const splash = document.getElementById('splash')

try {
  const root = document.getElementById('game-root')
  const game = new Game(root)
  window.danfoDash = game

  setTimeout(() => {
    // Remove splash from DOM now — loading screen (z-index:40) becomes visible
    if (splash && splash.parentNode) splash.remove()

    // Start full game initialization — loading screen progress begins here
    game.init().catch(err => {
      console.error('Game initialization error:', err)
    })
  }, SPLASH_DURATION)

} catch (e) {
  const d = document.createElement('div')
  d.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;color:#f00;padding:20px;font:14px monospace;overflow:auto;white-space:pre-wrap;'
  d.textContent = `INIT ERROR:\n${e.message}\n\n${e.stack}`
  document.body.appendChild(d)
}
