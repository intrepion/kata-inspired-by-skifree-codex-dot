import "./style.css";
import { createRenderer } from "./renderer";
import {
  Run,
  readSave,
  record,
  finishDistance,
  type Mode,
  type Input,
} from "./game";
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("slope");
let saved = readSave(null);
try {
  saved = readSave(localStorage.getItem("rime-run-v1"));
} catch {}
let mode: Mode = "slalom",
  run: Run | null = null,
  last = 0,
  finished = false,
  pointer: number | null = null;
const keys = new Set<string>(),
  holds = new Set<string>();
let audio: AudioContext | null = null,
  lastMessage = "";
const descriptions: Record<Mode, string> = {
  slalom:
    "Thread the pennants. A missed gate costs 5 seconds. Reach the refuge fast.",
  freestyle:
    "Ride striped kickers. Tap hop in air to spin. Center your skis to land and link combos.",
  free: "Take the long route. Explore open powder, jump rocks, and escape to the refuge.",
};
function persist() {
  try {
    localStorage.setItem("rime-run-v1", JSON.stringify(saved));
  } catch {}
}
function settings() {
  $("mute").textContent = saved.mute ? "Sound off" : "Sound on";
  $("motion").textContent = saved.reduced ? "Motion low" : "Motion full";
  $("best").textContent =
    `PERSONAL BEST — ${saved.best[mode].toLocaleString()}`;
}
$("mute").onclick = () => {
  saved.mute = !saved.mute;
  persist();
  settings();
};
$("motion").onclick = () => {
  saved.reduced = !saved.reduced;
  persist();
  settings();
};
settings();
function clear() {
  keys.clear();
  holds.clear();
  pointer = null;
}
function tone() {
  if (saved.mute) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(
      run?.state.immunity ? 150 : 660,
      audio.currentTime,
    );
    o.frequency.exponentialRampToValueAtTime(330, audio.currentTime + 0.12);
    g.gain.setValueAtTime(0.035, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.16);
  } catch {}
}
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-mode]"))
  b.onclick = () => {
    mode = b.dataset.mode as Mode;
    document
      .querySelectorAll("[data-mode]")
      .forEach((el) =>
        el.classList.toggle(
          "selected",
          (el as HTMLElement).dataset.mode === mode,
        ),
      );
    $("mode-info").textContent = descriptions[mode];
    settings();
  };
function start() {
  clear();
  run = new Run(mode, 20261011);
  finished = false;
  lastMessage = "";
  $("panel").hidden = true;
  $("result").hidden = true;
  document.querySelector<HTMLElement>(".hud")!.hidden = false;
  $("touch").hidden = false;
  $("pause").hidden = false;
  $("pause").textContent = "Pause";
  $("footer-help").textContent =
    "← → carve · ↓ brake · ↑ tuck · Space hop/spin · P pause";
  canvas.focus();
}
$("start").onclick = start;
function menu() {
  clear();
  run = null;
  $("panel").hidden = false;
  $("result").hidden = true;
  document.querySelector<HTMLElement>(".hud")!.hidden = true;
  $("touch").hidden = true;
  $("pause").hidden = true;
  $("chase").hidden = true;
  $("callout").textContent = "";
  settings();
}
function pause() {
  if (!run || run.state.status === "result") return;
  run.pause();
  clear();
  $("pause").textContent = run.state.status === "paused" ? "Resume" : "Pause";
  canvas.focus();
  $("callout").textContent =
    run.state.status === "paused" ? "PAUSED • P or Esc to resume" : "";
}
$("pause").onclick = pause;
window.addEventListener("keydown", (e) => {
  if (
    !run ||
    run.state.status === "result" ||
    e.target instanceof HTMLInputElement
  )
    return;
  if (
    e.target instanceof HTMLButtonElement &&
    (e.key === " " || e.key === "Enter")
  )
    return;
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Escape"].includes(
      e.key,
    )
  )
    e.preventDefault();
  if ((e.key.toLowerCase() === "p" || e.key === "Escape") && !e.repeat) {
    pause();
    return;
  }
  if (run?.state.status === "running") {
    if (e.key === " " && !e.repeat) run.jump();
    else keys.add(e.key.toLowerCase());
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  if (run?.state.status === "running") pause();
  clear();
});
canvas.addEventListener("pointerdown", (e) => {
  if (run?.state.status !== "running") return;
  canvas.setPointerCapture(e.pointerId);
  pointer = (e.clientX / canvas.clientWidth - 0.5) * 2;
});
canvas.addEventListener("pointermove", (e) => {
  if (canvas.hasPointerCapture(e.pointerId))
    pointer = (e.clientX / canvas.clientWidth - 0.5) * 2;
});
canvas.addEventListener("pointerup", () => (pointer = null));
canvas.addEventListener("pointercancel", () => (pointer = null));
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-hold]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    holds.add(b.dataset.hold!);
  };
  b.onpointerup = b.onpointercancel = () => holds.delete(b.dataset.hold!);
}
$("hop").onclick = () => run?.jump();

