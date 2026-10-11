# Rime & Run acceptance specification
Delegated recommended decisions: original canvas art, TypeScript/Vite, overhead downhill, fixed 60 Hz simulation; no external assets or accounts. Three modes share steering but have different terrain and goals.
- Slalom: 12 alternating gates over 2400 m. Each passed gate scores 150 × combo (cap 4); misses reset combo and add 5 seconds. Final score includes a time bonus.
- Freestyle: ramps every 180 m on a 2400 m descent. Space hops; Space pressed again airborne banks one spin (maximum 2); land facing within 0.65 radians for clean landing. Ramp air lasts 1.35 seconds; manual hops 0.65. Clean landings award 100 + 150 per spin, multiplied by combo; failed landings crash.
- Free ski: sparse terrain, 3200 m scenic descent, distance points and optional tricks. All modes culminate in a Rimehorn escape segment.
- Left/right or A/D carve smoothly; down/S brakes; up/W/Shift tucks to accelerate. Pointer position steers; visible hold buttons support braking/tuck and tap hop/spin. Edges keep player on piste.
- Trees cannot be jumped; rocks can be cleared above 10 altitude. Swept crossings must detect gates/ramps/obstacles at any supported speed exactly once.
- Crash loses 100 points and combo, slows skier, grants 2.5 s collision immunity. Chase cannot catch during recovery. No obstacles before 200 m; terrain preserves a clear corridor near the course line and around every gate/ramp.
- Warning at 1750 m (2550 free ski); chase at 1900 (2700 free ski). Gap starts at 220 m. Tuck speed outruns creature, braking loses ground; refuge escapes, gap zero produces caught result. Exact rules visible before starting.
- Pause freezes all run time, clears inputs; menu/result keyboard input cannot affect a run. Restart resets all transient state; same seed produces identical terrain.
- Run ends with clear score, distance, gates/tricks/crashes and restart/menu. Persist per-mode best and mute/reduced-motion preferences; malformed storage cannot break play.
- Responsive screen with lookahead, keyboard focus, text labels, mute/reduced-motion and no forced sound.
## Agreed public test seams
Run constructor + advance(input, elapsed), terrain generation, save parsing/update. These seams are accepted under user's explicit autonomous recommended-choice delegation. Browser QA covers renderer/input integration separately.
