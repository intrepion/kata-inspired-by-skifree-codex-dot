# Rime & Run
An original overhead skiing arcade game in Juniper Basin. Carve through pennants, link ramp spins, or take the scenic route before the playful Rimehorn chase. All art is drawn locally and audio is synthesized; no copied sprites, branding, remote assets or paid services.

## Play locally
Node 24 recommended. `npm ci`, then `npm run dev` and open http://127.0.0.1:5185. The server binds localhost with strict port selection; ports 5173–5184 are untouched. This is a session-only development server, with no boot/login registration. Restart that command after it stops or the Mac restarts.

Arrow keys / WASD carve and control speed. Up/W/Shift tucks, down/S brakes. Space hops; release and tap again in air to spin, maximum two spins. Center steering before landing. Drag the snow to steer; touch buttons provide brake, tuck, hop/spin. P or Esc pauses; leaving the window pauses automatically. Sound starts muted. Motion setting removes trailing/scarf movement. Best scores/settings stay in this browser, with safe fallback if storage is unavailable.

Slalom: pass 12 gates, missed gates add 5s, time bonus at refuge. Freestyle: striped ramps launch longer air for spins and up to ×4 landing combos. Free ski: longer sparse course and distance reward. Trees block jumps; rocks can be cleared at altitude. Crashes lose 100 points and grant a 2.5s shield. Rimehorn warning precedes pursuit by 150m. Tuck above 105 to increase the gap; brake and it closes. Reach the refuge to escape; caught runs can restart.

## Validation
`npm test`, `npm run typecheck`, `npm run build`, `npm audit --audit-level=high`.
See [spec](docs/spec.md), [glossary](CONTEXT.md), [workflow and research](docs/workflow.md), and [QA evidence](docs/qa.md).
