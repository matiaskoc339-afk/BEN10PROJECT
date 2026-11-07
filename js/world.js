"use strict";
(function (B) {
  const rect = (x, y, w, h, kind = "building", extra = {}) => ({
    x,
    y,
    w,
    h,
    kind,
    ...extra,
  });
  const foe = (type, x, y, id) => B.makeEnemy(type, x, y, id);
  B.createWorld = (zone, save) => {
    const w = {
      zone,
      w: 1800,
      h: 1100,
      obstacles: [],
      enemies: [],
      objects: [],
      decor: [],
      particles: [],
      fields: [],
      shots: [],
      exit: { x: 1730, y: 550, r: 65 },
      time: 0,
    };
    const o = (...a) => w.obstacles.push(rect(...a));
    const obj = (type, x, y, id, extra = {}) =>
      w.objects.push({
        type,
        x,
        y,
        id,
        r: 32,
        progress: 0,
        heat: 0,
        broken: false,
        ...extra,
      });
    const add = (t, x, y, id) => {
      if (!save.flags["dead:" + id]) w.enemies.push(foe(t, x, y, id));
    };
    if (zone === "intro") {
      w.w = 1400;
      w.h = 900;
      o(0, 0, 1400, 130, "labwall");
      o(0, 770, 1400, 130, "labwall");
      w.exit = null;
      return w;
    }
    if (zone === "city" || zone === "market") {
      o(40, 65, 410, 280, "building", {
        label: zone === "city" ? "BELLWOOD AUTO" : "RÉCORDS",
        palette: 0,
      });
      o(510, 65, 350, 275, "building", {
        label: zone === "city" ? "MERCADO" : "CAFÉ GALAXIA",
        palette: 1,
      });
      if (zone === "city") {
        o(920, 60, 540, 285, "building", {
          label: "BELLWOOD / ESTACIÓN",
          palette: 2,
        });
      } else {
        // A traversable shop, with a doorway facing the sidewalk.
        o(930, 65, 520, 85, "building", {
          label: "ARCHIVOS · ABIERTO",
          palette: 2,
        });
        o(930, 150, 35, 220, "shopwall");
        o(1415, 150, 35, 220, "shopwall");
        o(965, 345, 175, 25, "shopwall");
        o(1230, 345, 185, 25, "shopwall");
        obj("health", 1150, 245, "hp-shop");
      }
      o(40, 890, 530, 190, "building", { label: "TALLER", palette: 2 });
      o(660, 915, 430, 165, "building", { label: "BELLWOOD", palette: 0 });
      o(1190, 890, 260, 190, "building", { label: "DEPÓSITO", palette: 1 });
      o(455, 378, 115, 48, "car", { palette: 0 });
      o(1000, 776, 125, 50, "car", { palette: 1 });
      o(720, 710, 50, 50, "crate", { destructible: true, hp: 35 });
      o(780, 720, 45, 45, "crate", { destructible: true, hp: 35 });
      o(1350, 385, 110, 60, "knightcar");
      for (const [x, y] of [
        [80, 400],
        [860, 390],
        [1500, 820],
        [600, 850],
      ])
        o(x, y, 40, 40, "tree");
      for (let j = 0; j < 4; j++)
        w.decor.push({ kind: "lamp", x: 330 + j * 370, y: 365 });
      w.decor.push({
        kind: "sign",
        x: 1490,
        y: 385,
        text: zone === "city" ? "DISTRITO →" : "PLAZA →",
      });
      if (zone === "city") {
        o(70, 490, 165, 78, "rv");
        obj("safe", 265, 455, "max");
        obj("gate", 1580, 550, "gate", {
          thermal: true,
          required: "four",
          heat: save.flags.gate ? 100 : 0,
          progress: save.flags.gate ? 1 : 0,
        });
        o(1570, 0, 45, 475, "fence");
        o(1570, 625, 45, 475, "fence");
        o(1570, 475, 45, 150, "gate", { id: "gate", open: !!save.flags.gate });
        add("basic", 620, 510, "c1");
        add("basic", 730, 610, "c2");
        add("shield", 1050, 540, "c3");
        add("energy", 1200, 700, "c4");
        obj("crate", 920, 840, "cache-city");
      } else {
        obj("safe", 215, 510, "rest-market");
        obj("heater", 590, 825, "optional-heat", {
          heat: save.flags.optional ? 100 : 0,
        });
        obj("energy", 585, 925, "energy-market", { requires: "optional" });
        add("shield", 650, 550, "m1");
        add("heavy", 850, 630, "m2");
        add("energy", 1010, 470, "m3");
        add("commander", 1130, 680, "m4");
        if (!save.flags.executor) add("executor", 1400, 550, "executor");
      }
    } else {
      o(0, 0, 1800, 100, "labwall");
      o(0, 1000, 1800, 100, "labwall");
      o(0, 100, 50, 350, "labwall");
      o(0, 650, 50, 350, "labwall");
      if (zone === "fort") {
        for (const x of [390, 900, 1410]) {
          o(x, 150, 160, 240, "machine");
          o(x, 810, 160, 150, "machine");
        }
        for (const x of [650, 1180]) o(x, 420, 45, 110, "crystal");
        obj("support", 1430, 580, "support-a", {
          thermal: true,
          heat: save.flags.supports ? 100 : 0,
          broken: !!save.flags.supports,
        });
        obj("support", 1430, 720, "support-b", {
          thermal: true,
          heat: save.flags.supports ? 100 : 0,
          broken: !!save.flags.supports,
        });
        o(1610, 100, 40, 900, "security", {
          id: "supports",
          open: !!save.flags.supports,
        });
        add("heavy", 650, 620, "f1");
        add("energy", 900, 550, "f2");
        add("shield", 1120, 700, "f3");
        add("commander", 1250, 550, "f4");
        obj("safe", 210, 525, "rest-fort");
        obj("crate", 970, 925, "cache-fort");
      } else if (zone === "throne") {
        w.exit = null;
        for (const [x, y] of [
          [230, 220],
          [230, 860],
          [1510, 220],
          [1510, 860],
        ])
          o(x, y, 80, 90, "pillar");
        w.decor.push({ kind: "throne", x: 1470, y: 550 });
        obj("safe", 165, 550, "rest-throne");
        if (!save.flags.king) add("king", 1180, 550, "king");
        else w.exit = { x: 1730, y: 550, r: 65 };
      } else if (zone === "escape") {
        for (const x of [400, 1100]) {
          o(x, 100, 120, 270, "machine");
          o(x, 840, 120, 160, "machine");
        }
        o(710, 100, 150, 370, "chasm");
        o(710, 625, 150, 375, "chasm");
        o(710, 470, 150, 155, "chasm", {
          id: "bridge",
          open: !!save.flags.bridge,
        });
        obj("bridge", 660, 550, "bridge", {
          progress: save.flags.bridge ? 1 : 0,
        });
        o(1450, 100, 40, 900, "security", {
          id: "exit-crystal",
          open: !!save.flags["exit-crystal"],
        });
        obj("socket", 1390, 550, "exit-crystal", {
          progress: save.flags["exit-crystal"] ? 1 : 0,
        });
        add("basic", 1050, 550, "e1");
        add("energy", 1240, 670, "e2");
        obj("energy", 1030, 820, "energy-escape");
      }
    }
    return w;
  };
  B.loadZone = (g, zone, withScene = true) => {
    g.world = B.createWorld(zone, g.save);
    g.player.x = zone === "throne" ? 340 : 280;
    g.player.y = 570;
    g.player.attack = null;
    g.player.invuln = 1;
    g.player.combo = "";
    g.buffer = null;
    const mx = Math.min(g.world.w / 2, g.view.w / g.camera.zoom / 2),
      my = Math.min(g.world.h / 2, g.view.h / g.camera.zoom / 2);
    g.camera.x = B.clamp(g.player.x, mx, g.world.w - mx);
    g.camera.y = B.clamp(g.player.y, my, g.world.h - my);
    g.save.zone = zone;
    g.save.checkpoint = zone;
    g.player.hp = g.player.maxHp;
    g.player.energy = g.player.maxEnergy;
    g.player.locked = false;
    g.transition = 1;
    g.ui.toast(B.zoneNames[zone] + " · punto de control");
    g.persist();
    if (withScene && B.scenes[zone] && !g.save.flags["seen:" + zone]) {
      g.save.flags["seen:" + zone] = true;
      g.persist();
      g.ui.scene(zone, () => {});
    }
  };
  B.applyPuzzle = (g, x, y, r, power, strong = false) => {
    const w = g.world;
    for (const o of w.objects) {
      if (B.dist({ x, y }, o) > r + o.r || o.broken) continue;
      if ((o.thermal || o.type === "heater") && power === "heat") {
        o.heat = Math.min(100, o.heat + (strong ? 55 : 28));
        g.burst(o.x, o.y, "#ffb34d", 9);
        g.audio.play("puzzle");
        if (o.heat >= 100 && o.type === "heater") {
          g.save.flags.optional = true;
          g.ui.toast("Conducto fundido · el callejón del sur está abierto");
          g.persist();
        }
      }
      if (o.type === "support" && power === "four" && strong) {
        if (o.heat >= 100) {
          o.progress += 0.5;
          g.shake = 8;
          g.burst(o.x, o.y, "#a6e8e6", 18);
          if (o.progress >= 1) {
            o.broken = true;
            g.audio.play("heavy");
          }
        } else
          g.ui.toast("Cristal endurecido · necesita calor antes de romperse");
      }
      if ((o.type === "socket" || o.type === "bridge") && power === "diamond") {
        o.progress = Math.min(1, o.progress + 0.34);
        g.burst(o.x, o.y, "#96f5d8", 10);
        if (o.progress >= 1) {
          g.save.flags[o.id] = true;
          const wall = w.obstacles.find((a) => a.id === o.id);
          if (wall) wall.open = true;
          g.audio.play("puzzle");
          g.ui.toast(
            o.type === "bridge"
              ? "Puente cristalino creado"
              : "Cierre de seguridad cristalizado",
          );
          g.persist();
        }
      }
    }
    const supports = w.objects.filter((o) => o.type === "support");
    if (
      supports.length &&
      supports.every((o) => o.broken) &&
      !g.save.flags.supports
    ) {
      g.save.flags.supports = true;
      w.obstacles.find((o) => o.id === "supports").open = true;
      g.ui.toast("Soportes destruidos · puerta principal abierta");
      g.persist();
    }
    for (const o of w.obstacles) {
      if (
        o.destructible &&
        !o.open &&
        B.dist({ x, y }, { x: o.x + o.w / 2, y: o.y + o.h / 2 }) < r + 30
      ) {
        o.hp -= strong ? 40 : 18;
        if (o.hp <= 0) {
          o.open = true;
          g.burst(o.x + 20, o.y + 20, "#c39860", 15);
          g.player.hp = Math.min(g.player.maxHp, g.player.hp + 8);
          g.ui.toast("Suministros · +8 salud");
        }
      }
    }
  };
  B.interact = (g) => {
    const p = g.player,
      near = g.world.objects
        .filter((o) => B.dist(p, o) < 115)
        .sort((a, b) => B.dist(p, a) - B.dist(p, b))[0];
    if (p.form === "ben" && p.queued) {
      B.transform(g, p.queued);
      return;
    }
    if (!near) return;
    if (near.type === "safe") {
      if (g.world.enemies.some((e) => !e.dead && B.dist(e, p) < 280)) {
        g.ui.toast("Despeja la zona para descansar");
        return;
      }
      p.hp = p.maxHp;
      p.energy = p.maxEnergy;
      p.locked = false;
      g.persist();
      g.audio.play("puzzle");
      g.ui.toast("Punto seguro · vida y energía restauradas");
    }
    if (
      ["health", "energy", "crate"].includes(near.type) &&
      !g.save.items.includes(near.id)
    ) {
      if (near.requires && !g.save.flags[near.requires]) {
        g.ui.toast("El conducto de arriba bloquea el escondite · usa Fuego");
        return;
      }
      g.save.items.push(near.id);
      if (near.type === "health") {
        g.save.hpBonus += 25;
        p.maxHp = 120 + g.save.hpBonus;
        p.hp = p.maxHp;
        g.ui.toast("Mejora permanente · +25 vida máxima");
      } else if (near.type === "energy") {
        g.save.energyBonus += 20;
        p.maxEnergy = 100 + g.save.energyBonus;
        p.energy = p.maxEnergy;
        g.ui.toast("Núcleo Omnitrix · +20 energía máxima");
      } else {
        g.addXP(60);
        p.hp = Math.min(p.maxHp, p.hp + 25);
        g.ui.toast("Alijo secreto · 60 XP y suministros");
      }
      g.audio.play("unlock");
      g.burst(near.x, near.y, "#b6ff61", 25);
      g.persist();
    }
    if (near.type === "gate" && near.progress < 1) {
      if (near.heat < 100)
        g.ui.toast("Motor térmico frío · apunta y ataca con Fuego");
      else if (p.form !== "four")
        g.ui.toast(
          "Motor activo · usa Cuatro Brazos y mantén " + g.keyLabel("interact"),
        );
    }
    if (["bridge", "socket"].includes(near.type) && near.progress < 1)
      g.ui.toast("Mecanismo cristalino · atácalo con Diamante para construir");
  };
  B.updateWorld = (g, dt) => {
    const w = g.world,
      p = g.player;
    w.time += dt;
    let hint = "";
    for (const o of w.objects) {
      if (B.dist(p, o) > 120) continue;
      if (o.type === "gate" && o.progress < 1) {
        hint =
          o.heat < 100
            ? "MOTOR TÉRMICO · Fuego: apunta al mecanismo y ataca"
            : p.form !== "four"
              ? "COMPUERTA · cambia a Cuatro Brazos"
              : "MANTÉN " +
                g.keyLabel("interact") +
                " · LEVANTAR COMPUERTA " +
                Math.round(o.progress * 100) +
                "%";
        if (o.heat >= 100 && p.form === "four" && g.input.held("interact")) {
          o.progress = Math.min(1, o.progress + dt * 0.6);
          g.shake = 2;
          if (o.progress === 1) {
            g.save.flags.gate = true;
            w.obstacles.find((a) => a.id === "gate").open = true;
            g.audio.play("puzzle");
            g.ui.toast("Compuerta levantada · avanza hacia el este");
            g.persist();
          }
        }
      } else if (o.type === "support" && !o.broken)
        hint =
          o.heat < 100
            ? "CONDUCTO CRISTALINO · caliéntalo con Fuego (" + o.heat + "%)"
            : "CRISTAL FRÁGIL · Cuatro Brazos: dos golpes fuertes (K)";
      else if (o.type === "heater" && o.heat < 100)
        hint = "CONDUCTO SELLADO · Fuego puede fundirlo";
      else if (["bridge", "socket"].includes(o.type) && o.progress < 1)
        hint = "RESONANCIA CRISTALINA · ataca con Diamante";
      else if (o.type === "safe")
        hint = g.keyLabel("interact") + " · DESCANSAR Y GUARDAR";
      else if (
        ["health", "energy", "crate"].includes(o.type) &&
        !g.save.items.includes(o.id)
      )
        hint =
          g.keyLabel("interact") +
          " · " +
          {
            health: "FRAGMENTO DE VITALIDAD",
            energy: "NÚCLEO DEL OMNITRIX",
            crate: "REVISAR ALIJO",
          }[o.type];
    }
    if (p.queued && p.form === "ben")
      hint =
        g.keyLabel("interact") +
        " · TRANSFORMAR EN " +
        B.form(p.queued).name.toUpperCase();
    g.ui.hint(hint);
    const alive = w.enemies.filter((e) => !e.dead);
    if (w.zone !== "city" && p.x < 100 && Math.abs(p.y - 550) < 75) {
      const previous = {
        market: "city",
        fort: "market",
        throne: "fort",
        escape: "throne",
      }[w.zone];
      if (previous) {
        B.loadZone(g, previous, false);
        g.player.x = 1680;
        g.player.y = 550;
        return;
      }
    }
    if (w.zone === "city" && !g.save.flags.gateHint && alive.length === 0) {
      g.save.flags.gateHint = true;
      g.ui.scene("gate");
    }
    if (w.zone === "market" && !g.save.flags.executorIntro && p.x > 1120) {
      g.save.flags.executorIntro = true;
      g.ui.scene("executor");
    }
    if (w.exit && B.dist(p, w.exit) < 80) {
      if (w.zone === "city" && g.save.flags.gate && alive.length === 0) {
        B.loadZone(g, "market");
      } else if (w.zone === "market" && g.save.flags.executor) {
        B.loadZone(g, "fort");
      } else if (w.zone === "fort" && g.save.flags.supports) {
        B.loadZone(g, "throne");
      } else if (w.zone === "throne" && g.save.flags.king) {
        B.loadZone(g, "escape", false);
      } else if (w.zone === "escape" && g.save.flags["exit-crystal"]) {
        g.ui.scene("finish", () => g.complete());
      } else if (w.zone === "market")
        g.ui.hint(
          "El acceso a la fortaleza está custodiado · derrota al Ejecutor",
        );
      else if (w.zone === "city" && alive.length)
        g.ui.hint("Los caballeros aún controlan la calle");
    }
  };
})(window.B10);
