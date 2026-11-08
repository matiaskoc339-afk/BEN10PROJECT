"use strict";
(function (B) {
  const label = (c, text, x, y, size = 11, color = "#d3e1bc") => {
    c.fillStyle = color;
    c.font = `bold ${size}px Arial`;
    c.textAlign = "center";
    c.fillText(text, x, y);
  };
  function ring(c, x, y, r, color, width = 2) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.ellipse(x, y, r, r * 0.56, 0, 0, B.TAU);
    c.stroke();
  }
  class Renderer {
    constructor(g) {
      this.g = g;
      this.c = g.canvas.getContext("2d");
      this.backdrops = new WeakMap();
    }
    draw() {
      const g = this.g,
        c = this.c,
        v = g.view;
      c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
      c.clearRect(0, 0, v.w, v.h);
      if (!B.assetsLoaded) {
        c.fillStyle = "#101d17";
        c.fillRect(0, 0, v.w, v.h);
        label(c, "PREPARANDO BELLWOOD…", v.w * 0.73, v.h * 0.5, 17);
        return;
      }
      if (g.mode === "menu") {
        this.menu();
        return;
      }
      c.save();
      c.translate(v.w / 2, v.h / 2);
      c.scale(g.camera.zoom, g.camera.zoom);
      c.translate(-g.camera.x, -g.camera.y);
      this.world();
      c.restore();
      if (g.flash > 0) {
        c.fillStyle = `rgba(180,255,140,${g.flash * 0.2})`;
        c.fillRect(0, 0, v.w, v.h);
      }
      if (g.transition > 0) {
        c.fillStyle = `rgba(10,19,22,${g.transition})`;
        c.fillRect(0, 0, v.w, v.h);
      }
    }
    paintGround() {
      B.paintScenery(this.c, this.g.world);
    }
    ground() {
      const g = this.g,
        c = this.c,
        w = g.world;
      let cached = this.backdrops.get(w);
      if (!cached) {
        cached = document.createElement("canvas");
        cached.width = w.w;
        cached.height = w.h;
        this.c = cached.getContext("2d");
        this.paintGround();
        g.life.shadows(this.c, g, true);
        this.c = c;
        this.backdrops.set(w, cached);
      }
      const left = g.camera.x - g.view.w / g.camera.zoom / 2,
        top = g.camera.y - g.view.h / g.camera.zoom / 2,
        right = left + g.view.w / g.camera.zoom,
        bottom = top + g.view.h / g.camera.zoom;
      c.fillStyle = ["city", "market"].includes(w.zone) ? "#739365" : "#40565c";
      if (left < 0) c.fillRect(left, top, -left, bottom - top);
      if (top < 0)
        c.fillRect(Math.max(0, left), top, right - Math.max(0, left), -top);
      if (right > w.w) c.fillRect(w.w, top, right - w.w, bottom - top);
      if (bottom > w.h)
        c.fillRect(
          Math.max(0, left),
          w.h,
          Math.min(right, w.w) - Math.max(0, left),
          bottom - w.h,
        );
      const sx = Math.max(0, left),
        sy = Math.max(0, top),
        sw = Math.min(w.w, right) - sx,
        sh = Math.min(w.h, bottom) - sy;
      if (sw > 0 && sh > 0) c.drawImage(cached, sx, sy, sw, sh, sx, sy, sw, sh);
    }
    world() {
      const g = this.g,
        c = this.c,
        w = g.world,
        t = g.clock;
      this.ground();
      if (w.zone === "city" || w.zone === "market") {
        const halfW = g.view.w / g.camera.zoom / 2;
        const halfH = g.view.h / g.camera.zoom / 2;
        const borderTree = (x, y) => {
          if (
            x + 210 < g.camera.x - halfW ||
            x > g.camera.x + halfW ||
            y + 220 < g.camera.y - halfH ||
            y > g.camera.y + halfH
          )
            return;
          const seed = Math.abs(Math.round(x * 11 + y * 3)),
            width = 180 + (seed % 45),
            height = 200 + (seed % 40);
          B.drawProp(c, seed % 3 ? 8 : 9, x + (seed % 25), y, width, height, {
            wind: g.life.wind(w, x, y),
          });
        };
        // The physical limit reads as a wooded edge, not an invisible wall in grass.
        for (let x = -170; x < w.w + 170; x += 155) {
          borderTree(x, -195);
          borderTree(x, w.h - 10);
        }
        for (let y = -30; y < w.h; y += 150) {
          borderTree(-190, y);
          borderTree(w.w - 15, y);
        }
      }
      g.life.ground(c, g);

      for (const o of w.obstacles) if (o.kind === "chasm") this.obstacle(o);
      for (const f of w.fields) {
        const color =
          f.kind === "fire"
            ? "#f2a653"
            : f.kind === "crystal"
              ? "#9fdec8"
              : "#edc585";
        c.save();
        c.globalAlpha = Math.min(0.65, f.life * 2);
        ring(c, f.x, f.y, f.r, color, 4);
        c.restore();
      }
      for (const e of w.enemies)
        if (!e.dead && e.state === "windup") {
          const color =
            e.type === "heavy" || e.type === "king" || e.type === "executor"
              ? "#d15a43"
              : "#d4a64b";
          c.save();
          c.globalAlpha = 0.4;
          c.strokeStyle = color;
          c.fillStyle = color;
          c.lineWidth = 3;
          c.beginPath();
          if (e.type === "king" && e.phase === 1)
            c.ellipse(e.tx, e.ty, 100, 60, 0, 0, B.TAU);
          else if (
            e.type === "energy" ||
            (e.type === "king" && e.phase === 3)
          ) {
            c.moveTo(e.x, e.y - 25);
            c.lineTo(
              e.x + Math.cos(e.lockAngle) * 480,
              e.y + Math.sin(e.lockAngle) * 480 - 25,
            );
          } else {
            c.moveTo(e.x, e.y);
            c.arc(e.x, e.y, e.range, e.lockAngle - 1, e.lockAngle + 1);
            c.closePath();
          }
          c.stroke();
          c.globalAlpha = 0.1;
          c.fill();
          c.restore();
        }
      const items = [];
      for (const o of w.obstacles)
        if (
          o.kind !== "chasm" &&
          !o.open &&
          g.life.visible(
            g,
            o.x + o.w / 2,
            o.y + o.h / 2,
            Math.max(o.w, o.h) / 2 + 145,
          )
        )
          items.push({ y: o.y + o.h, draw: () => this.obstacle(o) });
      for (const o of w.objects)
        if (g.life.visible(g, o.x, o.y, 110))
          items.push({ y: o.y, draw: () => this.object(o) });
      for (const e of w.enemies)
        if (!e.dead && g.life.visible(g, e.x, e.y, 180))
          items.push({ y: e.y, draw: () => this.enemy(e) });
      if (w.zone === "intro") this.intro(items);
      else {
        items.push({ y: g.player.y, draw: () => this.player() });
        if (w.zone === "city") {
          items.push({
            y: 485,
            draw: () => B.drawActor(c, "Max", 325, 485, 1, { time: t }),
          });
          items.push({
            y: 500,
            draw: () => B.drawActor(c, "Gwen", 400, 500, 1, { time: t }),
          });
        }
      }
      items.sort((a, b) => a.y - b.y);
      for (const item of items) item.draw();
      for (const shot of w.shots) {
        c.save();
        c.translate(shot.x, shot.y - 32);
        c.rotate(shot.angle);
        if (shot.kind === "fire") {
          const glow = c.createRadialGradient(0, 0, 1, 0, 0, shot.r * 2);
          glow.addColorStop(0, "#fff6bc");
          glow.addColorStop(0.5, "#f8af4b");
          glow.addColorStop(1, "#f0752800");
          c.fillStyle = glow;
          c.fillRect(-shot.r * 2, -shot.r * 2, shot.r * 4, shot.r * 4);
        } else {
          c.fillStyle = shot.team === "player" ? "#bbe8db" : "#d994d5";
          c.strokeStyle = "#567677";
          c.beginPath();
          c.moveTo(16, 0);
          c.lineTo(-8, -shot.r);
          c.lineTo(-13, 0);
          c.lineTo(-8, shot.r);
          c.closePath();
          c.fill();
          c.stroke();
        }
        c.restore();
      }
      for (const a of g.particles) {
        c.globalAlpha = Math.max(0, a.life / a.max);
        c.fillStyle = a.color;
        c.beginPath();
        c.arc(a.x, a.y, a.size, 0, B.TAU);
        c.fill();
      }
      c.globalAlpha = 1;
      for (const a of g.texts) {
        c.globalAlpha = Math.min(1, a.life * 2);
        label(c, a.text, a.x, a.y, 12, a.color);
      }
      c.globalAlpha = 1;
      g.life.fixtures(c, g);
      g.life.air(c, g);
      for (const d of w.decor) {
        if (d.kind === "sign") {
          c.fillStyle = "#283f35ee";
          c.fillRect(d.x - 40, d.y - 28, 135, 26);
          label(c, d.text, d.x + 27, d.y - 11, 9, "#e6ddb8");
        }
      }
      if (w.exit) {
        ring(c, w.exit.x, w.exit.y, 48, "#c1df9b77", 3);
        label(c, "SALIDA →", w.exit.x, w.exit.y + 35, 10, "#d3e5a7");
      }
      if (w.zone !== "city" && w.zone !== "intro")
        label(c, "← REGRESAR", 85, 595, 9, "#c4d8a6");
    }
    obstacle(o) {
      const { x, y, w, h, kind } = o,
        c = this.c,
        g = this.g;
      if (kind === "bookcase") {
        B.drawBookcase(c, o);
        return;
      }
      if (kind === "building") {
        const box = B.buildingBox(o);
        B.drawProp(c, box.index, box.x, box.y, box.w, box.h);
        return;
      }
      if (kind === "tree") {
        c.save();
        const underCanopy =
          g.player.y < y + h + 10 &&
          g.player.y > y + h - 135 &&
          Math.abs(g.player.x - (x + w / 2)) < 58;
        B.drawProp(
          c,
          (x + y) % 3 ? 8 : 9,
          x + w / 2 - 65,
          y + h - 145,
          130,
          145,
          { wind: g.life.wind(g.world, x, y), fadeCanopy: underCanopy },
        );
        c.restore();
        return;
      }
      if (["car", "rv", "knightcar"].includes(kind)) {
        const box = B.vehicleBox(o);
        B.drawProp(c, box.index, box.x, box.y, box.w, box.h);
        return;
      }
      if (kind === "fountain") {
        B.drawProp(c, 10, x - 20, y - 70, w + 40, h + 70);
        g.life.fountain(c, o, g.world.time);
        return;
      }
      if (kind === "bench") {
        B.drawProp(c, 11, x, y - 35, w, h + 35);
        return;
      }
      if (kind === "crate") {
        B.drawProp(c, 12, x, y - 22, w, h + 22);
        return;
      }
      if (kind === "pillar" || kind === "crystal") {
        B.drawProp(c, 13, x, y - 70, w, h + 70);
        return;
      }
      if (kind === "machine") {
        B.drawProp(c, 14, x, y - 40, w, h + 40);
        return;
      }
      if (kind === "chasm") {
        c.fillStyle = "#152b36";
        c.fillRect(x, y, w, h);
        if (o.open) {
          c.fillStyle = "#87c7ba";
          c.fillRect(x, y, w, h);
          c.strokeStyle = "#d4ead2";
          c.strokeRect(x + 5, y + 5, w - 10, h - 10);
        }
        return;
      }
      if (kind === "gate") {
        const progress =
          g.world.objects.find((a) => a.id === "gate")?.progress || 0;
        c.save();
        c.globalAlpha = 1 - progress;
        B.drawProp(c, 15, x - 10, y - 30, w + 20, h + 30);
        c.restore();
        return;
      }
      if (kind === "fence" || kind === "security") {
        // A transparent mesh rises from the ground line, with posts rooted in it.
        const base = x + w * 0.68,
          top = base - 15,
          rise = 38;
        c.save();
        c.fillStyle = "#172b3024";
        c.beginPath();
        c.moveTo(base, y);
        c.lineTo(base + 18, y + 7);
        c.lineTo(base + 18, y + h + 7);
        c.lineTo(base, y + h);
        c.fill();
        c.save();
        c.beginPath();
        c.moveTo(base, y);
        c.lineTo(base, y + h);
        c.lineTo(top, y + h - rise);
        c.lineTo(top, y - rise);
        c.closePath();
        c.clip();
        c.fillStyle = "#6c879b12";
        c.fillRect(top, y - rise, base - top, h + rise);
        c.strokeStyle = kind === "security" ? "#8ca9b1aa" : "#92a19c99";
        c.lineWidth = 0.8;
        c.beginPath();
        for (let yy = y - rise - 32; yy < y + h + 32; yy += 9) {
          c.moveTo(top, yy);
          c.lineTo(base, yy + 21);
          c.moveTo(top, yy + 21);
          c.lineTo(base, yy);
        }
        c.stroke();
        c.restore();
        c.strokeStyle = "#465e61";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(top, y - rise);
        c.lineTo(top, y + h - rise);
        c.moveTo(base, y);
        c.lineTo(base, y + h);
        c.stroke();
        const posts = Math.ceil(h / 96);
        for (let i = 0; i <= posts; i++) {
          const yy = y + (h * i) / posts;
          c.fillStyle = "#57696a";
          c.beginPath();
          c.ellipse(base, yy, 5, 2.5, 0, 0, B.TAU);
          c.fill();
          c.strokeStyle = "#3e5357";
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(base, yy);
          c.lineTo(top, yy - rise);
          c.stroke();
          c.strokeStyle = "#b7c3b5";
          c.lineWidth = 1;
          c.stroke();
        }
        c.restore();
        return;
      }
      if (kind === "labwall" || kind === "shopwall") B.drawWall(c, o);
    }

    object(o) {
      const c = this.c,
        g = this.g;
      if (g.save.items.includes(o.id) || o.broken) return;
      const { x, y, type } = o;
      if (type === "safe") {
        ring(c, x, y, 27, "#a4dc7766");
        label(c, "DESCANSO", x, y + 21, 7, "#cee4ac");
        return;
      }
      if (["gate", "support", "heater"].includes(type)) {
        if (type === "gate" && o.progress >= 1) return;
        B.drawProp(c, 14, x - 31, y - 69, 62, 76);
        if (o.heat > 0) {
          c.fillStyle = "#283e45";
          c.fillRect(x - 25, y + 12, 50, 5);
          c.fillStyle = o.heat >= 100 ? "#f7d693" : "#e9a563";
          c.fillRect(x - 25, y + 12, o.heat * 0.5, 5);
        }
        return;
      }
      if (type === "bridge" || type === "socket") {
        B.drawProp(c, 13, x - 20, y - 50, 40, 56);
        if (o.progress > 0) ring(c, x, y, 27, "#b5e6c9", 2);
        return;
      }
      if (["health", "energy", "crate"].includes(type)) {
        if (o.requires && !g.save.flags[o.requires]) {
          B.drawProp(c, 12, x - 25, y - 45, 50, 50);
          return;
        }
        const color =
          type === "health"
            ? "#edaa91"
            : type === "energy"
              ? "#bcf07d"
              : "#e3c391";
        c.save();
        c.translate(x, y - 22 - Math.sin(g.clock * 3) * 3);
        c.fillStyle = color;
        c.strokeStyle = "#38594b";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -18);
        c.lineTo(12, -3);
        c.lineTo(0, 10);
        c.lineTo(-12, -3);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
      }
    }
    player() {
      const g = this.g,
        p = g.player,
        c = this.c;
      B.drawActor(c, p.form, p.x, p.y, 1, {
        time: g.world.time,
        walk: p.walk,
        moving: p.moving,
        combatReady: g.world.enemies.some((e) => !e.dead && B.dist(e, p) < 330),
        facing: p.attack?.angle ?? p.renderFacing ?? p.facing,
        attack: p.attack,
        special: p.specialPose,
        blocking: p.blocking,
        dodging: p.dodgeTime > 0,
        dodgeTime: p.dodgeTime,
        hurtTime: p.hurtTime,
        invuln: p.invuln,
      });
      if (
        p.attack?.fired &&
        p.attack.total - p.attack.time < p.attack.hitAt + 0.09
      ) {
        c.save();
        c.globalAlpha = 0.5;
        c.strokeStyle = B.form(p.form).color;
        c.lineWidth = p.attack.kind === "K" ? 5 : 3;
        c.beginPath();
        const a = p.attack,
          variant = a.variant ?? 0,
          reach = a.reach * 0.55;
        c.translate(p.x, p.y - (variant === 3 ? 9 : 35));
        c.rotate(a.angle);
        if (variant === 0) {
          c.moveTo(reach * 0.35, -3);
          c.lineTo(reach, -3);
        } else if (variant === 1) {
          c.moveTo(reach * 0.3, -reach * 0.45);
          c.quadraticCurveTo(
            reach * 1.2,
            -reach * 0.1,
            reach * 0.7,
            reach * 0.5,
          );
        } else if (variant === 2) {
          c.moveTo(reach * 0.2, reach * 0.35);
          c.quadraticCurveTo(reach * 1.05, 0, reach * 0.65, -reach * 0.5);
        } else {
          c.scale(1, 0.45);
          c.ellipse(reach * 0.4, 0, reach * 0.65, reach * 0.65, 0, 0, B.TAU);
        }
        c.stroke();
        c.restore();
      }
      if (p.blocking) {
        c.strokeStyle = "#c1e6ad";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(p.x, p.y - 28, 38, p.facing - 0.8, p.facing + 0.8);
        c.stroke();
      }
    }
    enemy(e) {
      const g = this.g,
        c = this.c,
        id =
          e.type === "executor"
            ? "executor"
            : e.type === "king"
              ? "king"
              : e.type;
      const scale = e.type === "heavy" ? 1.17 : 1;
      B.drawActor(c, id, e.x, e.y, scale, {
        time: g.world.time,
        walk: e.walk,
        moving: e.moving,
        combatReady: B.dist(e, g.player) < 350,
        facing: e.moving ? (e.moveFacing ?? e.facing) : e.facing,
        hurtTime: e.flash,
        armor: e.armor,
        scene: g.world.zone,
        phase: e.phase,
        flash: e.flash,
        attack:
          e.state === "windup"
            ? { time: 1, total: 1, hitAt: 1 }
            : e.state === "strike"
              ? { time: 0.1, total: 0.2, hitAt: 0 }
              : null,
      });
      if (e.hp < e.maxHp && !["king", "executor"].includes(e.type)) {
        c.fillStyle = "#24383c";
        c.fillRect(e.x - 21, e.y - 117 * scale, 42, 4);
        c.fillStyle = "#d8b86c";
        c.fillRect(
          e.x - 21,
          e.y - 117 * scale,
          42 * Math.max(0, e.hp / e.maxHp),
          4,
        );
      }
      if (e.type === "king" && e.phase === 1) {
        c.fillStyle = "#263c40";
        c.fillRect(e.x - 35, e.y - 161, 70, 5);
        c.fillStyle = "#f1b26c";
        c.fillRect(e.x - 35, e.y - 161, e.heat * 0.7, 5);
      }
    }
    intro(items) {
      const g = this.g,
        c = this.c,
        t = g.clock;
      B.drawProp(c, 14, 620, 330, 155, 290);
      const escaped = g.cine.escaped;
      items.push({
        y: 500,
        draw: () =>
          B.drawActor(c, "ben", escaped ? 350 : 695, escaped ? 690 : 500, 1, {
            facing: Math.PI / 2,
            time: t,
            walk: escaped ? t * 10 : 0,
            moving: escaped,
          }),
      });
      for (const [id, x, y] of [
        ["Vilgax", 870, 390],
        ["Kevin", 520, 340],
        ["Zombozo", 1000, 500],
        ["Hex", 410, 470],
        ["Dr. Ánimo", 520, 650],
        ["Malware", 1000, 670],
        ["Driscoll", 800, 720],
      ])
        items.push({
          y,
          draw: () => B.drawActor(c, id, x, y, 1, { scene: "intro", time: t }),
        });
      label(
        c,
        g.cine.fractured ? "EXTRACTOR DAÑADO" : "EXTRACTOR GENÉTICO",
        695,
        310,
        11,
        "#c9e2ad",
      );
    }
    menu() {
      const g = this.g,
        c = this.c,
        { w, h } = g.view;
      c.fillStyle = "#14251f";
      c.fillRect(0, 0, w, h);
      c.save();
      c.globalAlpha = 0.22;
      B.drawProp(c, 2, w * 0.54, h * 0.04, w * 0.5, h * 0.7);
      B.drawProp(c, 8, w * 0.68, h * 0.1, w * 0.4, h * 0.6);
      c.restore();
      const glow = c.createRadialGradient(
        w * 0.74,
        h * 0.5,
        5,
        w * 0.74,
        h * 0.5,
        w * 0.5,
      );
      glow.addColorStop(0, "#53884966");
      glow.addColorStop(1, "#10271b00");
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
      const s = Math.min(w / 1400, h / 900);
      c.save();
      c.globalAlpha = 0.36;
      B.drawActor(c, "four", w * 0.9, h * 0.79, s * 4.2, { shadow: false });
      c.globalAlpha = 0.4;
      B.drawActor(c, "heat", w * 0.53, h * 0.77, s * 4, { shadow: false });
      c.restore();
      B.drawActor(c, "ben", w * 0.735, h * 0.86, s * 5.6, { shadow: false });
      const fade = c.createLinearGradient(0, 0, w * 0.61, 0);
      fade.addColorStop(0, "#101e17");
      fade.addColorStop(0.7, "#101e17ee");
      fade.addColorStop(1, "#101e1700");
      c.fillStyle = fade;
      c.fillRect(0, 0, w * 0.62, h);
    }
  }
  B.Renderer = Renderer;
})(window.B10);
