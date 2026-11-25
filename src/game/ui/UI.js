// UI.js — All screens. Strict z-index: loading=40, screens=10, HUD=20, modals=30
import { CONFIG } from '../../config.js'

// ── 6 Characters ─────────────────────────────────────────────────────────────
export const CHARACTERS = [
  { id:'tunde', name:'Tunde',   emoji:'🏃🏿',   cost:0,    shirtColor:0xF4C20D, pantsColor:0x1A237E, skinColor:0x8D5524, hairColor:0x1A0800 },
  { id:'amaka', name:'Amaka',   emoji:'🏃🏿‍♀️',  cost:500,  shirtColor:0xE53935, pantsColor:0x2E7D32, skinColor:0xAD7355, hairColor:0x1A0800 },
  { id:'emeka', name:'Emeka',   emoji:'🕺🏿',   cost:1200, shirtColor:0x1E88E5, pantsColor:0xFB8C00, skinColor:0x6D4C41, hairColor:0x000000 },
  { id:'ngozi', name:'Ngozi',   emoji:'💃🏿',   cost:2500, shirtColor:0x8E24AA, pantsColor:0xFFB300, skinColor:0x9C6B4E, hairColor:0x1A0800 },
  { id:'chidi', name:'Chidi',   emoji:'🧍🏿',   cost:4000, shirtColor:0x00897B, pantsColor:0x37474F, skinColor:0x5D4037, hairColor:0x0A0500 },
  { id:'funke', name:'Funke',   emoji:'🧎🏿‍♀️',  cost:6000, shirtColor:0xF06292, pantsColor:0x1565C0, skinColor:0xBC8A5F, hairColor:0x1A0800 },
]

const PU_LABEL = { shield:'🛡 SHIELD', magnet:'🧲 MAGNET', boost:'⚡ BOOST' }

// ── DOM helpers ───────────────────────────────────────────────────────────────
const mk  = (tag,cls='') => { const n=document.createElement(tag); if(cls) n.className=cls; return n }
const div = (cls='') => mk('div',cls)
const btn = (html,cls='') => { const b=mk('button',`btn ${cls}`); b.innerHTML=html; return b }
const set = (n,t) => { n.textContent=t; return n }

