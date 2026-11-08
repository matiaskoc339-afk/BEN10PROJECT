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
    const widths = {
      intro: 1400,
      city: 5200,
      market: 4800,
      fort: 4200,
      throne: 2600,
      escape: 3600,
    };
    const w = {
      zone,
      lateral: true,
      w: widths[zone] || 4200,
      h: 900,
      lane: { top: 500, bottom: 730 },
      obstacles: [],
      enemies: [],
      objects: [],
      decor: [],
      particles: [],
      fields: [],
      shots: [],
      time: 0,
    };
    w.exit = { x: w.w - 150, y: 620, r: 65 };
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
    const add = (type, x, y, id, extra = {}) => {
      if (!save.flags["dead:" + id])
        w.enemies.push({ ...foe(type, x, y, id), ...extra });
    };
    if (zone === "intro") {
      w.exit = null;
      return w;
    }
    if (zone === "city") {
      w.places = [
        { name: "La Rustbucket", x: 350, y: 610 },
        { name: "Paseo de Bellwood", x: 1900, y: 620 },
        { name: "Jardín municipal", x: 3250, y: 620 },
        { name: "Compuerta", x: 4300, y: 620 },
      ];
      o(140, 535, 210, 55, "rv");
      obj("safe", 430, 650, "max");
      o(1260, 654, 54, 40, "crate", { destructible: true, hp: 35 });
      o(2510, 526, 60, 45, "crate", { destructible: true, hp: 35 });
      obj("crate", 2670, 700, "cache-city");
      obj("gate", 4210, 620, "gate", {
        thermal: true,
        required: "four",
        heat: save.flags.gate ? 100 : 0,
        progress: save.flags.gate ? 1 : 0,
      });
      o(4300, 500, 70, 230, "gate", { id: "gate", open: !!save.flags.gate });
      add("basic", 930, 615, "c1");
      add("basic", 1390, 665, "c2");
      add("shield", 2300, 565, "c3");
      add("energy", 3090, 650, "c4");
      add("basic", 3530, 695, "park-patrol", { optional: true });
      w.decor.push({ kind: "fountain", x: 3320, y: 503 });
    } else if (zone === "market") {
      w.places = [
        { name: "Arcadas del mercado", x: 900, y: 620 },
        { name: "Archivos", x: 1530, y: 530 },
        { name: "Conducto", x: 2100, y: 700 },
        { name: "Plaza del Ejecutor", x: 3540, y: 620 },
      ];
      obj("safe", 300, 650, "rest-market");
      obj("health", 1530, 530, "hp-shop");
      obj("heater", 2100, 700, "optional-heat", {
        heat: save.flags.optional ? 100 : 0,
      });
      obj("energy", 2240, 700, "energy-market", { requires: "optional" });
      o(1760, 655, 56, 42, "crate", { destructible: true, hp: 35 });
      add("shield", 880, 575, "m1");
      add("heavy", 1990, 620, "m2");
      add("energy", 2650, 690, "m3");
      add("commander", 2940, 560, "m4");
      if (!save.flags.executor) add("executor", 3540, 620, "executor");
    } else if (zone === "fort") {
      w.places = [
        { name: "Reactores", x: 1600, y: 620 },
        { name: "Soportes", x: 3300, y: 620 },
        { name: "Puerta del trono", x: 3650, y: 620 },
      ];
      for (const [x, y] of [
        [1200, 520],
        [2100, 657],
      ])
        o(x, y, 85, 50, "machine");
      obj("safe", 300, 650, "rest-fort");
      obj("crate", 2360, 700, "cache-fort");
      for (const [id, y] of [
        ["support-a", 550],
        ["support-b", 680],
      ])
        obj("support", 3300, y, id, {
          thermal: true,
          heat: save.flags.supports ? 100 : 0,
          broken: !!save.flags.supports,
        });
      o(3650, 500, 55, 230, "security", {
        id: "supports",
        open: !!save.flags.supports,
      });
      add("heavy", 1080, 610, "f1");
      add("energy", 1720, 570, "f2");
      add("shield", 2530, 675, "f3");
      add("commander", 2850, 570, "f4");
    } else if (zone === "throne") {
      w.exit = save.flags.king ? { x: w.w - 150, y: 620, r: 65 } : null;
      obj("safe", 280, 650, "rest-throne");
      for (const [x, y] of [
        [790, 520],
        [2240, 520],
        [2240, 682],
      ])
        o(x, y, 50, 35, "pillar");
      if (!save.flags.king) add("king", 1790, 620, "king");
    } else if (zone === "escape") {
      w.places = [
        { name: "Abismo", x: 1400, y: 620 },
        { name: "Cierre cristalino", x: 2860, y: 620 },
        { name: "Salida", x: 3450, y: 620 },
      ];
      o(1300, 500, 200, 60, "chasm");
      o(1300, 680, 200, 50, "chasm");
      o(1300, 560, 200, 120, "chasm", {
        id: "bridge",
        open: !!save.flags.bridge,
      });
      obj("bridge", 1220, 620, "bridge", {
        progress: save.flags.bridge ? 1 : 0,
      });
      o(2860, 500, 55, 230, "security", {
        id: "exit-crystal",
        open: !!save.flags["exit-crystal"],
      });
      obj("socket", 2780, 620, "exit-crystal", {
        progress: save.flags["exit-crystal"] ? 1 : 0,
      });
      add("basic", 1970, 590, "e1");
      add("energy", 2360, 685, "e2");
      obj("energy", 2490, 700, "energy-escape");
    }
    return w;
  };
  B.loadZone = (g, zone, withScene = true) => {
    g.world = B.createWorld(zone, g.save);
    g.player.x = zone === "throne" ? 340 : 280;
    g.player.y = 630;
    g.player.attack = null;
    g.player.invuln = 1;
    g.player.combo = "";
    g.buffer = null;
    g.camera.x = g.player.x;
    g.camera.y = 430;
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
          g.ui.toast("Conducto fundido · el pasaje del mercado está abierto");
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
        g.ui.toast(
          "Activa el conducto cercano con Fuego para abrir el escondite",
        );
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
    const alive = w.enemies.filter((e) => !e.dead && !e.optional);
    if (w.zone !== "city" && p.x < 100 && Math.abs(p.y - 620) < 100) {
      const previous = {
        market: "city",
        fort: "market",
        throne: "fort",
        escape: "throne",
      }[w.zone];
      if (previous) {
        B.loadZone(g, previous, false);
        g.player.x = g.world.exit ? g.world.exit.x - 80 : g.world.w - 120;
        g.player.y = 630;
        return;
      }
    }
    if (w.zone === "city" && !g.save.flags.gateHint && alive.length === 0) {
      g.save.flags.gateHint = true;
      g.ui.scene("gate");
    }
    if (w.zone === "market" && !g.save.flags.executorIntro && p.x > 3100) {
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
