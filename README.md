# 🚌 Danfo Dash

> *Survive the Lagos Rush* — a 3D endless runner built for the Mavuly Hackathon 2026.

[![Live Demo](https://img.shields.io/badge/Play%20Now-Live%20Demo-FFD600?style=for-the-badge)](https://danfo-dash.vercel.app)
[![Built with Three.js](https://img.shields.io/badge/Three.js-0.187-black?style=for-the-badge&logo=threedotjs)](https://threejs.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## 🎮 Game Concept

Danfo Dash is a fast-paced 3D endless runner set on the vibrant, chaotic streets of Lagos, Nigeria. You play as a runner dodging iconic yellow Danfo minibuses, Keke NAPEPs, BRT buses, motorbikes, and other Lagos traffic as you sprint down a busy Lagos road.

The game draws inspiration from real Lagos street life — complete with hawkers, pedestrians, palm trees, colourful buildings, a pedestrian bridge, and the unmistakable sights and sounds of the city.

---

## ✨ Features

- **Full 3D environment** built with Three.js — Lagos street with buildings, palm trees, street lights, kiosks, pedestrians and vehicles
- **Three-lane gameplay** — dodge left, right, jump, and slide to survive
- **Iconic Lagos vehicles** — Yellow Danfo buses, Keke NAPEPs, BRT buses, motorbikes and cars
- **80 pedestrians** lining both sides of the road with walking animations
- **Power-ups** — Shield 🛡, Magnet 🧲, Boost ⚡
- **Coin collection** system with unlockable characters
- **6 playable characters** — Tunde, Amaka, Emeka, Ngozi, Chidi, Funke
- **Original music** composed using Suno AI — menu theme and gameplay loop
- **9 original sound effects** — jump, slide, coin, collision, power-up, game over and more
- **Lagos traffic ambience** audio
- **Leaderboard** backed by Firebase Realtime Database
- **Responsive design** — optimised for both desktop and mobile portrait/landscape
- **Adaptive camera** — maintains correct framing across all screen sizes
- **Yellow splash screen** with animated entrance

---

## 🛠 Technologies

| Technology | Purpose |
|------------|---------|
| [Three.js](https://threejs.org) v0.187 | 3D rendering engine |
| [Vite](https://vitejs.dev) v8.x | Build tool and dev server |
| Vanilla JavaScript (ES Modules) | Game logic, UI, controls |
| CSS3 | Responsive UI, glassmorphism, animations |
| HTML5 Web Audio API | Music and sound effects |
| Firebase Realtime Database | Online leaderboard |
| [Suno AI](https://suno.com) | Original background music generation |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/danfo-dash.git
cd danfo-dash

# Install dependencies
npm install
```

### Local Development

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

To test on a phone on the same network:

```bash
npm run dev -- --host
```

The terminal will show a Network URL (e.g. `http://192.168.x.x:5173`) — open that on your phone.

### Production Build

```bash
npm run build
```

Output is placed in the `dist/` folder. Preview the production build locally:

```bash
npm run preview
```

---

## 🎯 Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Move Left | ← Arrow or A | Swipe Left |
| Move Right | → Arrow or D | Swipe Right |
| Jump | Space or ↑ Arrow or W | Swipe Up |
| Slide | ↓ Arrow or S | Swipe Down |
| Pause | Escape or P | Pause Button |

---

## 📁 Project Structure

```
danfo-dash/
├── index.html              # App entry point
├── vite.config.js          # Vite configuration
├── package.json
│
├── public/
│   ├── audio/              # All audio files (MP3 + WAV)
│   │   ├── danfo_dash_menu_theme.mp3
│   │   ├── danfo_dash_gameplay_loop.mp3
│   │   └── sfx_*.wav       # Sound effects
│   ├── favicon.svg
│   └── icons.svg
│
└── src/
    ├── main.js             # App entry — splash screen, game bootstrap
    ├── style.css           # Complete stylesheet (UI, HUD, responsive)
    ├── config.js           # Central game constants
    ├── assets.js           # 3D mesh factories (vehicles, coins, power-ups)
    │
    ├── assets/             # Static images
    │   ├── danfo.png.jpeg  # Danfo bus reference image
    │   ├── lagos.png.jpeg  # Lagos street reference image
    │   └── hero.png
    │
    └── game/
        ├── Game.js         # Main game orchestrator and RAF loop
        │
        ├── world/
        │   └── SceneBuilder.js   # 3D scene, road, buildings, camera
        │
        ├── entities/
        │   ├── Player.js         # Player character movement and physics
        │   ├── Traffic.js        # Vehicle spawning and pooling
        │   ├── Coins.js          # Coin system with object pooling
        │   └── PowerUps.js       # Power-up system
        │
        ├── systems/
        │   ├── Audio.js          # Web Audio API music and SFX manager
        │   ├── Controls.js       # Keyboard and touch/swipe input
        │   └── Storage.js        # Local storage + Firebase leaderboard
        │
        └── ui/
            └── UI.js             # All UI screens and HUD (DOM-based)
```

---

## 🎵 Audio Credits

Background music was generated using [Suno AI](https://suno.com):
- `danfo_dash_menu_theme.mp3` — Menu theme
- `danfo_dash_gameplay_loop.mp3` — Gameplay loop

Sound effects are original WAV recordings:
- `sfx_coin_crystal.wav`, `sfx_jump_whoosh.wav`, `sfx_slide.wav`
- `sfx_collision.wav`, `sfx_powerup.wav`, `sfx_game_over.wav`
- `sfx_victory.wav`, `sfx_ui_click.wav`
- `sfx_lagos_traffic_ambience.wav`

---

## 🏙 About Lagos

Danfo Dash celebrates Lagos, Nigeria — one of Africa's most dynamic and energetic cities. The yellow Danfo minibus is an iconic part of Lagos street culture, and the game pays homage to the hustle, colour, and energy of everyday Lagos life.

---

## 👩‍💻 Development

Built for the **Mavuly Hackathon 2026**.

The game uses a treadmill world model — the player stays stationary at world Z=0 while the entire environment scrolls toward them. All vehicles, coins, power-ups and scenery use object pooling for performance. The Three.js camera uses an adaptive FOV system that maintains correct framing across portrait phones, landscape phones, tablets and desktops.

---

## 📄 Licence

MIT — feel free to use, modify and build on this project.

---

*Made with ❤️ and Lagos vibes 🚌*