function result() {
  if (!run || finished) return;
  finished = true;
  clear();
  const s = run.state;
  saved = record(saved, s.mode, s.score);
  persist();
  settings();
  $("touch").hidden = true;
  $("pause").hidden = true;
  $("chase").hidden = true;
  $("result").hidden = false;
  $("result").innerHTML =
    `<div class="eyebrow">${s.chase === "escaped" ? "THE MOUNTAIN IS YOURS" : "ONE MORE RUN?"}</div><h2>${s.chase === "escaped" ? "Safe at the refuge." : "A snowy close call."}</h2><p>${s.chase === "escaped" ? "The Rimehorn waves you off. Fresh tracks, warm cocoa." : "The Rimehorn found you! Tuck on the final stretch to keep your speed above 105. Crashes give a recovery shield."}</p><div class="stats"><div><b>${s.score.toLocaleString()}</b><small>POINTS</small></div><div><b>${Math.floor(s.distance)}</b><small>METERS</small></div><div><b>${(s.time + s.misses * 5).toFixed(1)}s</b><small>${s.mode === "slalom" ? "ADJUSTED TIME" : "RUN TIME"}</small></div></div><p>${s.mode === "slalom" ? `${s.gates}/12 gates · ` : ""}${s.tricks} clean landings · ${s.crashes} tumbles<br>Personal best: ${saved.best[s.mode].toLocaleString()}</p><button id="again" class="primary">ANOTHER RUN ↘</button><button id="menu" class="primary">BACK TO THE RIDGE</button>`;
  $("again").onclick = start;
  $("menu").onclick = menu;
  $("callout").textContent = "";
}
const draw = createRenderer(
  canvas,
  () => run,
  () => saved.reduced,
);
function frame(now: number) {
  const dt = last ? Math.max(0, (now - last) / 1000) : 0;
  last = now;
  if (dt > 1 && run?.state.status === "running") pause();
  if (run?.state.status === "running") {
    const input: Input = {
      steer:
        pointer ??
        (keys.has("arrowright") || keys.has("d") ? 1 : 0) -
          (keys.has("arrowleft") || keys.has("a") ? 1 : 0),
      brake: keys.has("arrowdown") || keys.has("s") || holds.has("brake"),
      tuck:
        keys.has("arrowup") ||
        keys.has("w") ||
        keys.has("shift") ||
        holds.has("tuck"),
      jump: false,
    };
    run.advance(input, dt);
    const s = run.state;
    $("score").textContent = s.score.toLocaleString();
    $("speed").textContent = `${Math.round(s.speed)}`;
    $("goal-label").textContent = mode === "slalom" ? "GATES" : "TO REFUGE";
    $("goal").textContent =
      mode === "slalom"
        ? `${s.gates} / 12`
        : `${Math.ceil(finishDistance(mode) - s.distance)} m`;
    $("progress").style.width = `${(s.distance / finishDistance(mode)) * 100}%`;
    $("callout").textContent = s.messageTime > 0 ? s.message : "";
    if (s.message !== lastMessage) {
      lastMessage = s.message;
      tone();
    }
    $("chase").hidden = s.chase !== "active" && s.chase !== "warning";
    $("chase").querySelector("span")!.textContent =
      s.chase === "warning"
        ? "Tuck! The chase starts soon."
        : `${Math.ceil(s.gap)} m behind • tuck!`;
    $("chase").querySelector("meter")!.value = s.gap;
    if (s.status === "result") result();
  }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
