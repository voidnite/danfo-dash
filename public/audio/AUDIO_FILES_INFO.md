# Danfo Dash Audio Files

This directory contains all original audio files for the game.

## Files Present (13 total)

### Music (Looped Background) - **NEW SUNO AI GENERATED**
- `danfo_dash_menu_theme.mp3` - Plays during menu screens (Suno AI generated)
- `danfo_dash_gameplay_loop.mp3` - Plays during active gameplay (Suno AI generated)

### Legacy Music Files (Replaced)
- `danfo_dash_menu_theme.wav` - Original menu theme (no longer used)
- `danfo_dash_gameplay_loop.wav` - Original gameplay theme (no longer used)

### Sound Effects (One-shot)
- `sfx_coin_crystal.wav` - Coin collection sound
- `sfx_jump_whoosh.wav` - Jump action sound
- `sfx_slide.wav` - Slide action sound
- `sfx_collision.wav` - Obstacle collision sound
- `sfx_powerup.wav` - Power-up collection sound
- `sfx_game_over.wav` - Game over sound
- `sfx_victory.wav` - Victory sound (reserved for future use)
- `sfx_ui_click.wav` - UI button click sound

### Ambience (Looped, Quiet)
- `sfx_lagos_traffic_ambience.wav` - Background traffic sounds during gameplay

## Technical Details

- **Music Format:** MP3 (compressed, Suno AI generated)
- **SFX Format:** WAV (uncompressed, original recordings)
- **Loading:** All files are preloaded during the game's loading screen
- **Access:** Files are loaded via Web Audio API from `/audio/` path
- **Browser Support:** Works on all modern browsers with Web Audio API
- **Mobile:** Compatible with Android/iOS browsers and Capacitor

## Integration

These files are automatically loaded by `src/game/systems/Audio.js` when the game initializes.

The audio system provides:
- Separate volume controls for music, SFX, and ambience
- Mute/unmute functionality
- Graceful handling of missing files
- Browser autoplay policy compliance
- Sound overlap support (multiple SFX can play simultaneously)

See `/AUDIO_TESTING_GUIDE.md` for complete testing instructions.