// ── SVG Hero ──────────────────────────────────────────────────────────────────
function heroSVG() {
  return `<svg class="hero-svg" viewBox="0 0 400 700" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0D3B8C"/><stop offset="40%" stop-color="#1A6EC9"/>
    <stop offset="68%" stop-color="#FF8C00"/><stop offset="85%" stop-color="#FF4F0A"/>
    <stop offset="100%" stop-color="#C83200"/>
  </linearGradient>
  <linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2A2D35"/><stop offset="100%" stop-color="#16181E"/>
  </linearGradient>
  <radialGradient id="gSun" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#FFE033" stop-opacity=".95"/>
    <stop offset="100%" stop-color="#FF8C00" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="400" height="700" fill="url(#gSky)"/>
<circle cx="200" cy="315" r="80" fill="url(#gSun)" opacity=".6"/>
<circle cx="200" cy="315" r="38" fill="#FFE033"/>
<!-- clouds -->
<g opacity=".85"><ellipse cx="78" cy="128" rx="38" ry="17" fill="#fff"/><ellipse cx="108" cy="120" rx="28" ry="15" fill="#fff"/></g>
<g opacity=".85"><ellipse cx="300" cy="148" rx="40" ry="18" fill="#fff"/><ellipse cx="330" cy="140" rx="30" ry="16" fill="#fff"/></g>
<!-- left buildings -->
<rect x="0" y="200" width="52" height="210" fill="#E53935"/><rect x="5" y="210" width="42" height="200" fill="#C62828"/>
<rect x="9" y="218" width="10" height="12" fill="#FFF176" opacity=".9"/><rect x="25" y="218" width="10" height="12" fill="#FFF176" opacity=".9"/>
<rect x="9" y="238" width="10" height="12" fill="#0D2137"/><rect x="25" y="238" width="10" height="12" fill="#FFF176" opacity=".9"/>
<rect x="9" y="258" width="10" height="12" fill="#FFF176" opacity=".9"/><rect x="25" y="258" width="10" height="12" fill="#0D2137"/>
<rect x="0" y="290" width="82" height="22" fill="#111" rx="2"/>
<text x="41" y="305" font-family="Arial Black" font-size="11" fill="#FFD600" text-anchor="middle" font-weight="900">STORE</text>
<rect x="54" y="235" width="50" height="175" fill="#FB8C00"/><rect x="57" y="244" width="44" height="166" fill="#E65100"/>
<rect x="61" y="252" width="10" height="12" fill="#FFF176" opacity=".9"/><rect x="77" y="252" width="10" height="12" fill="#0D2137"/>
<rect x="54" y="295" width="52" height="22" fill="#111" rx="2"/>
<text x="80" y="310" font-family="Arial Black" font-size="10" fill="#FFD600" text-anchor="middle" font-weight="900">MARKET</text>
<!-- right buildings -->
<rect x="348" y="210" width="52" height="200" fill="#1E88E5"/><rect x="351" y="220" width="46" height="190" fill="#1565C0"/>
<rect x="355" y="228" width="10" height="12" fill="#FFF176" opacity=".9"/><rect x="371" y="228" width="10" height="12" fill="#FFF176" opacity=".9"/>
<rect x="355" y="248" width="10" height="12" fill="#0D2137"/><rect x="371" y="248" width="10" height="12" fill="#FFF176" opacity=".9"/>
<rect x="295" y="225" width="55" height="185" fill="#43A047"/><rect x="298" y="235" width="49" height="175" fill="#2E7D32"/>
<rect x="302" y="244" width="10" height="12" fill="#FFF176" opacity=".9"/><rect x="318" y="244" width="10" height="12" fill="#FFF176" opacity=".9"/>
<rect x="295" y="295" width="100" height="22" fill="#111" rx="2"/>
<text x="345" y="310" font-family="Arial Black" font-size="10" fill="#FFD600" text-anchor="middle" font-weight="900">HOTEL</text>
<!-- palms -->
<rect x="104" y="308" width="8" height="90" fill="#8D6E63" rx="3"/>
<ellipse cx="108" cy="306" rx="22" ry="13" fill="#2E7D32"/>
<ellipse cx="92" cy="314" rx="16" ry="10" fill="#2E7D32" transform="rotate(-18 92 314)"/>
<ellipse cx="124" cy="314" rx="16" ry="10" fill="#2E7D32" transform="rotate(18 124 314)"/>
<rect x="286" y="308" width="8" height="90" fill="#8D6E63" rx="3"/>
<ellipse cx="290" cy="306" rx="22" ry="13" fill="#2E7D32"/>
<ellipse cx="274" cy="314" rx="16" ry="10" fill="#2E7D32" transform="rotate(18 274 314)"/>
<ellipse cx="306" cy="314" rx="16" ry="10" fill="#2E7D32" transform="rotate(-18 306 314)"/>
<!-- road -->
<path d="M48 700 L148 388 L252 388 L352 700 Z" fill="url(#gRoad)"/>
<path d="M163 700 L183 438 L193 438 L178 700 Z" fill="#FFD600" opacity=".9"/>
<path d="M237 700 L217 438 L207 438 L222 700 Z" fill="#FFD600" opacity=".9"/>
<path d="M48 700 L150 398 L160 398 L62 700 Z" fill="#C8C0B0"/>
<path d="M352 700 L250 398 L240 398 L338 700 Z" fill="#C8C0B0"/>
<!-- DANFO BUS (hero) -->
<g transform="translate(108,392)">
  <rect x="0" y="22" width="184" height="108" fill="#FFD600" rx="8"/>
  <rect x="0" y="62" width="184" height="28" fill="#111"/>
  <rect x="10" y="30" width="164" height="40" fill="#B3E5FC" rx="5" opacity=".88"/>
  <rect x="14" y="33" width="62" height="14" fill="#fff" rx="3" opacity=".32"/>
  <rect x="8" y="8" width="168" height="16" fill="#222" rx="4"/>
  <rect x="18" y="2" width="42" height="8" fill="#E53935" rx="3"/>
  <rect x="68" y="2" width="34" height="8" fill="#1E88E5" rx="3"/>
  <rect x="110" y="2" width="38" height="8" fill="#FB8C00" rx="3"/>
  <rect x="8" y="92" width="20" height="12" fill="#FFF176" rx="3"/>
  <rect x="156" y="92" width="20" height="12" fill="#FFF176" rx="3"/>
  <rect x="8" y="92" width="20" height="12" fill="#FF1111" rx="3"/>
  <rect x="156" y="92" width="20" height="12" fill="#FF1111" rx="3"/>
  <rect x="10" y="97" width="34" height="22" fill="#B3E5FC" rx="3" opacity=".8"/>
  <rect x="52" y="97" width="34" height="22" fill="#B3E5FC" rx="3" opacity=".8"/>
  <rect x="98" y="97" width="34" height="22" fill="#B3E5FC" rx="3" opacity=".8"/>
  <rect x="140" y="97" width="34" height="22" fill="#B3E5FC" rx="3" opacity=".8"/>
  <rect x="38" y="130" width="36" height="36" rx="18" fill="#111"/><rect x="47" y="139" width="18" height="18" rx="9" fill="#888"/>
  <rect x="110" y="130" width="36" height="36" rx="18" fill="#111"/><rect x="119" y="139" width="18" height="18" rx="9" fill="#888"/>
  <text x="92" y="60" font-family="Arial Black" font-size="13" fill="#FFD600" text-anchor="middle" font-weight="900">DANFO</text>
</g>
<!-- crowd silhouettes -->
<g fill="#100A00" opacity=".72">
  <circle cx="28" cy="422" r="10"/><rect x="21" y="432" width="14" height="30" rx="5"/>
  <circle cx="56" cy="416" r="11"/><rect x="49" y="427" width="14" height="32" rx="5"/>
  <circle cx="84" cy="420" r="9"/><rect x="78" y="429" width="12" height="28" rx="4"/>
</g>
<g fill="#100A00" opacity=".72">
  <circle cx="316" cy="420" r="10"/><rect x="309" y="430" width="14" height="30" rx="5"/>
  <circle cx="344" cy="414" r="11"/><rect x="337" y="425" width="14" height="32" rx="5"/>
  <circle cx="372" cy="418" r="9"/><rect x="366" y="427" width="12" height="28" rx="4"/>
</g>
<!-- market umbrellas -->
<path d="M25 442 Q46 420 66 442 Z" fill="#E53935"/>
<path d="M308 440 Q328 420 348 440 Z" fill="#43A047"/>
<path d="M354 444 Q372 426 390 444 Z" fill="#FB8C00"/>
<!-- vignette bottom -->
<linearGradient id="gVign" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(5,10,30,.88)"/>
</linearGradient>
<rect x="0" y="460" width="400" height="240" fill="url(#gVign)"/>
</svg>`
}

