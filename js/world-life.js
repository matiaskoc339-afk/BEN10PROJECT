"use strict";
(function (B) {
  const roadX = [520, 1100, 1700, 2250],
    roadY = [430, 930, 1460];
  B.surfaceAt = (w, x, y) => {
    if (!["city", "market"].includes(w.zone)) return "stone";
    if (
      roadX.some((a) => x >= a && x <= a + 160) ||
      roadY.some((a) => y >= a && y <= a + 150)
    )
      return "asphalt";
    if (
      [450, 1030, 1630, 2180].some((a) => x >= a && x <= a + 300) ||
      [340, 840, 1370].some((a) => y >= a && y <= a + 300)
    )
      return "paving";
    return "grass";
  };
  function rng(seed) {
    let s = seed;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  class WorldLife {
    constructor() {
      this.worlds = new WeakMap();
    }
    state(w) {
      if (this.worlds.has(w)) return this.worlds.get(w);
      const random = rng(w.zone.length * 1297 + w.w);
      const data = {
        steps: [],
        actors: new WeakMap(),
        contacts: new WeakSet(),
        grass: [],
        leaves: [],
        decals: [],
      };
      const city = ["city", "market"].includes(w.zone);
      if (city) {
        for (let i = 0; i < 520; i++) {
          const x = random() * w.w,
            y = random() * w.h;
          if (
            B.surfaceAt(w, x, y) === "grass" &&
            !w.obstacles.some((o) => B.circleRect(x, y, 15, o))
          )
            data.grass.push({
              x,
              y,
              phase: random() * B.TAU,
              size: 3 + random() * 4,
            });
        }
        for (let i = 0; i < 64; i++)
          data.leaves.push({
            x: random() * w.w,
            y: random() * w.h,
            phase: random() * B.TAU,
            speed: 8 + random() * 13,
            size: 1.4 + random() * 2,
          });
        for (let i = 0; i < 75; i++) {
          const x = random() * w.w,
            y = random() * w.h;
          if (B.surfaceAt(w, x, y) === "asphalt")
            data.decals.push({
              x,
              y,
              r: 3 + random() * 14,
              a: random() * B.TAU,
            });
        }
      }
      this.worlds.set(w, data);
      return data;
    }
    update(g, dt) {
      const w = g.world,
        s = this.state(w);
      for (const p of s.steps) p.age += dt;
      s.steps = s.steps.filter((p) => p.age < p.life);
      for (const a of [g.player, ...w.enemies]) {
        if (a.dead) continue;
        const step = Math.floor((a.walk || 0) / Math.PI),
          old = s.actors.get(a);
        if (
          a.moving &&
          !a.dodgeTime &&
          !a.hurtTime &&
          old !== undefined &&
          old !== step
        ) {
          const angle = a.moveFacing ?? a.facing,
            side = step % 2 ? 1 : -1,
            surface = B.surfaceAt(w, a.x, a.y);
          s.steps.push({
            x: a.x + Math.cos(angle + Math.PI / 2) * side * 7,
            y: a.y + Math.sin(angle + Math.PI / 2) * side * 7,
            age: 0,
            life: surface === "grass" ? 1.1 : 0.6,
            angle,
            surface,
            side,
          });
          if (a === g.player) g.audio.footstep?.(surface);
        }
        const attack = a.attack || a.specialPose;
        if (attack?.fired && !s.contacts.has(attack)) {
          s.contacts.add(attack);
          s.steps.push({
            x: a.x,
            y: a.y,
            age: 0,
            life: 0.42,
            angle: a.facing || 0,
            surface: B.surfaceAt(w, a.x, a.y),
            side: 0,
            impact: true,
          });
        }
        s.actors.set(a, step);
      }
      if (s.steps.length > 72) s.steps.splice(0, s.steps.length - 72);
    }
    wind(w, x, y) {
      return (
        Math.sin(w.time * 1.2 + x * 0.009 + y * 0.004) * 2.5 +
        Math.sin(w.time * 0.63 + x * 0.003) * 1.2
      );
    }
    visible(g, x, y, r = 50) {
      return (
        Math.abs(x - g.camera.x) < g.view.w / g.camera.zoom / 2 + r &&
        Math.abs(y - g.camera.y) < g.view.h / g.camera.zoom / 2 + r
      );
    }
    ground(c, g) {
      const w = g.world,
        s = this.state(w),
        city = ["city", "market"].includes(w.zone),
        actors = [g.player, ...w.enemies.filter((e) => !e.dead)];
      if (city) {
        c.save();
        // Bevelled curbs terminate at crossings instead of drawing through them.
        for (const y of roadY)
          for (const edge of [y, y + 150]) {
            let x = 0;
            for (const gap of [...roadX, w.w]) {
              if (gap > x) {
                c.strokeStyle = "#1c3a3245";
                c.lineWidth = 5;
                c.beginPath();
                c.moveTo(x, edge + 2);
                c.lineTo(gap, edge + 2);
                c.stroke();
                c.strokeStyle = "#f1e6c488";
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(x, edge - 1);
                c.lineTo(gap, edge - 1);
                c.stroke();
              }
              x = gap + 160;
            }
          }
        for (const d of s.decals) {
          if (!this.visible(g, d.x, d.y, 20)) continue;
          c.strokeStyle = "#253d3c22";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(d.x, d.y);
          c.lineTo(d.x + Math.cos(d.a) * d.r, d.y + Math.sin(d.a) * d.r);
          c.lineTo(
            d.x + Math.cos(d.a + 0.7) * d.r * 1.4,
            d.y + Math.sin(d.a + 0.7) * d.r * 1.4,
          );
          c.stroke();
        }
        for (const blade of s.grass) {
          if (!this.visible(g, blade.x, blade.y, 15)) continue;
          let bend = this.wind(w, blade.x, blade.y) * 0.55;
          for (const a of actors) {
            const d = Math.hypot(a.x - blade.x, a.y - blade.y);
            if (d < 36)
              bend += ((blade.x - a.x) / Math.max(1, d)) * (1 - d / 36) * 8;
          }
          c.strokeStyle = "#3a68396b";
          c.lineWidth = 1.1;
          c.beginPath();
          for (let j = -1; j <= 1; j++) {
            c.moveTo(blade.x + j * 3, blade.y);
            c.quadraticCurveTo(
              blade.x + j * 3 + bend * 0.5,
              blade.y - blade.size * 0.5,
              blade.x + j * 3 + bend,
              blade.y - blade.size,
            );
          }
          c.stroke();
        }
        c.restore();
      }
      for (const p of s.steps) {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.angle);
        const fade = 1 - p.age / p.life;
        c.globalAlpha = fade * 0.25;
        c.fillStyle = p.surface === "grass" ? "#284728" : "#596153";
        c.beginPath();
        c.ellipse(0, 0, p.impact ? 8 : 4, p.impact ? 3 : 2.2, 0, 0, B.TAU);
        c.fill();
        c.globalAlpha = fade * 0.17;
        c.fillStyle = p.surface === "grass" ? "#b7c77a" : "#dfceb0";
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.ellipse(
            -p.age * (7 + i * 4),
            Math.sin(i * 2) * p.age * 6,
            1 + p.age * 3,
            1 + p.age * 2,
            0,
            0,
            B.TAU,
          );
          c.fill();
        }
        c.restore();
      }
    }
    shadows(c, g, all = false) {
      for (const o of g.world.obstacles) {
        if (
          o.open ||
          (!all &&
            !this.visible(g, o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h)))
        )
          continue;
        const { x, y, w, h } = o;
        if (o.kind === "building")
          B.drawPropShadow(
            c,
            o.label?.includes("CAFÉ")
              ? 7
              : o.palette === 1
                ? 1
                : o.palette === 2
                  ? 2
                  : 0,
            x,
            y,
            w,
            h,
            0.18,
          );
        else if (o.kind === "tree")
          B.drawPropShadow(
            c,
            (x + y) % 3 ? 8 : 9,
            x + w / 2 - 65,
            y + h - 145,
            130,
            145,
            0.2,
          );
        else if (["car", "rv", "knightcar"].includes(o.kind))
          B.drawPropShadow(
            c,
            o.kind === "rv"
              ? 3
              : o.kind === "knightcar"
                ? 6
                : o.palette
                  ? 5
                  : 4,
            x,
            y - 25,
            w,
            h + 25,
            0.15,
          );
        else if (o.kind === "fountain")
          B.drawPropShadow(c, 10, x - 20, y - 70, w + 40, h + 70, 0.18);
        else if (o.kind === "machine" || o.kind === "pillar")
          B.drawPropShadow(
            c,
            o.kind === "machine" ? 14 : 13,
            x,
            y - 40,
            w,
            h + 40,
            0.18,
          );
      }
    }
    fountain(c, o, t) {
      const left = o.x - 20,
        top = o.y - 70,
        w = o.w + 40,
        h = o.h + 70;
      for (const [cy, rx, ry] of [
        [top + h * 0.71, w * 0.34, h * 0.12],
        [top + h * 0.34, w * 0.16, h * 0.055],
      ]) {
        c.save();
        c.beginPath();
        c.ellipse(left + w * 0.5, cy, rx, ry, 0, 0, B.TAU);
        c.clip();
        for (let j = 0; j < 5; j++) {
          const phase = (t * 0.43 + j * 0.2) % 1;
          c.strokeStyle = `rgba(210,248,241,${0.38 * (1 - phase)})`;
          c.lineWidth = 1.1;
          c.beginPath();
          c.ellipse(
            left + w * 0.5 + Math.sin(t + j) * 2,
            cy,
            rx * phase,
            ry * phase,
            0,
            0,
            B.TAU,
          );
          c.stroke();
        }
        c.restore();
      }
      c.save();
      c.strokeStyle = "#c4f0ed99";
      c.lineWidth = 1.2;
      for (let j = 0; j < 3; j++) {
        const xx = left + w * 0.5 - 3 + j * 3;
        c.beginPath();
        c.moveTo(xx, top + h * 0.16);
        c.quadraticCurveTo(
          xx + Math.sin(t * 6 + j) * 1.1,
          top + h * 0.22,
          xx + Math.sin(t * 4 + j),
          top + h * 0.32,
        );
        c.stroke();
      }
      for (let j = 0; j < 8; j++) {
        const p = (t * 1.4 + j / 8) % 1;
        c.fillStyle = `rgba(213,245,231,${0.5 * (1 - p)})`;
        c.beginPath();
        c.ellipse(
          left + w * 0.5 + Math.sin(j * 3) * (7 + p * 18),
          top + h * 0.71 - Math.sin(p * Math.PI) * 8,
          1,
          1.5,
          0,
          0,
          B.TAU,
        );
        c.fill();
      }
      c.restore();
    }
    fixtures(c, g) {
      const t = g.world.time;
      for (const d of g.world.decor) {
        if (d.kind !== "lamp" || !this.visible(g, d.x, d.y, 100)) continue;
        c.save();
        c.strokeStyle = "#435149";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(d.x, d.y);
        c.lineTo(d.x, d.y - 85);
        c.quadraticCurveTo(d.x, d.y - 101, d.x + 23, d.y - 96);
        c.stroke();
        c.fillStyle = "#c9c2a0";
        c.beginPath();
        c.ellipse(d.x + 23, d.y - 92, 9, 4, 0, 0, B.TAU);
        c.fill();
        const light = c.createRadialGradient(
          d.x + 23,
          d.y - 70,
          1,
          d.x + 23,
          d.y - 70,
          62,
        );
        light.addColorStop(0, "#ffe9a420");
        light.addColorStop(1, "#ffe9a400");
        c.fillStyle = light;
        c.fillRect(d.x - 45, d.y - 135, 135, 135);
        c.restore();
      }
      for (const o of g.world.obstacles) {
        if (!this.visible(g, o.x + o.w / 2, o.y + o.h / 2, 120)) continue;
        if (o.kind === "rv") {
          c.save();
          c.globalAlpha = 0.09;
          c.fillStyle = "#819386";

          for (let j = 0; j < 3; j++) {
            const phase = (t * 0.4 + j / 3) % 1;
            c.beginPath();
            c.ellipse(
              o.x + o.w - 6 + phase * 12,
              o.y + 4 - phase * 19,
              3 + phase * 7,
              2 + phase * 3,
              0,
              0,
              B.TAU,
            );
            c.fill();
          }
          c.restore();
        } else if (o.kind === "machine") {
          const x = o.x + o.w / 2,
            y = o.y + o.h * 0.55,
            glow = c.createRadialGradient(x, y, 3, x, y, 70);
          glow.addColorStop(
            0,
            `rgba(112,221,204,${0.06 + Math.sin(t * 1.7 + o.x) * 0.015})`,
          );
          glow.addColorStop(1, "#7cddc900");
          c.fillStyle = glow;
          c.fillRect(x - 70, y - 70, 140, 140);
        }
      }
      for (const o of g.world.objects) {
        if (o.broken || !this.visible(g, o.x, o.y, 120)) continue;
        if (
          ["gate", "heater", "support", "socket", "bridge"].includes(o.type)
        ) {
          const lit = o.heat >= 100 || o.progress >= 1,
            col = o.heat >= 100 ? "255,166,90" : "117,224,196";
          const glow = c.createRadialGradient(
            o.x,
            o.y - 30,
            2,
            o.x,
            o.y - 30,
            lit ? 82 : 47,
          );
          glow.addColorStop(
            0,
            `rgba(${col},${(lit ? 0.17 : 0.075) * (1 + Math.sin(t * 2.6) * 0.12)})`,
          );
          glow.addColorStop(1, `rgba(${col},0)`);
          c.fillStyle = glow;
          c.fillRect(o.x - 85, o.y - 115, 170, 170);
        }
      }
      if (g.player.form === "heat") {
        const p = g.player,
          glow = c.createRadialGradient(p.x, p.y - 40, 8, p.x, p.y - 40, 110);
        glow.addColorStop(0, "#ffb64b2a");
        glow.addColorStop(1, "#ffb64b00");
        c.fillStyle = glow;
        c.fillRect(p.x - 110, p.y - 150, 220, 220);
      }
    }
    air(c, g) {
      const w = g.world,
        s = this.state(w),
        t = w.time;
      for (const leaf of s.leaves) {
        const x = ((leaf.x + t * leaf.speed) % (w.w + 120)) - 60,
          y = leaf.y + Math.sin(t * 0.7 + leaf.phase) * 22;
        if (!this.visible(g, x, y, 10)) continue;
        c.save();
        c.translate(x, y - 9);
        c.rotate(Math.sin(t * 1.3 + leaf.phase));
        c.fillStyle = "#6f804865";
        c.beginPath();
        c.ellipse(0, 0, leaf.size, leaf.size * 0.4, 0, 0, B.TAU);
        c.fill();
        c.restore();
      }
      if (["city", "market"].includes(w.zone)) {
        for (let i = 0; i < 3; i++) {
          const x = 930 + Math.sin(t * 0.085 + i * 0.7) * 520,
            y = 1080 + Math.cos(t * 0.08 + i * 0.7) * 250;
          if (!this.visible(g, x, y, 30)) continue;
          c.strokeStyle = "#233d3260";
          c.lineWidth = 1.5;
          const flap = 2 + Math.sin(t * 7 + i) * 3;
          c.beginPath();
          c.moveTo(x - 8, y);
          c.quadraticCurveTo(x - 3, y - flap, x, y);
          c.quadraticCurveTo(x + 3, y - flap, x + 8, y);
          c.stroke();
        }
      } else {
        c.save();
        c.globalAlpha = 0.2;
        c.fillStyle = "#afcdbf";
        for (let i = 0; i < 16; i++) {
          const x = (i * 137 + t * (2 + (i % 3))) % w.w,
            y = 180 + ((i * 79) % 740) + Math.sin(t * 0.4 + i) * 12;
          if (!this.visible(g, x, y, 5)) continue;
          c.fillRect(x, y, 1, 1);
        }
        c.restore();
      }
    }
  }
  B.WorldLife = WorldLife;
})(window.B10);
