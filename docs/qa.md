# Verification evidence

## Automated
16 tests through Run construction/advance/jump/pause, seeded terrain and save commands. Covers 30/60 Hz equivalence, speed controls, boundaries, safe start and gate exclusion zones, multiple fast crossings exactly once, held jump edge, zero/one/two-spin scoring, airborne rock clearance, tree collision, recovery immunity, tilted landing, chase recovery gap protection, each mode refuge, caught result, pristine restart, inactive command isolation, corrupt save records and best monotonicity. Full test, strict typecheck and production build pass. Dependency audit: zero vulnerabilities.

TDD evidence: initial pause test failed on missing Run then passed. Review-discovered zero-spin landing test failed expected 100/actual 0 then passed after fix. Other tests were added as regression coverage after engine implementation; this is not full strict TDD.

## Mac Chrome, normal visible controls
- Slalom: keyboard tuck/carve/hop and pause; result 2400m, 2/12 gates, 2 crashes, score 546. Escape outcome and high score persisted on reload.
- Freestyle: keyboard hop/spin produced 250 points; ramp air seen; subsequent clean landing and crash score decrease observed. Warning/pursuit meter seen. Deliberately braking led to caught result at 2102m, score 250, 2 clean landings, 2 crashes. Resume via button followed by keyboard worked.
- Free ski at 390×844: keyboard tuck, pursuit meter, visible hop button click showing AIR; refuge at 3200m, 900 points, one clean landing, no crashes. Best 900 persisted; subsequent lower score 800 did not replace it. Space on Another Run restarted with score 0 and fresh distance after the final input fix.
- Motion preference survived reload. Started muted; optional sound is synthesized using Web Audio. Audio output was not measured.
- Desktop and 390×844 responsive screenshots visually inspected. Mobile coverage is desktop Chrome viewport emulation with pointer/keyboard inputs, not a physical touch device. Pointer hold automation did not produce reliable timing evidence, so continuous physical touch braking/tucking remains unverified. Input handlers are present and ordinary keyboard speed commands passed.
- No game-origin errors observed in collected console entries; unrelated installed Chrome extension warnings were present.

## Independent reviews
Standards and Spec reviewers independently reviewed 4ea3ce1...792232f and re-reviewed f90fba4. Fixed all concrete findings: elapsed time discarded by frame clamp, gameplay button focus blocking keys, zero-spin landing reward, and result buttons' native Space activation. Renderer extracted to reduce mixed responsibilities. Final native Space restart was verified in Chrome.

## Delivery boundaries
Local private clone exists under 2026-10-11/task; previous 2026-10-10 repositories and ports 5173–5184 untouched. Localhost port 5185 is session-only; no public hosting, login/boot service, security changes, or paid service. Sidebar project registration is not claimed: app tools expose no supported registration action for an arbitrary cloned folder. Open the folder manually if desired. Screenshots in docs/screenshots record QA states; some were captured before the final result-label refinement.