// ════════════════════════════════════════════════════════════════════════════
export class UI {
  constructor(root, callbacks) {
    this.root = root
    this.cb   = callbacks
    this._charIdx = 0
    this._build()
  }

  _build() {
    this._buildLoading()
    this._buildLanding()
    this._buildMenu()
    this._buildCharSelect()
    this._buildHUD()
    // Modals at z-index 30, appended to body
    this._buildLoginModal()
    this._buildHowToModal()
    this._buildPauseModal()
    this._buildGameOverModal()
    this._buildLeaderboardModal()
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  _buildLoading() {
    const s = div(); s.id = 'screen-loading'
    s.innerHTML = `
      <div class="load-spinner">
        <div class="load-spinner-ring"></div>
      </div>
      <div class="load-status">LOADING...</div>
      <div class="load-percent">1%</div>
      <div class="load-bar-wrap">
        <div class="load-bar"></div>
      </div>`
    this.root.appendChild(s); this.scrLoading = s
    this._loadPercent = s.querySelector('.load-percent')
    this._loadStatus  = s.querySelector('.load-status')
    this._loadBar     = s.querySelector('.load-bar')
    this._loadPct     = 1   // internal tracked value
  }

  // Called by Game.js to push progress to a specific target percentage.
  // Queues targets so rapid calls never skip over intermediate values.
  setLoadProgress(target, label = 'LOADING...') {
    // Always update the visible label immediately
    if (this._loadStatus) this._loadStatus.textContent = label

    // Clamp target — never go backwards, never exceed 100
    const safeTarget = Math.min(100, Math.max(this._loadPct || 1, target))

    // If an interval is already running, just update its destination —
    // it will animate there naturally and stop, then the next call can proceed.
    // This prevents rapid successive calls from wiping out intermediate progress.
    this._loadTarget = safeTarget

    // Only start a new interval if one isn't already running
    if (this._loadFill) return

    this._loadFill = setInterval(() => {
      this._loadPct = Math.min(this._loadTarget, (this._loadPct || 1) + 0.8)
      const display = Math.floor(this._loadPct)
      if (this._loadPercent) this._loadPercent.textContent = display + '%'
      if (this._loadBar)     this._loadBar.style.width     = this._loadPct + '%'

      if (this._loadPct >= this._loadTarget) {
        // Reached current target — write exact value then stop the interval.
        // The NEXT call to setLoadProgress will start a fresh interval.
        const exact = Math.round(this._loadTarget)
        if (this._loadPercent) this._loadPercent.textContent = exact + '%'
        if (this._loadBar)     this._loadBar.style.width     = exact + '%'
        clearInterval(this._loadFill)
        this._loadFill = null
      }
    }, 20)
  }

  // Returns a Promise that resolves once the bar finishes animating to
  // its current target. Game.js awaits this before moving to the next stage.
  waitForProgress() {
    return new Promise(resolve => {
      const check = () => {
        if (!this._loadFill) { resolve(); return }
        setTimeout(check, 25)
      }
      check()
    })
  }

  // ── Landing ───────────────────────────────────────────────────────────────
  _buildLanding() {
    const s = div(); s.id = 'screen-landing'; s.classList.add('hidden')
    s.innerHTML = heroSVG()
    
    const ui = div('landing-ui')
    ui.innerHTML = `<div class="landing-title">DANFO DASH</div><div class="landing-sub">🚌 Survive the Lagos Rush</div>`
    const btns = div('landing-btns')
    const play  = btn('▶  PLAY NOW', 'btn-yellow btn-lg btn-full')
    const login = btn('🔑  Login / Sign Up', 'btn-ghost btn-full')
    play.onclick  = () => this.cb.onLandingPlay()
    login.onclick = () => this._open(this.mLogin)
    btns.append(play, login)
    const badges = div('landing-badges')
    badges.innerHTML = `<span class="badge">🏆 Leaderboard</span><span class="badge">👥 Social</span><span class="badge">🎮 Free</span><span class="badge">📱 Mobile</span>`
    ui.append(btns, badges)
    s.appendChild(ui)
    this.root.appendChild(s); this.scrLanding = s
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  _buildMenu() {
    const s = div(); s.id = 'screen-menu'; s.classList.add('hidden')
    s.appendChild(div('menu-gradient'))
    const ui = div('menu-ui')
    this._menuTitle  = set(div('menu-title'), 'DANFO DASH')
    this._menuPlayer = div('menu-pill'); this._menuPlayer.innerHTML = '<span>👤</span><span class="pname">Player</span>'
    this._menuCoins  = div('menu-pill'); this._menuCoins.innerHTML  = '<span>🪙</span><span class="cval">0</span>'
    const infoRow = div('menu-info-row'); infoRow.append(this._menuPlayer, this._menuCoins)
    this._menuBest = div('menu-pill'); this._menuBest.innerHTML = '<span class="menu-best-lbl">BEST</span><span class="menu-best-val">0</span>'

    const col = div('menu-btn-col')
    const playBtn  = btn('▶  PLAY',        'btn-yellow btn-lg btn-full'); playBtn.onclick  = () => this.cb.onMenuPlay()
    const charBtn  = btn('👕  Characters',  'btn-sky btn-full');           charBtn.onclick  = () => this.showCharSelect()
    const lbBtn    = btn('🏆  Leaderboard', 'btn-ghost btn-full');         lbBtn.onclick    = () => this._open(this.mLB)
    const howBtn   = btn('❓  How to Play', 'btn-ghost btn-full');         howBtn.onclick   = () => this._open(this.mHowTo)
    this._muteBtn = btn('🔊', 'btn-ghost btn-sm'); this._muteBtn.onclick = () => this.cb.onToggleSound()
    col.append(playBtn, charBtn, lbBtn, howBtn, this._muteBtn)
    ui.append(this._menuTitle, infoRow, this._menuBest, col)
    s.appendChild(ui); this.root.appendChild(s); this.scrMenu = s
  }

  // ── Character select ──────────────────────────────────────────────────────
  _buildCharSelect() {
    const s = div(); s.id = 'screen-charselect'; s.classList.add('hidden')
    // header
    const hdr = div('cs-header')
    const back = btn('‹‹ BACK', 'btn-ghost btn-sm'); back.onclick = () => this.showMenu()
    this._csCoins = div('cs-coins'); this._csCoins.innerHTML = '🪙 <span>0</span>'
    hdr.append(set(div('cs-title'), 'CHARACTER SELECT'), back, this._csCoins)
    // body
    const body = div('cs-body')
    this._csEmoji = div('cs-preview-emoji'); this._csEmoji.textContent = CHARACTERS[0].emoji
    this._csName  = div('cs-preview-name');  this._csName.textContent  = CHARACTERS[0].name
    const ring = div('cs-preview-ring'); ring.appendChild(this._csEmoji)
    const prev = div('cs-nav-btn'); prev.textContent='‹'; prev.onclick=()=>this._navChar(-1)
    const next = div('cs-nav-btn'); next.textContent='›'; next.onclick=()=>this._navChar(1)
    const nav = div('cs-nav-row'); nav.append(prev, ring, next)
    this._csGrid = div('cs-grid'); this._buildCsGrid()
    this._csSelectBtn = btn('✔  SELECT', 'btn-green btn-full')
    this._csSelectBtn.onclick = () => { this.cb.onSelectChar(CHARACTERS[this._charIdx]); this.showMenu() }
    this._csUnlockBtn = btn('🪙  UNLOCK', 'btn-yellow btn-full')
    this._csUnlockBtn.onclick = () => { this.cb.onUnlockChar(CHARACTERS[this._charIdx]); this._refreshCs() }
    const act = div('cs-action'); act.append(this._csSelectBtn, this._csUnlockBtn)
    body.append(this._csName, nav, this._csGrid, act)
    s.append(hdr, body); this.root.appendChild(s); this.scrCharSelect = s
  }

  _buildCsGrid() {
    this._csGrid.innerHTML = ''; this._csCards = []
    CHARACTERS.forEach((ch, i) => {
      const unlocked = ch.cost===0 || (this.cb.isCharUnlocked && this.cb.isCharUnlocked(ch.id))
      const card = div('cs-card'+(i===this._charIdx?' selected':'')+(unlocked?'':' locked'))
      card.innerHTML = `<div class="cs-card-emoji">${ch.emoji}</div><div class="cs-card-name">${ch.name.toUpperCase()}</div><div class="cs-card-cost">${ch.cost===0?'✔ FREE':'🪙 '+ch.cost}</div>${unlocked?'':'<div class="cs-lock">🔒</div>'}`
      card.onclick = () => { this._charIdx=i; this._refreshCs() }
      this._csGrid.appendChild(card); this._csCards.push(card)
    })
  }

  _navChar(d) { this._charIdx=(this._charIdx+d+CHARACTERS.length)%CHARACTERS.length; this._refreshCs() }

  _refreshCs() {
    const ch=CHARACTERS[this._charIdx]
    const unlocked=ch.cost===0||(this.cb.isCharUnlocked&&this.cb.isCharUnlocked(ch.id))
    this._csEmoji.textContent=ch.emoji; this._csName.textContent=ch.name
    this._csCards.forEach((c,i)=>c.classList.toggle('selected',i===this._charIdx))
    this._csSelectBtn.classList.toggle('hidden',!unlocked)
    this._csUnlockBtn.classList.toggle('hidden',unlocked)
    if(!unlocked) this._csUnlockBtn.innerHTML=`🪙 UNLOCK — ${ch.cost} coins`
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD() {
    const h = div(); h.id='hud'; h.classList.add('hidden')

    // ── TOP ROW: coins | score | right-col ──
    // Coins left
    this._hudCoinsVal = div('hud-coins-val'); this._hudCoinsVal.textContent='0'
    const coinsBox = div('hud-coins')
    const coinIcon = div('hud-coin-icon'); coinIcon.textContent='🪙'
    coinsBox.append(coinIcon, this._hudCoinsVal)

    // Score centre
    this._hudScoreVal = div('hud-score-val'); this._hudScoreVal.textContent='0'
    const scoreBox = div('hud-score')
    scoreBox.append(set(div('hud-score-lbl'),'SCORE'), this._hudScoreVal)

    // Right column: lives, pause, mute
    this._hudLives = div('hud-lives')
    this._pauseBtn = div('hud-icon-btn'); this._pauseBtn.textContent='⏸'
    this._pauseBtn.style.pointerEvents='auto'; this._pauseBtn.onclick=()=>this.cb.onPause()
    this._hudMuteBtn = div('hud-icon-btn'); this._hudMuteBtn.textContent='🔊'
    this._hudMuteBtn.style.pointerEvents='auto'; this._hudMuteBtn.onclick=()=>this.cb.onToggleSound()
    const rightCol = div('hud-right')
    rightCol.append(this._hudLives, this._pauseBtn, this._hudMuteBtn)

    const topRow = div('hud-top')
    topRow.append(coinsBox, scoreBox, rightCol)

    // ── MID: distance pill ──
    this._hudDist = div('hud-dist'); this._hudDist.textContent='0m'
    const midRow = div('hud-mid')
    midRow.appendChild(this._hudDist)

    // ── BOTTOM: power-up bar ──
    this._puLabel = div(); this._puLabel.textContent='BOOST'
    this._puBar   = div('hud-pu-bar')
    const puWrap  = div('hud-pu-wrap'); puWrap.appendChild(this._puBar)
    this._puBox   = div('hud-pu hidden'); this._puBox.append(this._puLabel, puWrap)
    const bottomRow = div('hud-bottom'); bottomRow.appendChild(this._puBox)

    h.append(topRow, midRow, bottomRow)
    this.root.appendChild(h); this.hud = h
  }

  // ── Modals ────────────────────────────────────────────────────────────────
  _modal(id) {
    const m=div('modal-layer hidden'); m.id=id; document.body.appendChild(m); return m
  }
  _open(m)  { m.classList.remove('hidden') }
  _close(m) { m.classList.add('hidden') }

  _buildLoginModal() {
    const m = this._modal('modal-login')
    const c = div('card'); c.style.position='relative'
    const X = btn('✕','btn-ghost btn-sm'); X.style.cssText='position:absolute;top:12px;right:12px;min-width:0'; X.onclick=()=>this._close(m)
    const title = set(div('panel-title'),'🎮 Join the Game')
    const sub   = set(div('login-sub'),'Log in to save scores and compete on the leaderboard.')
    this._loginName = mk('input','login-input')
    this._loginName.type='text'; this._loginName.placeholder='Choose a player name…'; this._loginName.maxLength=18
    const guestBtn = btn('👤  Play as Guest','btn-green btn-full')
    guestBtn.onclick = () => { this.cb.onGuestLogin(this._loginName.value.trim()||'Player'); this._close(m) }
    const div1 = div('divider'); div1.textContent='or sign in with'
    const fbBtn = btn('<span style="font-weight:900;font-size:18px">f</span>  Continue with Facebook','btn-fb btn-full')
    fbBtn.onclick=()=>{ this.cb.onSocialLogin('facebook'); this._close(m) }
    const ggBtn = btn('<span style="font-weight:900;font-size:16px">G</span>  Continue with Google','btn-gg btn-full')
    ggBtn.onclick=()=>{ this.cb.onSocialLogin('google'); this._close(m) }
    c.append(X,title,sub,this._loginName,guestBtn,div1,fbBtn,ggBtn)
    m.appendChild(c); this.mLogin=m
  }

  _buildHowToModal() {
    const m=this._modal('modal-howto'); const c=div('card')
    const ul=mk('ul','rules-list')
    ul.innerHTML=`
      <li><span class="rules-icon">👈👉</span><span>Swipe <b>left/right</b> or arrow keys to change lanes</span></li>
      <li><span class="rules-icon">⬆️</span><span>Swipe <b>up</b> or Space to <b>jump</b> over barriers</span></li>
      <li><span class="rules-icon">⬇️</span><span>Swipe <b>down</b> to <b>slide</b> under overhead signs</span></li>
      <li><span class="rules-icon">🚌</span><span>Dodge danfo buses, keke NAPEPs and cars — change lanes!</span></li>
      <li><span class="rules-icon">🪙</span><span>Collect <b>gold star coins</b> to unlock characters</span></li>
      <li><span class="rules-icon">🛡⚡🧲</span><span><b>Power-ups</b> are GLOWING orbs with labels — grab them!</span></li>
      <li><span class="rules-icon">❤️❤️❤️</span><span>You have <b>3 lives</b> — survive as long as possible!</span></li>`
    const close=btn('Got it! 👍','btn-green btn-full'); close.onclick=()=>this._close(m)
    c.append(set(div('panel-title'),'How to Play'),ul,close); m.appendChild(c); this.mHowTo=m
  }

  _buildPauseModal() {
    const m=this._modal('modal-pause'); const c=div('card')
    const resume  = btn('▶  Resume',   'btn-green btn-full');  resume.onclick=()=>this.cb.onResume()
    const restart = btn('↺  Restart',  'btn-yellow btn-full'); restart.onclick=()=>this.cb.onRestart()
    const menu    = btn('🏠  Menu',    'btn-ghost btn-full');   menu.onclick=()=>this.cb.onMenu()
    c.append(set(div('panel-title'),'⏸ Paused'),resume,restart,menu); m.appendChild(c); this.mPause=m
  }

  _buildGameOverModal() {
    const m=this._modal('modal-gameover'); const c=div('card')
    this._goTitle=div('panel-title')
    this._goScore=div('panel-score-val')
    this._goBest =div('panel-best')
    this._goCoins=div('panel-stat')
    this._goDist =div('panel-stat')
    const stats=div('panel-stats'); stats.append(this._goCoins,this._goDist)
    const again=btn('▶  Play Again','btn-yellow btn-lg btn-full'); again.onclick=()=>this.cb.onRestart()
    const menu =btn('🏠  Main Menu','btn-ghost btn-full');         menu.onclick=()=>this.cb.onMenu()
    c.append(this._goTitle,set(div('panel-score-lbl'),'SCORE'),this._goScore,this._goBest,stats,again,menu)
    m.appendChild(c); this.mGameOver=m
  }

  _buildLeaderboardModal() {
    const m=this._modal('modal-leaderboard'); const c=div('card')
    this._lbStatus = set(div('lb-status'),'Loading…')
    this._lbList   = div()
    this._lbList.style.cssText='display:flex;flex-direction:column;gap:8px;width:100%'
    const close=btn('Close','btn-ghost btn-full'); close.onclick=()=>this._close(m)
    c.append(set(div('panel-title'),'🏆 Leaderboard'),this._lbStatus,this._lbList,close)
    m.appendChild(c); this.mLB=m
  }

  // ════════════════════════════════════════════════════════
  //  PUBLIC API
  // ════════════════════════════════════════════════════════
  _hideAll() {
    for(const s of [this.scrLoading,this.scrLanding,this.scrMenu,this.scrCharSelect,this.hud]) s.classList.add('hidden')
    for(const m of [this.mLogin,this.mHowTo,this.mPause,this.mGameOver,this.mLB]) m.classList.add('hidden')
  }

  showLoading()  { this._hideAll(); this.scrLoading.classList.remove('hidden') }
  showLanding()  { this._hideAll(); this.scrLanding.classList.remove('hidden') }

  showMenu(name='Player', coins=0, best=0) {
    this._hideAll(); this.scrMenu.classList.remove('hidden')
    this.scrMenu.querySelector('.pname').textContent = name
    this.scrMenu.querySelector('.cval').textContent  = coins
    this.scrMenu.querySelector('.menu-best-val').textContent = best.toLocaleString()
  }

  showCharSelect(coins=0) {
    this.scrCharSelect.classList.remove('hidden')
    this._csCoins.querySelector('span').textContent=coins
    this._buildCsGrid(); this._refreshCs()
  }

  startGame() { this._hideAll(); this.hud.classList.remove('hidden') }

  showPause()    { this._open(this.mPause) }
  hidePause()    { this._close(this.mPause) }
  hideOverlays() { this._close(this.mPause); this._close(this.mGameOver) }

  setMuteLabel(on) {
    const ico=on?'🔊':'🔇'
    if(this._muteBtn)    this._muteBtn.textContent=ico
    if(this._hudMuteBtn) this._hudMuteBtn.textContent=ico
  }

  setHUD({ score, coins, distance, lives }) {
    this._hudScoreVal.textContent = score.toLocaleString()
    this._hudCoinsVal.textContent = coins
    this._hudDist.textContent     = `${Math.floor(distance)}m`
    this._hudLives.innerHTML=''
    for(let i=0;i<CONFIG.lives.max;i++){
      const h=div('hud-heart'+(i>=lives?' off':'')); h.textContent=i<lives?'❤️':'🖤'
      this._hudLives.appendChild(h)
    }
  }

  updatePowerUp(type, frac) {
    if(!type){ this._puBox.classList.add('hidden'); return }
    this._puBox.classList.remove('hidden')
    this._puLabel.textContent = PU_LABEL[type]||type
    this._puBar.style.width   = `${Math.max(0,Math.min(1,frac))*100}%`
  }

  updateCharSelectCoins(coins) {
    if(this._csCoins) this._csCoins.querySelector('span').textContent=coins
    this._buildCsGrid(); this._refreshCs()
  }

  showGameOver({ score, coins, distance, best, newBest }) {
    this._hideAll(); this._open(this.mGameOver)
    this._goTitle.textContent = newBest?'🏆 New Best!':'Game Over 💀'
    this._goScore.textContent = score.toLocaleString()
    this._goBest.textContent  = newBest?'🎉 You smashed your record!':`Best: ${best.toLocaleString()}`
    this._goBest.className    = 'panel-best'+(newBest?' new':'')
    this._goCoins.innerHTML   = `<div class="panel-stat-lbl">🪙 COINS</div><div class="panel-stat-val">${coins}</div>`
    this._goDist.innerHTML    = `<div class="panel-stat-lbl">📏 DISTANCE</div><div class="panel-stat-val">${Math.floor(distance)}m</div>`
  }

  renderLeaderboard(entries=[], status='') {
    this._lbStatus.textContent = status
    this._lbList.innerHTML=''
    if(!entries.length) return
    const medals=['lb-gold','lb-silver','lb-bronze']
    entries.forEach((e,i)=>{
      const row=div('lb-row'+(e.isMe?' lb-me':''))
      row.innerHTML=`<div class="lb-rank ${medals[i]||''}">${i+1}</div><div class="lb-name">${e.isMe?'👉 ':''}${e.name}</div><div class="lb-score">${e.score.toLocaleString()}</div>`
      this._lbList.appendChild(row)
    })
  }

  openLeaderboard(entries, status) {
    this.renderLeaderboard(entries, status)
    this._open(this.mLB)
  }
}
