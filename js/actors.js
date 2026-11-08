"use strict";
(function (B) {
  B.makePlayer = () => ({
    x: 270,
    y: 550,
    r: 19,
    hp: 120,
    maxHp: 120,
    energy: 100,
    maxEnergy: 100,
    form: "ben",
    facing: 0,
    vx: 0,
    vy: 0,
    walk: 0,
    invuln: 0,
    attack: null,
    attackCD: 0,
    specialCD: 0,
    dodgeCD: 0,
    dodgeTime: 0,
    dodgeAngle: 0,
    blocking: false,
    blockTime: 0,
    locked: false,
    queued: null,
    combo: "",
    comboTimer: 0,
    hitCount: 0,
    hitTimer: 0,
  });
  B.enemyTypes = {
    basic: {
      hp: 68,
      speed: 110,
      damage: 12,
      range: 65,
      color: "#a9b4b1",
      xp: 25,
    },
    shield: {
      hp: 100,
      speed: 90,
      damage: 15,
      range: 70,
      color: "#8eab99",
      xp: 35,
    },
    heavy: {
      hp: 155,
      speed: 72,
      damage: 25,
      range: 105,
      color: "#a89b7d",
      xp: 50,
    },
    energy: {
      hp: 60,
      speed: 96,
      damage: 12,
      range: 310,
      color: "#a3a5c7",
      xp: 35,
    },
    commander: {
      hp: 150,
      speed: 115,
      damage: 18,
      range: 90,
      color: "#ddbe77",
      xp: 65,
    },
    executor: {
      hp: 520,
      speed: 85,
      damage: 27,
      range: 140,
      color: "#ae9f82",
      xp: 150,
    },
    king: {
      hp: 1080,
      speed: 95,
      damage: 23,
      range: 160,
      color: "#a5dbd0",
      xp: 300,
    },
  };
  B.makeEnemy = (type, x, y, id) => ({
    type,
    x,
    y,
    id,
    ...B.enemyTypes[type],
    maxHp: B.enemyTypes[type].hp,
    r: type === "executor" || type === "king" ? 34 : 21,
    facing: Math.PI,
    state: "idle",
    timer: 0.6,
    cd: 0.7 + Math.random(),
    stun: 0,
    flash: 0,
    walk: 0,
    phase: 1,
    armor: type === "king" ? 2 : 0,
    heat: 0,
    crack: 0,
    vulnerable: 0,
    attackN: 0,
    dead: false,
    homeX: x,
    homeY: y,
  });
  B.circleRect = (x, y, r, o) => {
    const px = B.clamp(x, o.x, o.x + o.w),
      py = B.clamp(y, o.y, o.y + o.h);
    return (x - px) ** 2 + (y - py) ** 2 < r * r;
  };
  B.move = (g, a, dx, dy) => {
    const obs = g.world.obstacles.filter((o) => !o.open);
    let nx = B.clamp(a.x + dx, a.r, g.world.w - a.r),
      ny = B.clamp(a.y + dy, a.r, g.world.h - a.r);
    if (!obs.some((o) => B.circleRect(nx, a.y, a.r, o))) a.x = nx;
    if (!obs.some((o) => B.circleRect(a.x, ny, a.r, o))) a.y = ny;
  };
  B.transform = (g, id) => {
    const p = g.player;
    if (!g.save.unlocked.includes(id)) {
      g.ui.toast("ADN bloqueado · " + B.form(id).role);
      return false;
    }
    if (p.locked || p.energy < 8) {
      g.ui.toast("Omnitrix en recuperación · permanece como Ben");
      return false;
    }
    if (p.form !== "ben" && !g.save.flags.master) {
      if (p.form !== id) {
        p.queued = id;
        g.ui.toast(
          B.form(id).name +
            " preparado · X para volver a Ben, después " +
            g.keyLabel("interact") +
            " para transformar",
        );
      }
      return false;
    }
    p.specialPose = null;
    p.form = id;
    p.queued = null;
    p.attack = null;
    p.combo = "";
    p.attackCD = 0;
    p.invuln = 0.7;
    g.audio.play("transform");
    g.burst(p.x, p.y, "#adff62", 36);
    g.flash = 0.45;
    g.ui.refreshFavorites();
    return true;
  };
  B.revert = (g, empty = false) => {
    const p = g.player;
    if (p.form === "ben") return;
    p.specialPose = null;
    p.form = "ben";
    p.attack = null;
    p.combo = "";
    p.blocking = false;
    g.burst(p.x, p.y, empty ? "#e56551" : "#b0f961", 25);
    g.audio.play(empty ? "empty" : "transform");
    if (empty) {
      p.energy = 0;
      p.locked = true;
      p.queued = null;
      g.ui.toast("ENERGÍA AGOTADA · esquiva mientras el Omnitrix se recupera");
    }
    g.ui.refreshFavorites();
  };
  B.updatePlayer = (g, dt) => {
    const p = g.player,
      f = B.form(p.form),
      i = g.input;
    for (const k of [
      "invuln",
      "attackCD",
      "specialCD",
      "dodgeCD",
      "dodgeTime",
      "hitTimer",
    ])
      p[k] = Math.max(0, p[k] - dt);
    if (p.comboTimer > 0) {
      p.comboTimer -= dt;
      if (p.comboTimer <= 0) p.combo = "";
    }
    if (p.specialPose) {
      p.specialPose.time -= dt;
      if (p.specialPose.time <= 0) p.specialPose = null;
    }
    if (p.hitTimer <= 0) p.hitCount = 0;
    if (p.form !== "ben") {
      p.energy = Math.max(0, p.energy - dt * 1.65);
      if (p.energy === 0) B.revert(g, true);
    } else {
      p.energy = Math.min(p.maxEnergy, p.energy + dt * 10);
      if (p.locked && p.energy >= p.maxEnergy * 0.35) {
        p.locked = false;
        g.audio.play("puzzle");
        g.ui.toast("Omnitrix disponible");
      }
    }
    p.blocking =
      i.held("block") && p.dodgeTime <= 0 && !p.attack && p.form !== "ben";
    p.blockTime = p.blocking ? p.blockTime + dt : 0;
    let dx = (i.held("right") ? 1 : 0) - (i.held("left") ? 1 : 0),
      dy = (i.held("down") ? 1 : 0) - (i.held("up") ? 1 : 0),
      n = Math.hypot(dx, dy);
    if (n) {
      dx /= n;
      dy /= n;
    }
    p.facing = Math.atan2(i.mouse.y - g.view.h / 2, i.mouse.x - g.view.w / 2);
    const target = g.screenToWorld(i.mouse.x, i.mouse.y);
    p.facing = B.angle(p, target);
    if (p.dodgeTime > 0) {
      dx = Math.cos(p.dodgeAngle);
      dy = Math.sin(p.dodgeAngle);
      B.move(g, p, dx * 620 * dt, dy * 620 * dt);
      if (g.has("heat", 2) && p.form === "heat" && Math.random() < dt * 25)
        g.field(p.x, p.y, 32, 1.6, "fire", 8);
    } else {
      let speed = f.speed * (p.blocking ? 0.4 : 1) * (p.attack ? 0.65 : 1);
      B.move(g, p, dx * speed * dt, dy * speed * dt);
    }
    if (n || p.dodgeTime > 0) p.walk += dt * (p.dodgeTime > 0 ? 24 : 11);
    else p.walk *= Math.max(0, 1 - dt * 7);
    if (p.attack) {
      p.attack.time -= dt;
      if (p.attack.time <= 0) p.attack = null;
    }
    if (g.buffer && p.attackCD <= 0) {
      const b = g.buffer;
      g.buffer = null;
      B.attack(g, b);
    }
    if (g.bufferTimer > 0) {
      g.bufferTimer -= dt;
      if (g.bufferTimer <= 0) g.buffer = null;
    }
    if (i.held("light") && p.attackCD <= 0) B.attack(g, "J");
  };
  B.dodge = (g) => {
    const p = g.player;
    if (p.dodgeCD > 0) return;
    p.dodgeCD = 0.75;
    p.dodgeTime = 0.21;
    p.invuln = 0.3;
    p.attack = null;
    p.attackCD = Math.min(p.attackCD, 0.12);
    const i = g.input;
    const dx = (i.held("right") ? 1 : 0) - (i.held("left") ? 1 : 0),
      dy = (i.held("down") ? 1 : 0) - (i.held("up") ? 1 : 0);
    p.dodgeAngle = dx || dy ? Math.atan2(dy, dx) : p.facing;
    g.audio.play("dodge");
    g.burst(p.x, p.y, B.form(p.form).color, 8);
  };
})(window.B10);
