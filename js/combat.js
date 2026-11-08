"use strict";
(function (B) {
  B.attack = (g, kind) => {
    const p = g.player;
    if (p.dodgeTime > 0 || p.specialPose) return false;
    if (p.attackCD > 0) {
      g.buffer = kind;
      g.bufferTimer = 0.24;
      return false;
    }
    const f = B.form(p.form),
      heavy = kind === "K";
    p.combo = (p.combo + kind).slice(-3);
    p.comboTimer = 1.25;
    const finisher = p.combo.length === 3,
      pattern = p.combo;
    let damage = (heavy ? f.heavy : f.light) * (finisher ? 1.45 : 1),
      reach = f.reach + (heavy ? 25 : 0),
      aoe = false;
    if (p.form === "four" && g.has("four", 2) && pattern === "JKJ") {
      damage *= 2;
      reach += 40;
      aoe = true;
    }
    if (p.form === "four" && g.has("four", 0) && heavy && finisher) {
      reach = 185;
      aoe = true;
      g.field(p.x, p.y, 185, 0.32, "shock", 0);
    }
    p.attackCD = heavy ? 0.52 : 0.25;
    p.attack = {
      kind,
      time: heavy ? 0.48 : 0.25,
      total: heavy ? 0.48 : 0.25,
      hitAt: heavy ? 0.13 : 0.055,
      angle: p.facing,
      finisher,
      pattern,
      variant: heavy ? 3 : Math.min(2, pattern.length - 1),
      damage,
      reach,
      aoe,
      fired: false,
    };
    p.blocking = false;
    return true;
  };
  B.advanceAttack = (g, dt) => {
    const p = g.player,
      a = p.attack;
    if (!a) return;
    const before = a.total - a.time;
    a.time -= dt;
    if ((p.form === "ben" || p.form === "four") && a.hitAt !== undefined) {
      const distance = [8, 11, 14, 20][a.variant ?? (a.kind === "K" ? 3 : 0)];
      const drive =
        distance *
        (B.clamp((a.total - a.time - a.hitAt) / 0.09, 0, 1) -
          B.clamp((before - a.hitAt) / 0.09, 0, 1));
      if (drive > 0)
        B.move(g, p, Math.cos(a.angle) * drive, Math.sin(a.angle) * drive);
    }
    if (!a.fired && a.total - a.time >= a.hitAt) {
      a.fired = true;
      B.resolveAttack(g, a);
    }
    if (a.time <= 0) p.attack = null;
  };
  B.resolveAttack = (g, a) => {
    const p = g.player,
      heavy = a.kind === "K",
      { damage, reach, aoe, finisher, pattern } = a;
    g.audio.play(
      p.form === "heat" ? "fire" : heavy ? "heavy" : "light",
      a.variant,
    );
    if (p.form === "heat") {
      if (!heavy) {
        g.shoot(p.x, p.y, a.angle, 550, damage, "fire", "player", 11, 1.1);
      } else {
        B.melee(g, damage, 170, 1.0, finisher, false);
        for (let offset = -2; offset <= 2; offset++)
          g.shoot(
            p.x,
            p.y,
            a.angle + offset * 0.17,
            380,
            damage * 0.4,
            "fire",
            "player",
            9,
            0.42,
          );
      }
    } else if (p.form === "diamond") {
      const spread = heavy
        ? [-0.24, 0, 0.24]
        : g.has("diamond", 0)
          ? [-0.13, 0, 0.13]
          : [0];
      for (const offset of spread)
        g.shoot(
          p.x,
          p.y,
          a.angle + offset,
          heavy ? 470 : 640,
          damage,
          "crystal",
          "player",
          heavy ? 12 : 8,
          1.05,
        );
      if (heavy) B.melee(g, damage, 105, 1.2, true, false);
    } else B.melee(g, damage, reach, aoe ? 1.5 : 1.05, finisher || heavy, aoe);
    if (finisher) {
      g.ui.comboLabel = {
        text:
          {
            JJJ: "TRIPLE IMPACTO",
            JJK: "REMATE PESADO",
            JKJ: "CONTRA RITMO",
            KJK: "ROMPEDEFENSAS",
          }[pattern] || "COMBO ALIENÍGENA",
        time: 2,
      };
      p.combo = "";
    }
  };
  B.melee = (g, damage, reach, arc, knock, full) => {
    const p = g.player;
    const angle = p.attack?.angle ?? p.facing;
    for (const e of g.world.enemies) {
      if (
        e.dead ||
        B.dist(p, e) > reach + e.r ||
        (!full && Math.abs(B.wrap(B.angle(p, e) - angle)) > arc)
      )
        continue;
      B.hitEnemy(g, e, damage, {
        power: p.form,
        heavy: p.attack?.kind === "K",
        knock: knock ? 85 : 24,
        angle,
      });
    }
    const x = p.x + Math.cos(angle) * reach * 0.55,
      y = p.y + Math.sin(angle) * reach * 0.55;
    B.applyPuzzle(g, x, y, reach * 0.75, p.form, p.attack?.kind === "K");
  };
  B.special = (g) => {
    const p = g.player;
    if (p.form === "ben") {
      g.ui.toast("Transforma a Ben para usar una habilidad especial");
      return;
    }
    if (p.specialCD > 0 || p.energy < 10) return;
    p.specialCD = (p.form === "four" ? 7 : 6) * (g.has(p.form, 5) ? 0.7 : 1);
    p.specialPose = {
      time: 0.65,
      total: 0.65,
      hitAt: 0.14,
      fired: false,
      variant: 3,
    };
    p.attack = null;
    p.energy -= 10;
    p.attackCD = 0.65;
    p.invuln = 0.3;
  };
  B.advanceSpecial = (g, dt) => {
    const a = g.player.specialPose;
    if (!a) return;
    a.time -= dt;
    if (!a.fired && a.total - a.time >= a.hitAt) {
      a.fired = true;
      B.resolveSpecial(g);
    }
    if (a.time <= 0) g.player.specialPose = null;
  };
  B.resolveSpecial = (g) => {
    const p = g.player;
    g.audio.play("heavy");
    g.shake = 2;
    if (p.form === "heat") {
      g.field(
        p.x,
        p.y,
        205,
        g.has("heat", 1) ? 4 : 0.55,
        "fire",
        g.has("heat", 1) ? 20 : 0,
      );
      g.burst(p.x, p.y, "#ffa849", 40);
      B.melee(g, 65, 215, Math.PI, true, true);
      B.applyPuzzle(g, p.x, p.y, 215, "heat", true);
    } else if (p.form === "four") {
      g.field(p.x, p.y, 235, 0.6, "shock", 0);
      g.burst(p.x, p.y, "#e8d2a0", 40);
      B.melee(g, 90, 235, Math.PI, true, true);
      B.applyPuzzle(g, p.x, p.y, 235, "four", true);
      for (const e of g.world.enemies) if (B.dist(p, e) < 235) e.stun = 1.4;
    } else if (p.form === "diamond") {
      g.field(
        p.x,
        p.y,
        190,
        g.has("diamond", 2) ? 5 : 1.5,
        "crystal",
        g.has("diamond", 2) ? 18 : 0,
      );
      p.invuln = 1.3;
      for (let j = 0; j < 12; j++)
        g.shoot(
          p.x,
          p.y,
          (j * B.TAU) / 12,
          430,
          32,
          "crystal",
          "player",
          9,
          0.9,
        );
      B.applyPuzzle(g, p.x, p.y, 210, "diamond", true);
    }
  };
  B.hitEnemy = (g, e, damage, hit = {}) => {
    if (e.dead) return;
    if (hit.power && g.has(hit.power, 3)) damage *= 1.2;
    let blocked = false;
    if (e.type === "king" && e.phase === 1) {
      if (hit.power === "heat" && e.armor > 0) {
        e.heat = Math.min(100, e.heat + (hit.heavy ? 40 : 23));
        e.flash = 0.15;
        if (e.heat === 100)
          g.ui.toast("ARMADURA FRÁGIL · X → 1 → golpes fuertes (K)");
        damage = 1;
      } else if (
        hit.power === "four" &&
        hit.heavy &&
        e.heat >= 100 &&
        e.armor > 0
      ) {
        e.crack++;
        e.stun = 0.6;
        g.shake = 10;
        g.burst(e.x, e.y, "#b7f5de", 22);
        damage = 2;
        if (e.crack >= 2) {
          e.crack = 0;
          e.heat = 0;
          e.armor--;
          e.hp -= 180;
          e.vulnerable = 5;
          g.audio.play("heavy");
          g.ui.toast(
            e.armor
              ? "PLACA DESTRUIDA · una más para romper la armadura"
              : "ARMADURA DESTRUIDA · cuidado con su espada",
          );
          if (e.armor === 0) {
            e.phase = 2;
            e.state = "idle";
            e.timer = 0.8;
            e.speed = 155;
            g.audio.play("boss");
          }
        }
      } else if (e.vulnerable <= 0) {
        damage *= 0.025;
        blocked = true;
      }
    }
    const front = Math.abs(B.wrap(B.angle(e, g.player) - e.facing)) < 1.05;
    if (
      (e.type === "shield" || e.type === "executor") &&
      front &&
      e.state !== "recover" &&
      e.stun <= 0 &&
      !hit.heavy
    ) {
      damage *= 0.2;
      blocked = true;
    }
    if (hit.heavy && front && e.type === "shield") {
      e.stun = 0.8;
      g.audio.play("block");
    }
    if (
      e.type === "king" &&
      e.phase === 2 &&
      e.state === "guard" &&
      !hit.heavy
    ) {
      damage *= 0.2;
      blocked = true;
      e.cd = 0.1;
    }
    e.hp -= damage;
    if (e.type === "king" && e.phase === 1 && e.armor > 0)
      e.hp = Math.max(720, e.hp);
    e.flash = 0.16;
    if (!blocked) {
      if (
        e.type !== "king" &&
        e.type !== "executor" &&
        (hit.heavy || e.type === "basic" || e.type === "energy")
      ) {
        e.state = "recover";
        e.timer = 0.35;
      }
      e.stun = Math.max(
        e.stun,
        e.type === "king" ? 0.08 : e.type === "executor" ? 0.12 : 0.2,
      );
      if (hit.knock && e.type !== "king" && e.type !== "executor") {
        e.knockVX = B.clamp(
          (e.knockVX || 0) + Math.cos(hit.angle ?? 0) * hit.knock * 10,
          -750,
          750,
        );
        e.knockVY = B.clamp(
          (e.knockVY || 0) + Math.sin(hit.angle ?? 0) * hit.knock * 10,
          -750,
          750,
        );
      }
    }
    g.burst(
      e.x,
      e.y,
      blocked ? "#d7dcbe" : hit.power === "heat" ? "#ffc160" : "#d9faac",
      blocked ? 4 : 9,
    );
    g.audio.play(blocked ? "block" : "hit");
    if (!blocked) {
      g.player.hitCount++;
      g.player.hitTimer = 2.8;
      g.shake = Math.max(g.shake, hit.heavy ? 5 : 2);
      g.hitstop = Math.max(g.hitstop, hit.heavy ? 0.025 : 0.008);
    }
    g.floatText(
      e.x,
      e.y - 38,
      blocked ? "DEFENSA" : Math.max(1, Math.round(damage)),
      blocked ? "#b1c19b" : "#edffc8",
    );
    if (e.hp <= 0) {
      e.dead = true;
      g.save.flags["dead:" + e.id] = true;
      g.save.kills++;
      g.addXP(e.xp);
      g.burst(e.x, e.y, "#d6dfbd", 20);
      g.player.hp = Math.min(
        g.player.maxHp,
        g.player.hp + (e.type === "king" ? 50 : 6),
      );
      if (e.type === "executor") {
        g.save.flags.executor = true;
        g.persist();
        g.defer = 0.8;
        g.pending = () => g.ui.scene("executorEnd");
      }
      if (e.type === "king") {
        g.save.flags.king = true;
        g.persist();
        g.defer = 1;
        g.pending = () =>
          g.ui.scene("recovery", () => {
            B.loadZone(g, "escape", false);
            g.ui.toast(
              "DIAMANTE DESBLOQUEADO · 3 para transformar · crea un puente al este",
            );
          });
      }
    }
  };
  B.hurtPlayer = (g, damage, source, unblockable = false) => {
    const p = g.player;
    if (p.invuln > 0 || g.mode !== "play") return false;
    const f = B.form(p.form);
    let blocked =
      p.blocking &&
      !unblockable &&
      Math.abs(B.wrap(B.angle(p, source) - p.facing)) < 1.4;
    if (blocked) {
      if (p.blockTime < 0.22) {
        p.invuln = 0.3;
        g.audio.play("block");
        g.ui.toast("¡PARRY!");
        if (source.type) {
          source.stun = 1.3;
          source.state = "recover";
          if (p.form === "four" && g.has("four", 1))
            B.hitEnemy(g, source, 65, {
              power: "four",
              heavy: true,
              knock: 80,
              angle: p.facing,
            });
        }
        return false;
      }
      damage *= p.form === "diamond" ? 0.12 : p.form === "four" ? 0.2 : 0.55;
      g.audio.play("block");
    }
    p.hp -=
      damage *
      f.armor *
      (g.has(p.form, 4) ? 0.8 : 1) *
      (g.settings.difficulty === "story" ? 0.6 : 1);
    p.invuln = blocked ? 0.18 : 0.65;
    p.hitCount = 0;
    g.shake = blocked ? 2 : 6;
    g.audio.play(blocked ? "block" : "hurt");
    g.burst(p.x, p.y, blocked ? "#b3f868" : "#ed8868", 12);
    if (!blocked && source) {
      const a = B.angle(source, p);
      p.hurtTime = 0.18;
      p.knockVX = Math.cos(a) * 280;
      p.knockVY = Math.sin(a) * 280;
    }
    if (p.hp <= 0) {
      p.hp = 0;
      g.defeat();
    }
    return true;
  };
  B.updateEnemies = (g, dt) => {
    const p = g.player,
      w = g.world;
    let tokens = w.enemies.filter(
      (e) => e.state === "windup" || e.state === "strike",
    ).length;
    const commander = w.enemies.some(
      (e) => e.type === "commander" && !e.dead && B.dist(e, p) < 650,
    );
    for (const e of w.enemies) {
      if (e.dead) continue;
      e.moving = false;
      if (Math.hypot(e.knockVX || 0, e.knockVY || 0) > 1) {
        B.move(g, e, (e.knockVX || 0) * dt, (e.knockVY || 0) * dt);
        e.knockVX *= Math.exp(-10 * dt);
        e.knockVY *= Math.exp(-10 * dt);
      }
      for (const k of ["cd", "stun", "flash", "vulnerable"])
        e[k] = Math.max(0, e[k] - dt);
      const dist = B.dist(e, p);
      // A prepared strike commits its direction, allowing the player to flank it.
      if (e.state === "idle" || e.state === "guard") e.facing = B.angle(e, p);
      if (e.stun > 0) continue;
      e.timer -= dt;
      const boss = e.type === "king",
        mini = e.type === "executor";
      e.evadeCD = Math.max(0, (e.evadeCD || 0) - dt);
      if (
        e.type === "commander" &&
        e.state === "idle" &&
        p.attack?.kind === "K" &&
        dist < 160 &&
        e.evadeCD <= 0
      ) {
        const a = e.facing + Math.PI / 2;
        B.move(g, e, Math.cos(a) * 90, Math.sin(a) * 90);
        e.evadeCD = 3;
        e.cd = 0.2;
        g.burst(e.x, e.y, "#d1c396", 7);
      }
      if (mini && e.hp < e.maxHp * 0.5 && e.phase === 1) {
        e.phase = 2;
        e.speed = 125;
        g.audio.play("boss");
        g.ui.toast("EL EJECUTOR · furia desatada");
      }
      if (boss && e.phase === 2 && e.hp < 330) {
        e.phase = 3;
        e.timer = 0.6;
        e.state = "idle";
        e.cd = 1;
        g.audio.play("boss");
        g.ui.toast(
          "EL REY SE RETIRA · evita sus disparos y corta la distancia",
        );
      }
      if (boss && e.phase === 3) {
        e.summon = (e.summon || 0) - dt;
        if (e.summon <= 0) {
          e.summon = 9;
          const n = w.enemies.filter((a) => !a.dead && a !== e).length;
          for (let j = n; j < 2; j++)
            w.enemies.push(
              B.makeEnemy(
                "basic",
                e.x - 160,
                e.y + (j ? 120 : -120),
                "reinforcement-" + g.clock + "-" + j,
              ),
            );
        }
      }
      if (dist > 700 && e.state === "idle") continue;
      if (e.state === "windup") {
        if (e.timer <= 0) {
          e.state = "strike";
          e.timer = 0.2;
          e.attackN++;
          if (
            e.type === "energy" ||
            (boss && (e.phase === 3 || (e.phase === 1 && e.attackN % 2 === 0)))
          ) {
            const spread = boss ? [-0.2, 0, 0.2] : [0];
            for (const offset of spread)
              g.shoot(
                e.x,
                e.y,
                e.lockAngle + offset,
                boss ? 300 : 280,
                e.damage,
                boss ? "darkcrystal" : "energy",
                "enemy",
                10,
                3,
              );
          } else if (boss && e.phase === 1) {
            g.field(e.tx, e.ty, 100, 0.45, "danger", 0);
            if (B.dist(p, { x: e.tx, y: e.ty }) < 100)
              B.hurtPlayer(g, e.damage, e, true);
          } else {
            const reach = e.range + (boss && e.phase === 2 ? 40 : 0);
            if (
              B.dist(e, p) < reach + 22 &&
              (Math.abs(B.wrap(B.angle(e, p) - e.lockAngle)) < 1.3 ||
                e.attackN % 3 === 0)
            )
              B.hurtPlayer(
                g,
                e.damage * (commander ? 1.1 : 1),
                e,
                (mini || boss) && e.attackN % 3 === 0,
              );
            if (boss && e.phase === 2) {
              B.move(
                g,
                e,
                Math.cos(e.lockAngle) * 95,
                Math.sin(e.lockAngle) * 95,
              );
              if (B.dist(e, p) < 95) B.hurtPlayer(g, e.damage, e, true);
            }
          }
          g.audio.play(mini || boss ? "heavy" : "light");
        }
        continue;
      }
      if (e.state === "strike") {
        if (e.timer <= 0) {
          e.state = "recover";
          e.timer =
            boss && e.phase === 2 ? 0.45 : mini && e.phase === 2 ? 0.55 : 0.85;
        }
        continue;
      }
      if (e.state === "recover" || e.state === "guard") {
        if (e.timer <= 0) {
          e.state = "idle";
          e.cd = (commander ? 0.7 : 1) * (boss ? 0.55 : 1);
        }
        continue;
      }
      const ranged = e.type === "energy" || (boss && e.phase === 3);
      if (dist < (ranged ? 520 : e.range + 28) && e.cd <= 0 && tokens < 2) {
        e.state = "windup";
        e.timer =
          boss && e.phase === 2
            ? 0.43
            : mini
              ? 0.85
              : e.type === "heavy"
                ? 1.05
                : 0.68;
        e.windTotal = e.timer;
        e.lockAngle = e.facing;
        e.tx = p.x;
        e.ty = p.y;
        tokens++;
        continue;
      }
      let a = e.facing,
        move = 0;
      if (ranged) {
        if (dist < 220) {
          a += Math.PI;
          move = e.speed * 0.7;
        } else if (dist > 360) move = e.speed;
        else {
          a += Math.PI / 2;
          move = e.speed * 0.35;
        }
      } else if (dist > e.range * 0.82) move = e.speed;
      if (
        boss &&
        e.phase === 2 &&
        e.cd > 0.2 &&
        e.attackN % 3 === 1 &&
        dist < 160
      ) {
        e.state = "guard";
        e.timer = 0.5;
        continue;
      }
      // Space the formation so a single attack token doesn't produce an unreadable pile.
      let dx = Math.cos(a) * move * dt,
        dy = Math.sin(a) * move * dt;
      for (const other of w.enemies) {
        if (other === e || other.dead) continue;
        const d = B.dist(e, other);
        if (d < e.r + other.r + 12 && d > 0) {
          dx += ((e.x - other.x) / d) * 45 * dt;
          dy += ((e.y - other.y) / d) * 45 * dt;
        }
      }
      const beforeX = e.x,
        beforeY = e.y;
      B.move(g, e, dx, dy);
      const moved = Math.hypot(e.x - beforeX, e.y - beforeY);
      e.moving = moved > 0.01;
      if (e.moving) {
        e.walk += moved / 18;
        e.moveFacing = Math.atan2(e.y - beforeY, e.x - beforeX);
      }
    }
  };
  B.updateEffects = (g, dt) => {
    const w = g.world;
    for (const s of w.shots) {
      if (s.life <= 0) continue;
      s.life -= dt;
      const steps = Math.max(1, Math.ceil((s.speed * dt) / 12));
      for (let n = 0; n < steps && s.life > 0; n++) {
        s.x += (Math.cos(s.angle) * s.speed * dt) / steps;
        s.y += (Math.sin(s.angle) * s.speed * dt) / steps;
        if (s.team === "player") {
          const e = w.enemies.find((e) => !e.dead && B.dist(s, e) < e.r + s.r);
          if (e) {
            B.hitEnemy(g, e, s.damage, {
              power: s.kind === "fire" ? "heat" : "diamond",
              heavy: s.r > 10,
              knock: 15,
              angle: s.angle,
            });
            if (s.kind === "fire" && g.has("heat", 0))
              for (const a of w.enemies)
                if (a !== e && !a.dead && B.dist(a, s) < 90)
                  B.hitEnemy(g, a, s.damage * 0.5, { power: "heat" });
            s.life = 0;
          }
          for (const o of w.objects)
            if (
              ["gate", "heater", "support", "bridge", "socket"].includes(
                o.type,
              ) &&
              !o.broken &&
              !s.touched.has(o.id) &&
              B.dist(s, o) < o.r + s.r
            ) {
              s.touched.add(o.id);
              B.applyPuzzle(
                g,
                o.x,
                o.y,
                3,
                s.kind === "fire" ? "heat" : "diamond",
                s.r > 10,
              );
              s.life = 0;
            }
        } else if (B.dist(s, g.player) < g.player.r + s.r) {
          if (
            g.player.form === "diamond" &&
            g.player.blocking &&
            g.has("diamond", 1)
          ) {
            s.team = "player";
            s.angle += Math.PI;
            s.damage *= 1.5;
            g.audio.play("block");
          } else {
            B.hurtPlayer(g, s.damage, s);
            s.life = 0;
          }
        }
        if (
          w.obstacles.some((o) => !o.open && B.circleRect(s.x, s.y, s.r, o))
        ) {
          s.life = 0;
        }
      }
      if (s.life <= 0)
        g.burst(
          s.x,
          s.y,
          s.kind === "fire"
            ? "#ffc04f"
            : s.team === "enemy"
              ? "#ef7973"
              : "#a2f2db",
          6,
        );
    }
    w.shots = w.shots.filter((s) => s.life > 0);
    for (const f of w.fields) {
      f.life -= dt;
      f.tick -= dt;
      if (f.tick <= 0 && f.damage) {
        f.tick = 0.45;
        for (const e of w.enemies)
          if (!e.dead && B.dist(e, f) < f.r) {
            B.hitEnemy(g, e, f.damage * 0.45, {
              power: f.kind === "fire" ? "heat" : "diamond",
            });
            if (f.kind === "crystal") e.stun = 0.3;
          }
      }
    }
    w.fields = w.fields.filter((f) => f.life > 0);
    for (const a of g.particles) {
      a.life -= dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.vx *= 1 - dt * 3;
      a.vy *= 1 - dt * 3;
    }
    g.particles = g.particles.filter((a) => a.life > 0);
    for (const t of g.texts) {
      t.life -= dt;
      t.y -= dt * 30;
    }
    g.texts = g.texts.filter((t) => t.life > 0);
  };
})(window.B10);
