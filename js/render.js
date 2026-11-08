"use strict";
(function (B) {
  const C = "#111d1b";
  function poly(c, pts, fill, stroke = C, lw = 2) {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.lineJoin = "round";
      c.stroke();
    }
  }
  function ellipse(c, x, y, rx, ry, color, stroke = null, lw = 2) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, B.TAU);
    c.fillStyle = color;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw;
      c.stroke();
    }
  }
  function line(c, pts, color, lw = 2) {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p)));
    c.strokeStyle = color;
    c.lineWidth = lw;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke();
  }
  function box(c, x, y, w, h, color, stroke = null) {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.strokeRect(x, y, w, h);
    }
  }
  function label(
    c,
    text,
    x,
    y,
    size = 11,
    color = "#bec9ad",
    align = "center",
  ) {
    c.font = `bold ${size}px Arial`;
    c.textAlign = align;
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  function badge(c, x, y, r = 5) {
    ellipse(c, x, y, r, r, "#111b18", "#b0f961", 1.5);
    poly(
      c,
      [
        [x - r * 0.5, y - r * 0.65],
        [x + r * 0.5, y - r * 0.65],
        [x, y],
        [x + r * 0.5, y + r * 0.65],
        [x - r * 0.5, y + r * 0.65],
        [x, y],
      ],
      "#c6ff82",
      null,
    );
  }
  function limb(c, pts, color, width = 10) {
    line(c, pts, C, width + 4);
    line(c, pts, color, width);
  }
  B.art = { poly, ellipse, line, box, label, badge };
  class Renderer {
    constructor(g) {
      this.g = g;
      this.c = g.canvas.getContext("2d");
    }
    draw() {
      const g = this.g,
        c = this.c,
        v = g.view;
      c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      c.clearRect(0, 0, v.w, v.h);
      if (g.mode === "menu") {
        this.menu();
        return;
      }
      c.fillStyle = "#192821";
      c.fillRect(0, 0, v.w, v.h);
      c.save();
      let sx = (Math.random() - 0.5) * g.shake,
        sy = (Math.random() - 0.5) * g.shake;
      c.translate(v.w / 2 + sx, v.h / 2 + sy);
      c.scale(g.camera.zoom, g.camera.zoom);
      c.translate(-g.camera.x, -g.camera.y);
      this.world();
      c.restore();
      if (g.flash > 0) {
        c.fillStyle = `rgba(180,255,140,${g.flash * 0.45})`;
        c.fillRect(0, 0, v.w, v.h);
      }
      if (g.transition > 0) {
        c.fillStyle = `rgba(8,16,12,${g.transition})`;
        c.fillRect(0, 0, v.w, v.h);
      }
    }
    menu() {
      const g = this.g,
        c = this.c,
        { w, h } = g.view,
        t = g.clock;
      box(c, 0, 0, w, h, "#111c17");
      const glow = c.createRadialGradient(
        w * 0.72,
        h * 0.48,
        10,
        w * 0.72,
        h * 0.48,
        w * 0.58,
      );
      glow.addColorStop(0, "#4d6a2c");
      glow.addColorStop(0.5, "#243a20");
      glow.addColorStop(1, "#0e1913");
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
      c.save();
      c.translate(w * 0.72, h * 0.49);
      c.rotate(-0.16);
      for (let j = 0; j < 5; j++) {
        const r = 100 + j * 75;
        c.strokeStyle = j % 2 ? "#8eb85922" : "#a6dc6722";
        c.lineWidth = j === 3 ? 22 : 1;
        c.beginPath();
        c.arc(0, 0, r, t * 0.03 + j, 0.2 + Math.PI * 1.8 + t * 0.03 + j);
        c.stroke();
      }
      for (let j = 0; j < 72; j++) {
        const a = (j * B.TAU) / 72 + t * 0.018,
          r = 300;
        c.strokeStyle = j % 6 ? "#a2cb6033" : "#b2df7b66";
        c.lineWidth = j % 6 ? 1 : 2;
        line(
          c,
          [
            [Math.cos(a) * r, Math.sin(a) * r],
            [
              Math.cos(a) * (r + (j % 6 ? 5 : 15)),
              Math.sin(a) * (r + (j % 6 ? 5 : 15)),
            ],
          ],
          c.strokeStyle,
          c.lineWidth,
        );
      }
      c.globalAlpha = 0.045;
      poly(
        c,
        [
          [-185, -185],
          [185, -185],
          [0, 0],
          [185, 185],
          [-185, 185],
          [0, 0],
        ],
        "#d5ff9a",
        null,
      );
      c.restore();
      // Architectural silhouettes establish Bellwood behind the hero illustration.
      for (let j = 0; j < 16; j++) {
        const x = w * 0.35 + j * w * 0.05,
          hh = 55 + (Math.sin(j * 3.6) * 0.5 + 0.5) * 100;
        box(c, x, h * 0.88 - hh, w * 0.044, hh, "#0e1c1466");
        for (let k = 0; k < 3; k++)
          box(c, x + 9, h * 0.88 - hh + 15 + k * 22, 3, 8, "#91ae4340");
      }
      const s = Math.min(w / 1400, h / 900);
      c.save();
      c.globalAlpha = 0.28;
      B.drawActor(c, "heat", w * 0.54, h * 0.68, s * 4.4, {
        time: t,
        shadow: false,
      });
      c.globalAlpha = 0.22;
      B.drawActor(c, "four", w * 0.87, h * 0.66, s * 5.1, {
        time: t,
        shadow: false,
      });
      c.restore();
      c.save();
      c.translate(w * 0.722, h * 0.86);
      c.rotate(-0.055);
      const ss = s * 5.9;
      c.shadowColor = "#b2fa5c33";
      c.shadowBlur = 40;
      B.drawActor(c, "ben", 0, Math.sin(t) * 2, ss, {
        time: t,
        shadow: false,
        pose: "hero",
      });
      c.shadowBlur = 0;
      c.restore();
      // Green pulse radiates from the wrist, with restrained sparks.
      const bx = w * 0.722 - 5 * 0.82 * ss,
        by = h * 0.86 - 58 * 0.82 * ss;
      const wrist = c.createRadialGradient(bx, by, 0, bx, by, 75 * s);
      wrist.addColorStop(0, "#d5ffad70");
      wrist.addColorStop(0.2, "#aaff6333");
      wrist.addColorStop(1, "#aaff6300");
      c.fillStyle = wrist;
      c.fillRect(bx - 100, by - 100, 200, 200);
      for (let j = 0; j < 24; j++) {
        const xx = w * 0.4 + (Math.sin(j * 14.2) * 0.5 + 0.5) * w * 0.6,
          yy = (((j * 91 - t * (8 + (j % 5))) % h) + h) % h;
        ellipse(c, xx, yy, j % 3 ? 1 : 2, j % 3 ? 1 : 2, "#c3f67555");
      }
      const left = c.createLinearGradient(w * 0.05, 0, w * 0.62, 0);
      left.addColorStop(0, "#0c1712f0");
      left.addColorStop(0.58, "#0c1712c0");
      left.addColorStop(1, "#0c171200");
      c.fillStyle = left;
      c.fillRect(0, 0, w * 0.66, h);
      const bottom = c.createLinearGradient(0, h * 0.7, 0, h);
      bottom.addColorStop(0, "#0b140d00");
      bottom.addColorStop(1, "#0b140de8");
      c.fillStyle = bottom;
      c.fillRect(0, h * 0.7, w, h * 0.3);
      c.save();
      c.globalAlpha = 0.1;
      for (let yy = 0; yy < h; yy += 4) box(c, 0, yy, w, 1, "#000");
      c.restore();
    }
    world() {
      const g = this.g,
        c = this.c,
        w = g.world,
        t = g.clock,
        city = ["city", "market"].includes(w.zone);
      box(c, 0, 0, w.w, w.h, city ? "#4f6162" : "#263d43");
      if (city) {
        box(c, 0, 355, 1800, 485, "#a1a490");
        box(c, 0, 440, 1800, 330, "#485b63");
        box(c, 0, 427, 1800, 10, "#c3bca0");
        box(c, 0, 775, 1800, 12, "#c3bca0");
        for (let x = 0; x < 1800; x += 120) box(c, x, 600, 55, 3, "#c2be8c55");
        for (let x = 0; x < 1800; x += 54) {
          line(
            c,
            [
              [x, 359],
              [x, 425],
            ],
            "#6e7b6c",
            1,
          );
          line(
            c,
            [
              [x, 785],
              [x, 841],
            ],
            "#6e7b6c",
            1,
          );
        }
        for (let j = 0; j < 80; j++) {
          const x = (j * 137) % 1800,
            y = 470 + ((j * 73) % 280);
          line(
            c,
            [
              [x, y],
              [x + 9, y - 3],
              [x + 14, y + 4],
            ],
            "#62685b44",
            1,
          );
        }
        // A zebra crossing and painted bus bays break up the combat lane.
        for (let yy = 464; yy < 755; yy += 37)
          box(c, 337, yy, 62, 20, "#aaa98b77");
        line(
          c,
          [
            [85, 710],
            [245, 710],
            [245, 590],
          ],
          "#a89d6e66",
          3,
        );
      } else {
        for (let x = 0; x < 1800; x += 80)
          for (let y = 100; y < 1000; y += 80) {
            box(c, x + 2, y + 2, 76, 76, (x + y) % 160 ? "#2c4248" : "#314950");
            line(
              c,
              [
                [x + 8, y + 8],
                [x + 70, y + 8],
              ],
              "#45605233",
              1,
            );
          }
        box(c, 65, 535, 1650, 36, "#1b302b");
        line(
          c,
          [
            [65, 548],
            [1715, 548],
          ],
          "#82c5ab44",
          2,
        );
        if (w.zone === "throne") {
          box(c, 390, 380, 1120, 345, "#583e4d");
          for (let x = 410; x < 1480; x += 80)
            poly(
              c,
              [
                [x, 395],
                [x + 20, 410],
                [x, 425],
                [x - 20, 410],
              ],
              "#a79a6a44",
              null,
            );
        }
        if (w.zone === "escape") {
          c.save();
          c.globalAlpha = 0.15 + Math.sin(t * 3) * 0.08;
          box(c, 0, 0, 1800, 1100, "#be553c");
          c.restore();
        }
      }
      B.environmentArt.ground(c, w);
      for (const d of w.decor) this.decor(d);
      // Floor portions of mechanisms and hazards remain behind all characters.
      for (const o of w.obstacles) if (o.kind === "chasm") this.obstacle(o);
      for (const f of w.fields) {
        const alpha = Math.min(0.65, f.life * 2);
        c.save();
        c.globalAlpha = alpha;
        c.strokeStyle =
          f.kind === "fire"
            ? "#ffb25b"
            : f.kind === "crystal"
              ? "#a3f0d5"
              : f.kind === "danger"
                ? "#f58e6d"
                : "#e9cd90";
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(f.x, f.y, f.r, f.r * 0.66, 0, 0, B.TAU);
        c.stroke();
        c.globalAlpha *= 0.12;
        c.fill();
        c.restore();
        if (f.kind === "crystal")
          for (let a = 0; a < 8; a++) {
            const xx = f.x + Math.cos((a / 8) * B.TAU) * f.r,
              yy = f.y + Math.sin((a / 8) * B.TAU) * f.r * 0.65;
            poly(
              c,
              [
                [xx - 10, yy],
                [xx, yy - 40],
                [xx + 10, yy],
              ],
              "#8ccab9",
            );
          }
      }
      for (const e of w.enemies) {
        if (e.dead || e.state !== "windup") continue;
        c.save();
        c.globalAlpha = 0.3 + (1 - e.timer / e.windTotal) * 0.4;
        const col =
          (e.type === "executor" || e.type === "heavy" || e.type === "king") &&
          e.attackN % 3 === 2
            ? "#ee8768"
            : "#e4c078";
        c.fillStyle = col;
        c.strokeStyle = col;
        c.lineWidth = 2;
        c.beginPath();
        if (e.type === "king" && e.phase === 1)
          c.ellipse(e.tx, e.ty, 100, 64, 0, 0, B.TAU);
        else if (e.type === "energy" || (e.type === "king" && e.phase === 3)) {
          c.moveTo(e.x, e.y);
          c.lineTo(
            e.x + Math.cos(e.lockAngle) * 500,
            e.y + Math.sin(e.lockAngle) * 500,
          );
        } else c.arc(e.x, e.y, e.range, e.lockAngle - 1.1, e.lockAngle + 1.1);
        c.stroke();
        c.globalAlpha *= 0.12;
        c.fill();
        c.restore();
      }
      const drawables = [];
      for (const o of w.obstacles)
        if (o.kind !== "chasm" && !o.open)
          drawables.push({ y: o.y + o.h, draw: () => this.obstacle(o) });
      for (const o of w.objects)
        drawables.push({ y: o.y, draw: () => this.object(o) });
      for (const e of w.enemies)
        if (!e.dead) drawables.push({ y: e.y, draw: () => this.enemy(e) });
      if (w.zone === "intro") this.introActors(drawables);
      else {
        drawables.push({ y: g.player.y, draw: () => this.player() });
        if (w.zone === "city") {
          drawables.push({
            y: 460,
            draw: () => B.drawActor(c, "Max", 210, 460, 1.05, { time: t }),
          });
          drawables.push({
            y: 470,
            draw: () => B.drawActor(c, "Gwen", 280, 470, 1, { time: t }),
          });
        }
      }
      drawables.sort((a, b) => a.y - b.y);
      for (const d of drawables) d.draw();
      for (const s of w.shots) {
        c.save();
        c.translate(s.x, s.y);
        c.rotate(s.angle);
        if (s.kind === "fire") {
          ellipse(c, 0, 0, s.r * 1.5, s.r, "#ffb03f");
          poly(
            c,
            [
              [-5, -7],
              [-25 - Math.sin(t * 30) * 7, 0],
              [-5, 7],
            ],
            "#eb7138",
            null,
          );
          ellipse(c, 3, 0, s.r * 0.7, s.r * 0.55, "#fff0b2");
        } else {
          poly(
            c,
            [
              [-14, 0],
              [0, -s.r],
              [16, 0],
              [0, s.r],
            ],
            s.team === "player" ? "#c4fbea" : "#edb1ff",
            "#273f3b",
          );
        }
        c.restore();
      }
      for (const a of g.particles) {
        c.globalAlpha = Math.max(0, a.life / a.max);
        line(
          c,
          [
            [a.x, a.y],
            [a.x - a.vx * 0.025, a.y - a.vy * 0.025],
          ],
          a.color,
          a.size,
        );
      }
      c.globalAlpha = 1;
      for (const a of g.texts) {
        c.globalAlpha = Math.min(1, a.life * 2);
        label(c, String(a.text), a.x, a.y, 12, a.color);
      }
      c.globalAlpha = 1;
      B.environmentArt.atmosphere(c, w, t);
      if (w.zone !== "city" && w.zone !== "intro") {
        line(
          c,
          [
            [95, 530],
            [75, 550],
            [95, 570],
          ],
          "#b8d99277",
          3,
        );
        label(c, "REGRESAR", 85, 595, 8, "#a6b892");
      }
      if (
        w.exit &&
        !(w.zone === "city" && !g.save.flags.gate) &&
        !(w.zone === "fort" && !g.save.flags.supports)
      ) {
        const e = w.exit;
        const alpha = 0.55 + Math.sin(t * 3) * 0.25;
        line(
          c,
          [
            [e.x - 20, e.y - 20],
            [e.x + 2, e.y],
            [e.x - 20, e.y + 20],
          ],
          `rgba(186,245,129,${alpha})`,
          4,
        );
        label(c, "CONTINUAR", e.x - 6, e.y + 43, 9, "#c0de9b");
      }
    }
    obstacle(o) {
      const c = this.c,
        g = this.g,
        { x, y, w, h, kind } = o;
      if (kind === "chasm") {
        box(c, x, y, w, h, "#111d20");
        for (let yy = y; yy < y + h; yy += 80) {
          poly(
            c,
            [
              [x, yy],
              [x + 20, yy + 25],
              [x, yy + 50],
            ],
            "#4c5750",
          );
          poly(
            c,
            [
              [x + w, yy],
              [x + w - 20, yy + 25],
              [x + w, yy + 50],
            ],
            "#4c5750",
          );
        }
        if (o.open) {
          box(c, x - 5, 470, w + 10, 155, "#80baa8");
          for (let j = 0; j < 8; j++)
            line(
              c,
              [
                [x + j * 22, 470],
                [x + 15 + j * 22, 625],
              ],
              "#b7e4d0",
              2,
            );
        }
        return;
      }
      if (o.open) return;
      if (kind === "building") {
        B.environmentArt.building(c, o);
      } else if (["labwall", "shopwall"].includes(kind)) {
        box(c, x + 8, y + 8, w, h, "#09181166");
        box(c, x, y, w, h, "#506357");
        for (let xx = x; xx < x + w; xx += 62)
          for (let yy = y; yy < y + h; yy += 32)
            box(
              c,
              xx + 2,
              yy + 2,
              Math.min(58, x + w - xx - 2),
              Math.min(28, y + h - yy - 2),
              "#43594f",
            );
        box(c, x, y + h - 8, w, 8, "#788f78");
      } else if (kind === "car" || kind === "rv" || kind === "knightcar") {
        const rv = kind === "rv",
          col = rv
            ? "#d1c9a4"
            : kind === "knightcar"
              ? "#718479"
              : o.palette
                ? "#b27d61"
                : "#8ba08b";
        box(c, x + 7, y + 10, w, h, "#10211766");
        for (const xx of [x + 13, x + w - 32]) {
          box(c, xx, y - 4, 24, 13, "#28362f");
          box(c, xx, y + h - 9, 24, 13, "#28362f");
        }
        c.fillStyle = col;
        c.beginPath();
        c.roundRect(x, y, w, h, rv ? 12 : 10);
        c.fill();
        c.strokeStyle = "#293e32";
        c.lineWidth = 3;
        c.stroke();
        box(c, x + 18, y + 8, w * 0.52, h - 16, rv ? "#d4d0b3" : col);
        box(c, x + w * 0.7, y + 8, 18, h - 16, "#35534e");
        box(c, x + 13, y + 8, 17, h - 16, "#35534e");
        line(
          c,
          [
            [x + w * 0.7, y + 11],
            [x + w * 0.7, y + h - 11],
          ],
          "#8ca897",
          2,
        );
        if (rv) {
          box(c, x + 35, y + 17, 52, h - 34, "#8eab9a");
          box(c, x + 38, y + 20, 46, h - 40, "#53776c");
          line(
            c,
            [
              [x + 50, y + 4],
              [x + w - 25, y + 4],
            ],
            "#a87d58",
            4,
          );
          label(c, "RUSTBUCKET", x + w * 0.51, y + h - 8, 8, "#6a6246");
        } else {
          box(c, x + w - 5, y + 8, 5, 11, "#f1d9a1");
          box(c, x + w - 5, y + h - 19, 5, 11, "#f1d9a1");
        }
      } else if (kind === "tree") {
        ellipse(c, x + 25, y + 43, 35, 16, "#132b1866");
        box(c, x + 17, y + 8, 8, 32, "#64583e");
        for (const [xx, yy, rr, col] of [
          [0, 0, 24, "#3b603d"],
          [25, -10, 27, "#426e43"],
          [5, -22, 22, "#527c4c"],
          [26, -29, 19, "#608850"],
        ])
          ellipse(c, x + xx, y + yy, rr, rr * 0.8, col, "#2e4e36", 2);
      } else if (kind === "crate") {
        box(c, x + 5, y + 6, w, h, "#16281d66");
        box(c, x, y, w, h, "#a18c63", "#433f2e");
        box(c, x + 6, y + 6, w - 12, h - 12, "#826e4d");
        line(
          c,
          [
            [x + 5, y + 5],
            [x + w - 5, y + h - 5],
          ],
          "#b4a075",
          5,
        );
        line(
          c,
          [
            [x + w - 5, y + 5],
            [x + 5, y + h - 5],
          ],
          "#b4a075",
          5,
        );
      } else if (kind === "machine") {
        box(c, x + 10, y + 15, w, h, "#081a1666");
        box(c, x, y, w, h, "#3c554b", "#1b3028");
        box(c, x + 8, y + 8, w - 16, h - 25, "#263f39");
        const cy = y + h * 0.5;
        ellipse(c, x + w / 2, cy, 35, 50, "#1e302c", "#688d77", 4);
        poly(
          c,
          [
            [x + w / 2 - 22, cy + 25],
            [x + w / 2 - 18, cy - 25],
            [x + w / 2, cy - 55],
            [x + w / 2 + 24, cy - 12],
            [x + w / 2 + 15, cy + 28],
          ],
          "#82c7b077",
          "#a5e6c7",
          1,
        );
        for (let j = 0; j < 4; j++)
          box(
            c,
            x + 15 + j * 20,
            y + h - 20,
            10,
            4,
            j % 2 ? "#bee99e" : "#82b9aa",
          );
        line(
          c,
          [
            [x + w - 20, y + 20],
            [x + w - 20, y + h - 35],
          ],
          "#9ac9aa66",
          2,
        );
      } else if (kind === "crystal" || kind === "pillar") {
        ellipse(c, x + w / 2, y + h + 5, w * 0.8, 15, "#0e201777");
        poly(
          c,
          [
            [x, y + h],
            [x + 5, y + 20],
            [x + w / 2, y - 20],
            [x + w - 5, y + 20],
            [x + w, y + h],
          ],
          kind === "pillar" ? "#677f6b" : "#8fc5b5",
          "#294b40",
          3,
        );
        line(
          c,
          [
            [x + w / 2, y - 18],
            [x + w / 2, y + h],
            [x, y + h],
          ],
          "#c3e8c3",
          2,
        );
      } else if (kind === "fence") {
        box(c, x, y, w, h, "#263f3366");
        for (let yy = y; yy < y + h; yy += 35)
          line(
            c,
            [
              [x, yy],
              [x + w, yy + 30],
            ],
            "#788c7866",
            2,
          );
        line(
          c,
          [
            [x + 5, y],
            [x + 5, y + h],
          ],
          "#9ba58c",
          4,
        );
        line(
          c,
          [
            [x + w - 5, y],
            [x + w - 5, y + h],
          ],
          "#9ba58c",
          4,
        );
      } else if (kind === "gate" || kind === "security") {
        let progress =
          kind === "gate"
            ? g.world.objects.find((a) => a.id === "gate")?.progress || 0
            : 0;
        c.save();
        c.globalAlpha = 1 - progress * 0.8;
        box(c, x, y, w, h, "#536d5e", "#94a68e");
        for (let yy = y + 8; yy < y + h; yy += 25)
          line(
            c,
            [
              [x + 5, yy],
              [x + w - 5, yy],
            ],
            "#263c31",
            6,
          );
        for (let yy = y + 14; yy < y + h; yy += 90) {
          ellipse(
            c,
            x + w / 2,
            yy,
            5,
            5,
            kind === "security" ? "#bcebb7" : "#e7b884",
          );
        }
        c.restore();
      }
    }
    object(o) {
      const c = this.c,
        g = this.g,
        t = g.clock;
      if (g.save.items.includes(o.id)) return;
      const { x, y, type } = o;
      if (type === "safe") {
        ellipse(c, x, y, 34, 14, "#9dec6630", "#b4ef7055");
        badge(c, x, y - 18, 10);
        label(c, "PUNTO SEGURO", x, y + 24, 7, "#bed996");
      } else if (type === "gate" || type === "heater" || type === "support") {
        if (o.broken) {
          for (let a = 0; a < 7; a++)
            poly(
              c,
              [
                [x + a * 8 - 25, y + 5],
                [x + a * 8 - 22, y - 6],
                [x + a * 8 - 15, y + 7],
              ],
              "#91c0ad",
            );
          return;
        }
        if (type === "gate" && o.progress >= 1) return;
        const col =
          o.heat >= 100 ? "#f2ba6c" : o.heat > 0 ? "#df8656" : "#8ab6ae";
        ellipse(c, x, y + 7, 35, 13, "#102a1c66");
        box(c, x - 25, y - 41, 50, 45, "#3c564a", "#91a187");
        if (type === "support")
          poly(
            c,
            [
              [x - 21, y],
              [x - 17, y - 45],
              [x, y - 68],
              [x + 22, y - 36],
              [x + 16, y],
            ],
            col,
            "#c6e5cb",
            2,
          );
        else {
          ellipse(c, x, y - 22, 15, 15, "#293e32", col, 3);
          line(
            c,
            [
              [x, y - 34],
              [x, y - 12],
            ],
            col,
            3,
          );
        }
        if (o.heat > 0) {
          box(c, x - 25, y + 17, 50, 4, "#23382a");
          box(c, x - 25, y + 17, o.heat * 0.5, 4, col);
        }
        if (o.heat >= 100) {
          c.save();
          c.globalAlpha = 0.5 + Math.sin(t * 5) * 0.25;
          line(
            c,
            [
              [x - 15, y - 45],
              [x + 3, y - 32],
              [x - 7, y - 18],
              [x + 10, y - 6],
            ],
            "#fff2b8",
            2,
          );
          c.restore();
        }
        label(
          c,
          type === "support"
            ? "CONDUCTO"
            : type === "gate"
              ? "MOTOR"
              : "CONDUCTO SELLADO",
          x,
          y + 34,
          7,
          "#d2d6b1",
        );
      } else if (type === "bridge" || type === "socket") {
        ellipse(c, x, y + 4, 35, 16, "#213d34", "#75a88d", 2);
        poly(
          c,
          [
            [x - 15, y],
            [x - 17, y - 21],
            [x, y - 39],
            [x + 16, y - 20],
            [x + 14, y],
          ],
          o.progress >= 1 ? "#b9f4d6" : "#56766a",
          "#a1cbb2",
          2,
        );
        if (o.progress > 0) badge(c, x, y - 17, 7);
        label(c, "RESONANCIA", x, y + 28, 7, "#b8d8b5");
      } else if (["health", "energy", "crate"].includes(type)) {
        if (o.requires && !g.save.flags[o.requires]) {
          box(c, x - 30, y - 35, 60, 40, "#6d7157", "#899278");
          line(
            c,
            [
              [x - 20, y - 25],
              [x + 20, y - 4],
            ],
            "#a59f77",
            4,
          );
          return;
        }
        const col =
          type === "health"
            ? "#f2ba8d"
            : type === "energy"
              ? "#b6f76e"
              : "#e5d59c";
        const bob = Math.sin(t * 3 + x) * 4;
        ellipse(c, x, y + 9, 20, 8, col + "33");
        c.save();
        c.translate(0, bob);
        poly(
          c,
          [
            [x, y - 40],
            [x + 14, y - 25],
            [x, y - 10],
            [x - 14, y - 25],
          ],
          col,
          "#263f30",
          2,
        );
        if (type === "health") {
          line(
            c,
            [
              [x - 6, y - 25],
              [x + 6, y - 25],
            ],
            "#794d35",
            3,
          );
          line(
            c,
            [
              [x, y - 31],
              [x, y - 19],
            ],
            "#794d35",
            3,
          );
        } else badge(c, x, y - 25, 6);
        c.restore();
      }
    }
    decor(d) {
      const c = this.c;
      if (d.kind === "lamp") {
        box(c, d.x - 4, d.y - 60, 8, 64, "#394f40");
        line(
          c,
          [
            [d.x, d.y - 60],
            [d.x + 22, d.y - 65],
          ],
          "#526b50",
          6,
        );
        ellipse(c, d.x + 23, d.y - 61, 10, 4, "#e4df9a");
        ellipse(c, d.x + 23, d.y + 10, 45, 22, "#eae6a80b");
      } else if (d.kind === "sign") {
        box(c, d.x, d.y - 35, 100, 27, "#375d47", "#a9b68b");
        label(c, d.text, d.x + 50, d.y - 17, 9, "#dce4ba");
      } else if (d.kind === "throne") {
        box(c, d.x - 40, d.y - 60, 100, 95, "#676c5a", "#b4b58e");
        poly(
          c,
          [
            [d.x - 20, d.y],
            [d.x - 15, d.y - 92],
            [d.x + 15, d.y - 115],
            [d.x + 48, d.y - 90],
            [d.x + 50, d.y],
          ],
          "#786e64",
          "#afa78b",
        );
      }
    }
    player() {
      const g = this.g,
        p = g.player,
        c = this.c;
      if (p.dodgeTime > 0) {
        c.save();
        c.globalAlpha = 0.18;
        for (let j = 1; j < 4; j++)
          B.drawActor(
            c,
            p.form,
            p.x - Math.cos(p.dodgeAngle) * j * 20,
            p.y - Math.sin(p.dodgeAngle) * j * 20,
            1,
            { time: g.clock, walk: p.walk },
          );
        c.restore();
      }
      ellipse(
        c,
        p.x,
        p.y + 6,
        p.form === "four" ? 34 : 25,
        12,
        "#a8ee4f12",
        "#b7ee6744",
        1,
      );
      B.drawActor(c, p.form, p.x, p.y, p.form === "four" ? 1.08 : 1, {
        time: g.clock,
        walk: p.walk,
        special: p.specialPose,
        dodging: p.dodgeTime > 0,
        blocking: p.blocking,
        attack: p.attack,
        invuln: p.invuln,
        facing: p.facing,
      });
      if (p.blocking) {
        const a = p.facing;
        c.strokeStyle = p.blockTime < 0.22 ? "#f5ffe0" : "#a7e975";
        c.lineWidth = p.form === "diamond" ? 5 : 3;
        c.beginPath();
        c.arc(p.x, p.y - 20, 40, a - 0.95, a + 0.95);
        c.stroke();
      }
      if (p.attack) {
        const a = p.attack,
          heavy = a.kind === "K",
          progress = 1 - a.time / a.total,
          angle = a.angle - 0.9 + progress * 1.8;
        const r = (p.form === "four" ? 90 : 65) + (heavy ? 25 : 0);
        c.save();
        c.globalAlpha = Math.sin(progress * Math.PI) * 0.75;
        c.strokeStyle = B.form(p.form).color;
        c.lineWidth = heavy ? 11 : 5;
        c.beginPath();
        c.ellipse(p.x, p.y - 18, r, r * 0.65, 0, angle - 0.5, angle + 0.4);
        c.stroke();
        c.restore();
      }
      // Aim marker gives melee attacks a clear orientation without a large cursor UI.
      const a = p.facing;
      poly(
        c,
        [
          [p.x + Math.cos(a) * 44, p.y + Math.sin(a) * 44 - 12],
          [p.x + Math.cos(a + 0.13) * 37, p.y + Math.sin(a + 0.13) * 37 - 12],
          [p.x + Math.cos(a - 0.13) * 37, p.y + Math.sin(a - 0.13) * 37 - 12],
        ],
        "#c6f89a88",
        null,
      );
    }
    enemy(e) {
      const g = this.g,
        c = this.c;
      const scale =
        e.type === "executor"
          ? 1.7
          : e.type === "king"
            ? 1.6
            : e.type === "heavy"
              ? 1.25
              : 1;
      B.drawActor(c, e.type, e.x, e.y, scale, {
        time: g.clock,
        walk: e.walk,
        flash: e.flash,
        armor: e.armor,
        facing: e.facing,
        attack: e.state === "strike" ? { time: e.timer, total: 0.2 } : null,
      });
      if (e.hp < e.maxHp && e.type !== "king" && e.type !== "executor") {
        box(c, e.x - 22, e.y - 82 * scale, 44, 4, "#1b2a20");
        box(
          c,
          e.x - 22,
          e.y - 82 * scale,
          44 * Math.max(0, e.hp / e.maxHp),
          4,
          "#dcbb7f",
        );
      }
      if (e.type === "king" && e.phase === 1) {
        box(c, e.x - 42, e.y - 140, 84, 5, "#1b2e25");
        box(c, e.x - 42, e.y - 140, e.heat * 0.84, 5, "#ffbd69");
        if (e.heat >= 100) label(c, "FRÁGIL", e.x, e.y - 150, 10, "#ffdb91");
      }
      if (e.state === "windup") {
        label(c, "!", e.x, e.y - 85 * scale, 22, "#ffdf9c");
      }
    }
    introActors(list) {
      const g = this.g,
        c = this.c,
        t = g.clock,
        fractured = g.cine.fractured,
        escaped = g.cine.escaped;
      const spots = [
        ["Vilgax", 870, 390],
        ["Kevin", 520, 340],
        ["Zombozo", 1000, 500],
        ["Hex", 410, 470],
        ["Dr. Ánimo", 520, 650],
        ["Malware", 1000, 670],
        ["Driscoll", 800, 720],
      ];
      // The extractor has actual restraint points and an energy feed into the watch.
      const metal = c.createLinearGradient(620, 0, 780, 0);
      metal.addColorStop(0, "#354b55");
      metal.addColorStop(0.45, "#78918a");
      metal.addColorStop(0.55, "#243c48");
      metal.addColorStop(1, "#4e6870");
      box(c, 625, 350, 155, 270, "#071a2b55");
      box(c, 615, 338, 160, 270, metal, "#182d39");
      box(c, 628, 351, 134, 243, "#142b35");
      ellipse(c, 695, 472, 60, 107, "#213e49", "#85aba4", 3);
      ellipse(
        c,
        695,
        472,
        54,
        101,
        "#182f3b",
        fractured ? "#b68364" : "#85c3ad",
        1,
      );
      for (let j = 0; j < 5; j++) {
        box(c, 607, 353 + j * 50, 16, 23, "#182c39");
        box(c, 767, 353 + j * 50, 16, 23, "#182c39");
        box(c, 610, 356 + j * 50, 10, 16, fractured ? "#d78457" : "#9fcda4");
        box(c, 770, 356 + j * 50, 10, 16, fractured ? "#d78457" : "#9fcda4");
      }
      for (const [x, y] of [
        [622, 345],
        [767, 345],
        [622, 599],
        [767, 599],
      ]) {
        ellipse(c, x, y, 3, 3, "#a4b6a0", "#20363e", 1);
      }
      line(
        c,
        [
          [615, 406],
          [569, 406],
          [569, 559],
          [613, 559],
        ],
        "#0b2433",
        9,
      );
      line(
        c,
        [
          [615, 406],
          [569, 406],
          [569, 559],
          [613, 559],
        ],
        fractured ? "#994d3c" : "#b38664",
        3,
      );
      if (fractured) {
        line(
          c,
          [
            [628, 358],
            [650, 375],
            [637, 397],
            [660, 413],
          ],
          "#c8b49a",
          1.5,
        );
        poly(
          c,
          [
            [756, 529],
            [777, 546],
            [773, 576],
            [758, 563],
          ],
          "#6d7a75",
        );
      }
      list.push({
        y: 500,
        draw: () => {
          B.drawActor(c, "ben", escaped ? 350 : 695, escaped ? 690 : 500, 1.2, {
            time: t,
            walk: escaped ? t * 12 : 0,
            pose: escaped ? "run" : "captured",
            expression: fractured ? "ALARMADO" : "DESAFIANTE",
          });
          if (!escaped) {
            for (const side of [-1, 1]) {
              const wrist = 695 + side * 23;
              const rail = side < 0 ? 628 : 762;
              line(
                c,
                [
                  [rail, 447],
                  [wrist, 447],
                ],
                "#1b2d37",
                9,
              );
              line(
                c,
                [
                  [rail, 445],
                  [wrist, 445],
                ],
                "#8a9c94",
                4,
              );
              box(c, wrist - 5, 441, 10, 10, "#304951", "#a4bba3");
            }
            ellipse(c, 672, 447, 3, 3, fractured ? "#f0aa75" : "#bded92");
          }
        },
      });
      for (const [id, x, y] of spots)
        list.push({
          y,
          draw: () =>
            B.drawActor(
              c,
              id,
              x + (g.cine.brawl ? Math.sin(t * 5 + x) * 14 : 0),
              y,
              id === "Vilgax" ? 1.3 : id === "Kevin" ? 1.05 : 1.15,
              {
                time: t,
                walk: g.cine.brawl ? t * 15 : 0,
                scene: "intro",
                expression: g.cine.brawl ? "FURIOSO" : "AMENAZANTE",
              },
            ),
        });
      label(
        c,
        fractured ? "EXTRACCIÓN INTERRUMPIDA" : "EXTRACTOR GENÉTICO / ACTIVO",
        695,
        310,
        12,
        fractured ? "#f8bc86" : "#c5e8a3",
      );
    }
  }
  B.Renderer = Renderer;
})(window.B10);
