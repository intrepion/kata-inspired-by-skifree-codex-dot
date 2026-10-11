import { expect, test } from "vitest";
import { Run } from "./game";
test("a paused run does not travel or consume time", () => {
  const r = new Run("slalom", 7);
  r.pause();
  r.advance({ steer: 0, tuck: true }, 1);
  expect(r.state.distance).toBe(0);
  expect(r.state.time).toBe(0);
});
import { terrain, readSave, record } from "./game";
test("terrain is seeded, starts safely and clears objectives", () => {
  const a = terrain("slalom", 42);
  expect(a).toEqual(terrain("slalom", 42));
  expect(a).not.toEqual(terrain("slalom", 43));
  expect(a.every((o) => o.y >= 200 && Math.abs(o.x) <= 340)).toBe(true);
  for (const gate of a.filter((o) => o.kind === "gate"))
    expect(
      a
        .filter((o) => o.kind === "tree" || o.kind === "rock")
        .some(
          (o) => Math.abs(o.x - gate.x) < 110 && Math.abs(o.y - gate.y) < 85,
        ),
    ).toBe(false);
});
test("tucking accelerates and braking slows while boundaries hold", () => {
  const r = new Run("free", 4);
  for (let i = 0; i < 5; i++) r.advance({ steer: 1, tuck: true }, 1);
  expect(r.state.x).toBeLessThanOrEqual(340);
  expect(r.state.speed).toBeGreaterThan(140);
  const before = r.state.distance;
  r.advance({ steer: 0, brake: true }, 1);
  expect(r.state.speed).toBeLessThan(60);
  expect(r.state.distance).toBeGreaterThan(before);
});
test("equal elapsed time produces same movement at different display rates", () => {
  const a = new Run("free", 1),
    b = new Run("free", 1);
  for (let i = 0; i < 600; i++) a.advance({ steer: 0.1 }, 1 / 60);
  for (let i = 0; i < 300; i++) b.advance({ steer: 0.1 }, 1 / 30);
  expect(a.state).toEqual(b.state);
});
test("crossing a gate scores once and missed gates reset combo", () => {
  const r = new Run("slalom", 1);
  for (let i = 0; i < 260; i++) r.advance({ steer: -0.22, tuck: true }, 1 / 60);
  expect(r.state.gates + r.state.misses).toBeGreaterThan(0);
  const count = r.state.gates + r.state.misses;
  r.pause();
  r.advance({ steer: 0 }, 1);
  expect(r.state.gates + r.state.misses).toBe(count);
});
test("holding hop is one launch; second press banks a spin and landing scores", () => {
  const r = new Run("freestyle", 1);
  r.advance({ steer: 0, jump: true }, 0.1);
  const air = r.state.air;
  r.advance({ steer: 0, jump: true }, 0.1);
  expect(r.state.air).toBeLessThan(air);
  expect(r.state.spins).toBe(0);
  r.advance({ steer: 0 }, 1 / 60);
  r.advance({ steer: 0, jump: true }, 1 / 60);
  r.advance({ steer: 0 }, 0.6);
  expect(r.state.tricks).toBe(1);
  expect(r.state.score).toBe(250);
});
test("each mode can reach the refuge and restart is pristine", () => {
  for (const mode of ["slalom", "freestyle", "free"] as const) {
    const r = new Run(mode, 1);
    for (let i = 0; i < 60 && r.state.status === "running"; i++)
      r.advance({ steer: 0, tuck: true }, 1);
    expect(r.state.chase).toBe("escaped");
    expect(r.state.status).toBe("result");
    const fresh = new Run(mode, 1);
    expect(fresh.state.score).toBe(0);
    expect(fresh.state.distance).toBe(0);
    expect(fresh.state.chase).toBe("sleeping");
  }
});
test("braking during the signaled chase can be caught", () => {
  const r = new Run("free", 1);
  while (r.state.chase === "sleeping" || r.state.chase === "warning")
    r.advance({ steer: 0, tuck: true }, 0.1);
  expect(r.state.gap).toBeGreaterThan(200);
  for (let i = 0; i < 20 && r.state.status === "running"; i++)
    r.advance({ steer: 0, brake: true }, 1);
  expect(r.state.chase).toBe("caught");
});
test("corrupt records and partial settings are safe and best never decreases", () => {
  expect(readSave("{broken").best.slalom).toBe(0);
  expect(readSave('{"best":{"slalom":-4,"free":12},"mute":"no"}')).toEqual({
    best: { slalom: 0, freestyle: 0, free: 12 },
    mute: true,
    reduced: false,
  });
  const s = record(readSave(null), "slalom", 500);
  expect(record(s, "slalom", 20).best.slalom).toBe(500);
  expect(record(s, "free", NaN).best.free).toBe(0);
});
test("a clean jump without spins earns its base landing reward", () => {
  const r = new Run("freestyle", 3);
  r.advance({ steer: 0, jump: true }, 1 / 60);
  r.advance({ steer: 0 }, 0.8);
  expect(r.state.score).toBe(100);
  expect(r.state.combo).toBe(1);
});
test("fast gate crossings award exactly once through public course commands", () => {
  const r = new Run("slalom", 1, [
    { id: 0, kind: "gate", x: 0, y: 5, width: 100 },
    { id: 1, kind: "gate", x: 0, y: 10, width: 100 },
  ]);
  r.advance({ steer: 0, tuck: true }, 1);
  expect(r.state.gates).toBe(2);
  expect(r.state.score).toBe(450);
  r.advance({ steer: 0, tuck: true }, 1);
  expect(r.state.gates).toBe(2);
  expect(r.state.score).toBe(450);
});
test("air clears rocks but trees crash and immunity prevents repeated collisions", () => {
  const rocks = new Run("free", 1, [
    { id: 0, kind: "rock", x: 0, y: 15, width: 18 },
  ]);
  rocks.advance({ steer: 0, jump: true }, 0.4);
  expect(rocks.state.crashes).toBe(0);
  const trees = new Run("free", 1, [
    { id: 0, kind: "tree", x: 0, y: 15, width: 18 },
    { id: 1, kind: "tree", x: 0, y: 20, width: 18 },
  ]);
  trees.advance({ steer: 0, jump: true }, 1);
  expect(trees.state.crashes).toBe(1);
  expect(trees.state.immunity).toBeGreaterThan(0);
});
test("a tilted landing tumbles and drops combo", () => {
  const r = new Run("freestyle", 1, []);
  r.advance({ steer: 1, jump: true }, 1 / 60);
  r.advance({ steer: 1 }, 0.8);
  expect(r.state.crashes).toBe(1);
  expect(r.state.combo).toBe(0);
});
test("two spins on ramp land for 400 base points", () => {
  const r = new Run("freestyle", 1, [
    { id: 0, kind: "ramp", x: 0, y: 5, width: 100 },
  ]);
  r.advance({ steer: 0 }, 0.1);
  r.advance({ steer: 0, jump: true }, 1 / 60);
  r.advance({ steer: 0 }, 1 / 60);
  r.advance({ steer: 0, jump: true }, 1 / 60);
  r.advance({ steer: 0 }, 1);
  r.advance({ steer: 0 }, 0.5);
  expect(r.state.score).toBe(400);
});
test("crash shields preserve chase gap during recovery", () => {
  const r = new Run("free", 1, [
    { id: 0, kind: "tree", x: 0, y: 2740, width: 20 },
  ]);
  while (r.state.distance < 2750) r.advance({ steer: 0, tuck: true }, 1 / 60);
  expect(r.state.immunity).toBeGreaterThan(1);
  const gap = r.state.gap;
  r.advance({ steer: 0, brake: true }, 0.5);
  expect(r.state.gap).toBe(gap);
});
test("jump command ignores pause and completed results", () => {
  const r = new Run("free", 1, []);
  r.pause();
  r.jump();
  expect(r.state.air).toBe(0);
  r.pause();
  r.jump();
  r.jump();
  expect(r.state.spins).toBe(1);
  for (let i = 0; i < 30 && r.state.status === "running"; i++)
    r.advance({ steer: 0, tuck: true }, 1);
  const state = { ...r.state };
  r.jump();
  r.advance({ steer: 1, jump: true }, 1);
  expect(r.state).toEqual(state);
});
