import { Run, finishDistance, type Terrain } from "./game";
export function createRenderer(
  canvas: HTMLCanvasElement,
  getRun: () => Run | null,
  getReduced: () => boolean,
) {
  const ctx = canvas.getContext("2d")!;
  let width = 0,
    height = 0,
    scale = 1;
  const previewObjects = new Run("freestyle", 20261011).objects;
  function resize() {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width / 800, 1.1);
  }
  window.addEventListener("resize", resize);
  resize();
  function ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
  ) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function line(points: number[], color: string, w: number) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < points.length; i += 2)
      i
        ? ctx.lineTo(points[i], points[i + 1])
        : ctx.moveTo(points[i], points[i + 1]);
    ctx.stroke();
  }
  function tree(x: number, y: number, size = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ellipse(9, 5, 23, 7, "#bdd3ca88");
    line([0, 0, 0, -48], "#6d7760", 7);
    for (let i = 0; i < 3; i++) {
      const top = -80 + i * 20;
      ctx.fillStyle = i % 2 ? "#376b65" : "#26565a";
      ctx.beginPath();
      ctx.moveTo(0, top);
      ctx.lineTo(-23 + i * 3, top + 37);
      ctx.lineTo(23 - i * 3, top + 37);
      ctx.closePath();
      ctx.fill();
      line(
        [-13 + i * 2, top + 23, 0, top + 15, 13 - i * 2, top + 23],
        "#e7f0dc",
        4,
      );
    }
    ctx.restore();
  }
  function skier(
    x: number,
    y: number,
    angle: number,
    air: number,
    ghost = false,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ellipse(5, 4, 17, 6, "#759b8b44");
    ctx.translate(0, -air);
    ctx.rotate(-angle);
    line([-7, -2, -7, 22], "#ee8550", 4);
    line([7, -2, 7, 22], "#ee8550", 4);
    line([-16, -15, -21, 11, 16, -15, 21, 11], "#638d86", 2);
    ctx.fillStyle = ghost ? "#719d8c" : "#d77240";
    ctx.fillRect(-10, -24, 20, 19);
    line([-5, -7, -7, 8, 5, -7, 7, 8], "#163b48", 5);
    ellipse(0, -30, 9, 9, ghost ? "#e3d8b0" : "#163e49");
    line([-7, -29, 7, -29], "#e9f1db", 3);
    if (!ghost && !getReduced()) {
      line([0, -23, 14, -20, 24, -29], "#e6ba56", 4);
    }
    ctx.restore();
  }
  function drawObject(o: Terrain, y: number) {
    const x = width / 2 + o.x * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (o.kind === "tree") tree(0, 0);
    else if (o.kind === "rock") {
      ellipse(8, 3, 25, 8, "#a9c6ba55");
      ctx.fillStyle = "#839f9c";
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-12, -20);
      ctx.lineTo(10, -26);
      ctx.lineTo(24, -8);
      ctx.lineTo(19, 3);
      ctx.closePath();
      ctx.fill();
      line([-12, -20, 10, -26, 20, -12], "#fffdf1", 5);
    } else if (o.kind === "gate") {
      for (const side of [-1, 1]) {
        line(
          [(side * o.width) / 2, 0, (side * o.width) / 2, -42],
          "#406e72",
          3,
        );
        ctx.fillStyle = side < 0 ? "#e67a49" : "#3e8983";
        ctx.beginPath();
        ctx.moveTo((side * o.width) / 2, -43);
        ctx.lineTo((side * o.width) / 2 + side * 25, -36);
        ctx.lineTo((side * o.width) / 2, -29);
        ctx.fill();
      }
      line([-o.width / 2, 0, o.width / 2, 0], "#bdd5c277", 2);
    } else {
      ctx.fillStyle = "#b8d2c5";
      ctx.beginPath();
      ctx.moveTo(-55, 5);
      ctx.lineTo(55, 5);
      ctx.lineTo(48, -19);
      ctx.lineTo(-48, -19);
      ctx.closePath();
      ctx.fill();
      for (let i = -35; i <= 35; i += 18) line([i, 2, i, -16], "#e78852", 8);
      line([-48, -20, 48, -20], "#fffdf1", 3);
    }
    ctx.restore();
  }
  function draw() {
    const run = getRun();
    ctx.fillStyle = "#edf3e9";
    ctx.fillRect(0, 0, width, height);
    const distance = run?.state.distance ?? 350;
    const py = Math.max(180, height * 0.31);
    const center = width / 2;
    // Groomed powder with quiet contour lines, never distracting visual shake.
    for (let row = 0; row < 22; row++) {
      const y =
        (((row * 85 - distance * 0.65) % (height + 85)) + height + 85) %
        (height + 85);
      line(
        [0, y, width * 0.3, y + 20, width * 0.7, y - 10, width, y + 10],
        "#dfe9dd",
        1,
      );
    }
    const left = center - 370 * scale,
      right = center + 370 * scale;
    ctx.fillStyle = "#d4e4d7";
    ctx.fillRect(0, 0, Math.max(0, left), height);
    ctx.fillRect(right, 0, width - right, height);
    line([left, 0, left, height], "#9bbdb077", 2);
    line([right, 0, right, height], "#9bbdb077", 2);
    for (let i = 0; i < 9; i++) {
      const y =
        (((i * 160 - distance * 0.55) % (height + 180)) + height + 180) %
        (height + 180);
      tree(left - 35 * scale, y, 0.9 * scale);
      tree(right + 40 * scale, y + 65, 1.2 * scale);
    }
    const objects = run?.objects ?? previewObjects;
    for (const o of objects) {
      const y = py + (o.y - distance) * 0.65 * scale;
      if (y > -100 && y < height + 100) drawObject(o, y);
    }
    if (run) {
      const s = run.state;
      const x = center + s.x * scale;
      ctx.globalAlpha = s.immunity > 0 ? 0.6 : 1;
      if (!getReduced()) {
        line(
          [
            x - 6 * scale,
            py + 14,
            x - 9 * scale,
            py - 55,
            x - 12 * scale,
            py - 95,
          ],
          "#a7c4b155",
          2,
        );
        line(
          [x + 6 * scale, py + 14, x + 3 * scale, py - 55, x, py - 95],
          "#a7c4b155",
          2,
        );
      }
      skier(x, py, s.angle, run.altitude);
      ctx.globalAlpha = 1;
      if (s.chase === "active") {
        const cy = py - Math.min(140, s.gap) * 0.65;
        ctx.save();
        ctx.translate(x + Math.sin(s.time) * 30, cy);
        ctx.scale(scale, scale);
        ellipse(0, 0, 26, 18, "#7e9991");
        ellipse(0, -15, 24, 24, "#d6dbbb");
        line(
          [-17, -25, -28, -47, -12, -35, 17, -25, 28, -47, 12, -35],
          "#416865",
          5,
        );
        ellipse(-8, -19, 3, 4, "#173f4c");
        ellipse(8, -19, 3, 4, "#173f4c");
        line([-8, -6, 8, -6], "#617f70", 3);
        ctx.restore();
      }
      const fy = py + (finishDistance(s.mode) - distance) * 0.65 * scale;
      if (fy < height + 150) {
        line([left, fy, right, fy], "#d57c48", 5);
        ctx.fillStyle = "#214e53";
        ctx.fillRect(
          center - 65 * scale,
          fy + 25 * scale,
          130 * scale,
          60 * scale,
        );
        ctx.fillStyle = "#dbe4c9";
        ctx.beginPath();
        ctx.moveTo(center - 85 * scale, fy + 25 * scale);
        ctx.lineTo(center, fy - 15 * scale);
        ctx.lineTo(center + 85 * scale, fy + 25 * scale);
        ctx.fill();
        ctx.fillStyle = "#e6b564";
        ctx.fillRect(
          center - 10 * scale,
          fy + 45 * scale,
          20 * scale,
          40 * scale,
        );
      }
    } else {
      skier(width * 0.78, height * 0.46, -0.35, 0);
      ctx.fillStyle = "#7e9b8a";
      ctx.font = "10px system-ui";
      ctx.fillText("THE REFUGE IS DOWN THERE ↘", width * 0.67, height * 0.65);
    }
  }

  return draw;
}
