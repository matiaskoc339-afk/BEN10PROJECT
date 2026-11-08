"use strict";
(function (B) {
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
            y =
              (w.lane?.top || 0) +
              random() * ((w.lane?.bottom || w.h) - (w.lane?.top || 0));
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
            y =
              (w.lane?.top || 0) +
              random() * ((w.lane?.bottom || w.h) - (w.lane?.top || 0));
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
  }
  B.WorldLife = WorldLife;
})(window.B10);
