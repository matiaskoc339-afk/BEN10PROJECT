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
    ground() {
      B.SideScene.background(this.c, this.g);
    }
    world() {
      const g = this.g,
        c = this.c,
        w = g.world,
        t = w.time;
      this.ground();
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
            y: 625,
            draw: () =>
              B.drawStageActor(c, g, "Max", 430, 625, 1, {
                time: t,
                speaking:
                  g.ui.dialogue?.scene.lines[g.ui.dialogue.index]?.who ===
                  "Max",
              }),
          });
          items.push({
            y: 650,
            draw: () =>
              B.drawStageActor(c, g, "Gwen", 530, 650, 1, {
                time: t,
                speaking:
                  g.ui.dialogue?.scene.lines[g.ui.dialogue.index]?.who ===
                  "Gwen",
              }),
          });
        }
      }
      items.sort((a, b) => a.y - b.y);
      for (const item of items) item.draw();
      for (const shot of w.shots) {
        c.save();
        c.translate(shot.x, shot.y - (shot.height ?? 62));
        c.rotate(shot.angle);
        if (shot.kind === "fire") {
          const pulse = Math.sin(t * 32 + shot.x * 0.03) * 3;
          c.fillStyle = "#f57935bb";
          c.beginPath();
          c.moveTo(shot.r + 7, 0);
          c.quadraticCurveTo(
            -shot.r,
            -shot.r - pulse,
            -shot.r * 3.5,
            -shot.r * 0.3,
          );
          c.lineTo(-shot.r * 2.2, 0);
          c.lineTo(-shot.r * 3.2, shot.r * 0.55);
          c.quadraticCurveTo(-shot.r, shot.r + pulse, shot.r + 7, 0);
          c.fill();
          const glow = c.createRadialGradient(0, 0, 1, 0, 0, shot.r * 2);
          glow.addColorStop(0, "#fff6bc");
          glow.addColorStop(0.5, "#f8af4b");
          glow.addColorStop(1, "#f0752800");
          c.fillStyle = glow;
          c.fillRect(-shot.r * 2, -shot.r * 2, shot.r * 4, shot.r * 4);
          c.fillStyle = "#fff1a8";
          c.beginPath();
          c.ellipse(0, 0, shot.r, shot.r * 0.55, 0, 0, B.TAU);
          c.fill();
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
      for (const impact of w.impacts || []) this.impact(impact);
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
      B.SideScene.ambient(c, g);
      B.SideScene.foreground(c, g);
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
      B.SideScene.obstacle(this.c, this.g, o);
    }
    object(o) {
      B.SideScene.object(this.c, this.g, o);
    }
    player() {
      const g = this.g,
        p = g.player,
        c = this.c;
      B.drawStageActor(c, g, p.form, p.x, p.y, 1, {
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
        dodgeDuration: p.dodgeDuration,
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
        c.translate(
          p.x,
          p.y -
            (p.form === "heat" && variant === 3 ? 78 : variant === 2 ? 42 : 77),
        );
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
      B.drawStageActor(c, g, id, e.x, e.y, scale, {
        time: g.world.time,
        walk: e.walk,
        moving: e.moving && g.mode !== "dialogue",
        combatReady: B.dist(e, g.player) < 350,
        facing:
          Math.abs(Math.cos(e.facing)) < 0.08
            ? (e.sideFacing ?? Math.PI)
            : e.facing,
        hurtTime: e.flash,
        armor: e.armor,
        scene: g.world.zone,
        phase: e.phase,
        flash: e.flash,
        attack:
          e.state === "windup"
            ? { time: 1, total: 1, hitAt: 1 }
            : e.state === "strike"
              ? { time: 0.1, total: 0.2, hitAt: 0.08, fired: true }
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
        t = g.world.time,
        shot = B.cineShot(g);
      items.push({
        y: 635,
        draw: () => {
          B.drawProp(c, 28, 535, 340, 320, 310);
          if (g.cine.extract && !g.cine.fractured) {
            B.SideScene.glow(
              c,
              695,
              540,
              130,
              "#adff91",
              0.16 + Math.sin(t * 12) * 0.04,
            );
            c.save();
            c.strokeStyle = "#bdff9c";
            c.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              c.beginPath();
              c.ellipse(
                695,
                538 + i * 25 + Math.sin(t * 4) * 8,
                57,
                10,
                0,
                0,
                B.TAU,
              );
              c.stroke();
            }
            c.restore();
          }
        },
      });
      items.push({
        y: shot.ben.y,
        draw: () =>
          B.drawStageActor(c, g, "ben", shot.ben.x, shot.ben.y, 1.15, {
            time: t,
            facing: shot.ben.facing,
            moving: shot.ben.moving,
            walk: shot.ben.walk,
            combatReady: g.cine.fractured,
            cinePose: shot.ben.pose,
          }),
      });
      for (const actor of shot.actors)
        items.push({
          y: actor.y,
          draw: () => {
            B.drawStageActor(
              c,
              g,
              actor.id,
              actor.x,
              actor.y,
              actor.speaking ? 1.08 : 1,
              {
                scene: "intro",
                time: t,
                facing: actor.facing,
                cinePose: actor.pose,
              },
            );
          },
        });
      if (g.cine.fractured) {
        const q = B.clamp((t - g.cine.fractureAt) / 1.7, 0, 1);
        if (q < 1)
          for (let i = 0; i < 7; i++) {
            const a = (i * B.TAU) / 7,
              x = 695 + Math.cos(a) * q * 440,
              y = 545 + Math.sin(a) * q * 150;
            B.SideScene.glow(
              c,
              x,
              y,
              24,
              ["#74d6ff", "#8cedad", "#efb4fa", "#ffd48c"][i % 4],
              0.6 * (1 - q),
            );
            c.fillStyle = "#deffad";
            c.beginPath();
            c.arc(x, y, 4 * (1 - q), 0, B.TAU);
            c.fill();
          }
      }
      if (g.cine.brawl) {
        const n = Math.floor(t * 5),
          x = 930 + Math.sin(n * 4) * 100,
          y = 490 + Math.cos(n) * 35;
        this.impact({
          x,
          y,
          angle: n,
          life: 0.08 + ((t * 5) % 1) * 0.08,
          max: 0.18,
          heavy: true,
        });
      }
    }
    impact(a) {
      const c = this.c,
        q = Math.max(0, a.life / a.max);
      c.save();
      c.translate(a.x, a.y);
      c.rotate(a.angle);
      c.globalAlpha = q;
      c.fillStyle = "#ffedb6";
      c.strokeStyle = "#ea9e54";
      c.lineWidth = 1.5;
      c.beginPath();
      for (let i = 0; i < 16; i++) {
        const angle = (i * B.TAU) / 16,
          r = (i % 2 ? 5 : a.heavy ? 32 : 22) * (1.3 - q * 0.3);
        c.lineTo(Math.cos(angle) * r, Math.sin(angle) * r * 0.7);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }
    menu() {
      const g = this.g,
        c = this.c,
        { w, h } = g.view;
      c.fillStyle = "#14251f";
      c.fillRect(0, 0, w, h);
      const street = B.sheets.scene_city?.img;
      if (street) {
        const height = h * 0.9,
          width = (street.width / street.height) * height;
        c.save();
        c.globalAlpha = 0.56;
        c.drawImage(street, w * 0.3, -h * 0.02, width, height);
        c.restore();
      }
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
