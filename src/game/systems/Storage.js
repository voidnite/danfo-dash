// Storage — localStorage for offline data + Firebase Realtime DB for leaderboard.
// Falls back gracefully when Firebase is unavailable or offline.
import { CONFIG } from '../../config.js'

const KEY = CONFIG.storageKey

// ── Firebase config (free Realtime DB — no auth required for public read/write) ──
// Using a demo project. For production: replace with your own Firebase config.
const FB_URL = 'https://danfo-dash-default-rtdb.firebaseio.com'

const DEFAULTS = {
  highScore:    0,
  totalCoins:   0,
  bestDistance: 0,
  soundOn:      true,
  unlockedChars:['tunde'],
  playerName:   'Player',
  localBoard:   [],
}

export class Storage {
  constructor() {
    this.data = { ...DEFAULTS }
    this._load()
  }

  _load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) this.data = { ...DEFAULTS, ...JSON.parse(raw) }
    } catch { /* ignore */ }
  }

  _save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)) } catch { /* ignore */ }
  }

  get highScore()     { return this.data.highScore }
  get totalCoins()    { return this.data.totalCoins }
  get bestDistance()  { return this.data.bestDistance }
  get soundOn()       { return this.data.soundOn }
  get playerName()    { return this.data.playerName }

  setPlayerName(n)    { this.data.playerName = n; this._save() }
  setSoundOn(v)       { this.data.soundOn = !!v; this._save() }

  spendCoins(n) {
    this.data.totalCoins = Math.max(0, this.data.totalCoins - n)
    this._save()
  }

  saveUnlocked(arr) { this.data.unlockedChars = [...arr]; this._save() }

  recordRun(score, coins, distance) {
    const prev = this.data.highScore
    this.data.totalCoins += coins
    let newBest = false
    if (score > this.data.highScore)   { this.data.highScore = score; newBest = true }
    if (distance > this.data.bestDistance) this.data.bestDistance = distance

    // Push to local board
    if (!Array.isArray(this.data.localBoard)) this.data.localBoard = []
    this.data.localBoard.push({ name: this.data.playerName || 'Player', score })
    this.data.localBoard.sort((a, b) => b.score - a.score)
    this.data.localBoard = this.data.localBoard.slice(0, 10)
    this._save()

    // Post to Firebase in background (non-blocking)
    if (score > 0) this._postScore(this.data.playerName || 'Player', score)

    return { newBest, prevHigh: prev }
  }

  // ── Firebase REST API calls ──────────────────────────────────────────────
  _postScore(name, score) {
    const payload = JSON.stringify({ name, score, ts: Date.now() })
    fetch(`${FB_URL}/scores.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).catch(() => { /* offline — ignore */ })
  }

  // Returns a promise resolving to [{name, score, isMe}]
  async fetchLeaderboard(myName) {
    // Seed names so it never looks empty
    const seeds = [
      { name:'Tunde Lagos', score:9800 },
      { name:'Amaka Speed', score:7200 },
      { name:'Emeka Rush',  score:5600 },
      { name:'Ngozi Dash',  score:4100 },
      { name:'Chidi Fast',  score:3400 },
    ]
    try {
      const res = await fetch(
        `${FB_URL}/scores.json?orderBy="score"&limitToLast=20`,
        { signal: AbortSignal.timeout(4000) }
      )
      if (!res.ok) throw new Error('fetch failed')
      const raw = await res.json()
      if (!raw) return this._buildBoard([], myName, seeds)
      const entries = Object.values(raw)
        .filter(e => e && e.name && e.score)
        .sort((a, b) => b.score - a.score)
      return this._buildBoard(entries, myName, seeds)
    } catch {
      // Offline — use local board + seeds
      return this._buildBoard(this.data.localBoard || [], myName, seeds)
    }
  }

  _buildBoard(remote, myName, seeds) {
    const all = [...remote]
    // Add seeds if not already present
    for (const s of seeds) {
      if (!all.find(e => e.name === s.name)) all.push(s)
    }
    // Add local high score
    if (this.data.highScore > 0) {
      const existing = all.find(e => e.name === myName)
      if (!existing) all.push({ name: myName, score: this.data.highScore })
      else existing.score = Math.max(existing.score, this.data.highScore)
    }
    all.sort((a, b) => b.score - a.score)
    return all.slice(0, 10).map(e => ({ ...e, isMe: e.name === myName }))
  }

  getLeaderboard(myName) {
    return this._buildBoard(this.data.localBoard || [], myName, [
      { name:'Tunde Lagos', score:9800 },{ name:'Amaka Speed', score:7200 },
      { name:'Emeka Rush',  score:5600 },{ name:'Ngozi Dash',  score:4100 },
    ])
  }
}
