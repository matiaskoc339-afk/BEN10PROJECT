"use strict";
(function (B) {
  const palettes = {
    intro: {
      sky: ["#10282d", "#223f45"],
      floor: ["#485d60", "#202e38"],
      trim: "#71918d",
      light: "#b0efa2",
      ink: "#12282e",
    },
    city: {
      sky: ["#c6c5b9", "#f3cf9a"],
      floor: ["#687a78", "#374b52"],
      trim: "#b9a18c",
      light: "#ffd39a",
      ink: "#223e47",
    },
    market: {
      sky: ["#192a4a", "#b28186"],
      floor: ["#566274", "#283b50"],
      trim: "#b29c96",
      light: "#ffd29a",
      ink: "#1c3044",
    },
    fort: {
      sky: ["#121e31", "#304c58"],
      floor: ["#526b73", "#263c4a"],
      trim: "#849a97",
      light: "#79ece1",
      ink: "#162e40",
    },
    throne: {
      sky: ["#1c1730", "#4a3a4d"],
      floor: ["#665666", "#2d3044"],
      trim: "#a28d7d",
      light: "#f5c185",
      ink: "#211e34",
    },
    escape: {
      sky: ["#162b39", "#75968e"],
      floor: ["#486767", "#263c48"],
      trim: "#809c8c",
      light: "#a6f0ca",
      ink: "#17313c",
    },
  };
  const palette = (w) => palettes[w.zone] || palettes.city;
  // Finite authored route: each landmark appears once, at a fixed world position.
  const routes = {
    intro: [["intro", "Laboratorio de extracción", "#40575b"]],
    city: [
      ["city", "Barrio del Rustbucket", "#5e7373"],
      ["cityPark", "Parque del canal", "#b8ad8c"],
      ["cityStation", "Estación de carga", "#627176"],
    ],
    market: [
      ["market", "Galería comercial", "#566274"],
      ["marketBazaar", "Bazar nocturno", "#7e716b"],
      ["marketPlaza", "Plaza del Ejecutor", "#61667c"],
    ],
    fort: [
      ["fort", "Cámara de energía", "#526b73"],
      ["fortWorks", "Taller de la Orden", "#706c63"],
      ["fortHall", "Galería de estandartes", "#5d5864"],
    ],
    throne: [["throne", "Trono del Rey Eterno", "#665666"]],
    escape: [
      ["escape", "Galería derrumbada", "#486767"],
      ["escapeGarden", "Jardines del acueducto", "#7d9688"],
    ],
  };
  B.stageSections = (world) =>
    (routes[world.zone] || routes.city).map(
      ([asset, name, color], n, list) => ({
        asset: "scene_" + asset,
        name,
        color,
        x: (world.w * n) / list.length,
        width: world.w / list.length,
        first: n === 0,
        last: n === list.length - 1,
      }),
    );
  B.stageSectionAt = (world, x) =>
    B.stageSections(world).find(
      (section, i, list) =>
        x < section.x + section.width || i === list.length - 1,
    );
  const murals = new Map();
  function mural(section) {
    const img = B.sheets[section.asset]?.img;
    if (!img) return null;
    const cacheKey = section.asset + ":" + section.width;
    if (murals.has(cacheKey)) return murals.get(cacheKey);
    const overlap = 100,
      width = Math.ceil(section.width + overlap * 2),
      height = Math.ceil((width * img.height) / img.width);
    const cv = document.createElement("canvas");
    cv.width = width;
    cv.height = height;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createLinearGradient(0, 0, width, 0);
    mask.addColorStop(0, section.first ? "#000" : "#0000");
    mask.addColorStop((overlap * 2) / width, "#000");
    mask.addColorStop(1 - (overlap * 2) / width, "#000");
    mask.addColorStop(1, section.last ? "#000" : "#0000");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, width, height);
    const paint = { cv, height, overlap };
    murals.set(cacheKey, paint);
    return paint;
  }
  const floors = new WeakMap();
  function rng(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }
  function box(c, x, y, w, h, color, r = 0) {
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fill();
  }
  function line(c, x, y, xx, yy, color, width = 1) {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(xx, yy);
    c.stroke();
  }
  function ellipse(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, B.TAU);
    c.fill();
  }
  function glow(c, x, y, r, color, alpha = 0.16) {
    c.save();
    c.globalAlpha = alpha;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, color + "00");
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    c.restore();
  }
  B.surfaceAt = (w, x, y) =>
    B.stageSectionAt(w, x).asset === "scene_cityPark" ||
    B.stageSectionAt(w, x).asset === "scene_escapeGarden"
      ? y < 535 || y > 715
        ? "grass"
        : "paving"
      : ["city", "market"].includes(w.zone)
        ? w.zone === "market"
          ? "paving"
          : "asphalt"
        : "stone";
  function floor(c, g) {
    const w = g.world,
      p = palette(w);
    let cv = floors.get(w);
    if (!cv) {
      cv = document.createElement("canvas");
      cv.width = w.w;
      cv.height = 420;
      const ctx = cv.getContext("2d"),
        rand = rng(w.w);
      const grad = ctx.createLinearGradient(0, 0, 0, 420);
      grad.addColorStop(0, p.floor[0]);
      grad.addColorStop(1, p.floor[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w.w, 420);
      for (let n = 0; n < w.w * 1.3; n++) {
        const x = rand() * w.w,
          y = rand() * 420;
        ctx.fillStyle = n % 2 ? "#e9ddd50b" : "#0b263214";
        ctx.fillRect(x, y, 1 + rand() * 5, 1 + rand() * 1.3);
      }
      for (const section of B.stageSections(w)) {
        const tint = ctx.createLinearGradient(
          section.x - 120,
          0,
          section.x + section.width + 120,
          0,
        );
        tint.addColorStop(0, section.color + "00");
        tint.addColorStop(0.15, section.color + "cc");
        tint.addColorStop(0.85, section.color + "cc");
        tint.addColorStop(1, section.color + "00");
        ctx.fillStyle = tint;
        ctx.fillRect(section.x - 120, 0, section.width + 240, 420);
        if (
          section.asset === "scene_cityPark" ||
          section.asset === "scene_escapeGarden"
        ) {
          for (const y of [55, 125, 220]) {
            line(
              ctx,
              section.x + 20,
              y,
              section.x + section.width - 20,
              y,
              "#5d665b33",
              2,
            );
            for (
              let x = section.x + 80 + y;
              x < section.x + section.width - 50;
              x += 180
            )
              line(ctx, x, y, x + 12, y + 65, "#5d665b22");
          }
          for (let i = 0; i < 24; i++) {
            const x = section.x + rand() * section.width,
              y = 35 + rand() * 250;
            line(ctx, x, y, x + 12, y + 1, "#c4b78d55", 2);
          }
        }
        if (section.asset === "scene_cityStation") {
          for (const y of [70, 230]) {
            line(ctx, section.x, y, section.x + section.width, y, "#263c42", 7);
            line(
              ctx,
              section.x,
              y - 3,
              section.x + section.width,
              y - 3,
              "#a3a59a",
              2,
            );
          }
        }
      }
      if (w.zone !== "city")
        for (const y of [20, 62, 127, 218, 342]) {
          line(ctx, 0, y, w.w, y, "#101d2b44", 2);
          line(ctx, 0, y + 2, w.w, y + 2, "#e4d5bd10");
          const stride = 120 + y * 0.7;
          for (let x = (y % 3) * 47; x < w.w; x += stride)
            line(ctx, x, y, x + 15, y + 30 + y * 0.12, "#182c3844", 1);
        }
      else {
        for (let x = 150; x < w.w; x += 310)
          box(ctx, x, 290, 130, 5, "#d6c39b88", 2);
        for (let n = 0; n < 45; n++) {
          const x = rand() * w.w,
            y = rand() * 270;
          ellipse(ctx, x, y, 20 + rand() * 50, 3 + rand() * 7, "#1d394215");
        }
      }
      if (w.zone === "throne") {
        box(ctx, 480, 60, w.w - 800, 165, "#6b3e56", 4);
        line(ctx, 485, 68, w.w - 330, 68, "#b99c70", 2);
        line(ctx, 485, 216, w.w - 330, 216, "#b99c70", 2);
      }
      for (let x = 450; x < w.w; x += 950) {
        box(ctx, x, 350, 170, 48, "#172a35", 5);
        for (let a = 8; a < 165; a += 12)
          line(ctx, x + a, 355, x + a, 392, "#566d6e", 2);
      }
      floors.set(w, cv);
    }
    c.drawImage(cv, 0, 480);
    box(c, 0, 477, w.w, 10, p.trim);
    line(c, 0, 488, w.w, 488, p.ink, 4);
    line(c, 0, 490, w.w, 490, "#efd8af44");
    const fade = c.createLinearGradient(0, 480, 0, 530);
    fade.addColorStop(0, "#14253555");
    fade.addColorStop(1, "#14253500");
    c.fillStyle = fade;
    c.fillRect(0, 480, w.w, 50);
    box(c, 0, 754, w.w, 16, p.ink);
    line(c, 0, 753, w.w, 753, p.trim, 3);
  }
  function background(c, g) {
    const w = g.world,
      p = palette(w),
      half = g.view.w / g.camera.zoom / 2,
      left = g.camera.x - half,
      wide = half * 2;
    const sky = c.createLinearGradient(0, -140, 0, 490);
    sky.addColorStop(0, p.sky[0]);
    sky.addColorStop(1, p.sky[1]);
    c.fillStyle = sky;
    c.fillRect(left - 20, -400, wide + 40, 1400);
    if (["city", "market"].includes(w.zone)) {
      ellipse(
        c,
        g.camera.x * 0.87 + 400,
        105,
        62,
        62,
        w.zone === "city" ? "#fbe1b26b" : "#e1dbcb44",
      );
      for (
        let j = Math.floor((left - g.camera.x * 0.74) / 250) - 1;
        j < (left + wide - g.camera.x * 0.74) / 250 + 1;
        j++
      ) {
        const x = j * 250 + g.camera.x * 0.74,
          h = 90 + (Math.abs(j * 57) % 110);
        box(c, x, 315 - h, 195, h + 130, "#4e667d44");
        for (let a = 20; a < 175; a += 32)
          for (let b = 25; b < h; b += 38)
            box(c, x + a, 330 - h + b, 10, 16, "#f2d29b20");
      }
    }
    for (const section of B.stageSections(w)) {
      if (
        section.x > left + wide + 120 ||
        section.x + section.width < left - 120
      )
        continue;
      const paint = mural(section);
      if (!paint) continue;
      c.drawImage(paint.cv, section.x - paint.overlap, 487 - paint.height);
    }
    floor(c, g);
  }
  function lamp(c, x, y, t, p, wind = 0) {
    const sway = wind * 0.6;
    line(c, x, 180, x + sway, y - 24, p.ink, 2);
    B.drawProp(
      c,
      p === palettes.city || p === palettes.market || p === palettes.throne
        ? 25
        : 26,
      x + sway - 17,
      y - 55,
      34,
      70,
    );
    glow(c, x + sway, y, 90, p.light, 0.1 + Math.sin(t * 1.3 + x) * 0.015);
  }
  function ambient(c, g) {
    const w = g.world,
      p = palette(w),
      t = w.time,
      left = g.camera.x - g.view.w / g.camera.zoom / 2,
      right = g.camera.x + g.view.w / g.camera.zoom / 2;
    const lights =
      {
        intro: [320, 1110],
        city: [680, 1450, 3650, 4600],
        market: [540, 1210, 1870, 2340, 3090, 3990],
        fort: [470, 1180, 2030, 3210, 3880],
        throne: [470, 2110],
        escape: [340, 1010, 1570],
      }[w.zone] || [];
    for (const x of lights)
      if (x > left - 130 && x < right + 130)
        lamp(c, x, 290 + Math.sin(x) * 35, t, p, g.life.wind(w, x, 320));
    if (w.zone === "city") {
      water(c, 3320, 497, t);
    }
    if (w.zone === "fort" || w.zone === "intro" || w.zone === "escape") {
      for (let x = 390; x < w.w; x += 1137) {
        glow(c, x, 412, 110, p.light, 0.045 + Math.sin(t * 1.6 + x) * 0.012);
        for (let n = 0; n < 3; n++) {
          const phase = (t * 0.21 + n / 3) % 1;
          ellipse(
            c,
            x + Math.sin(phase * 5 + n) * 18,
            465 - phase * 60,
            8 + phase * 22,
            3 + phase * 7,
            "#bce6df09",
          );
        }
      }
    }
    if (g.player.form === "heat") {
      glow(
        c,
        g.player.x,
        g.player.y - 95,
        110,
        "#ffd181",
        0.1 + Math.sin(t * 8) * 0.02,
      );
      ellipse(c, g.player.x, g.player.y, 40, 9, "#f5b76d16");
      for (let i = 0; i < 3; i++) {
        const q = (t * 0.9 + i / 3) % 1;
        ellipse(
          c,
          g.player.x + Math.sin(t * 3 + i) * 10,
          g.player.y - 142 - q * 23,
          1.4,
          2,
          "#ffd19b88",
        );
      }
    }
    for (let i = 0; i < 24; i++) {
      const x =
          ((i * 193.4 + t * (w.zone === "city" ? 9 : 3)) % (w.w + 200)) - 100,
        y = 260 + ((i * 37.1) % 470) + Math.sin(t * 0.7 + i) * 12;
      if (x < left - 30 || x > right + 30) continue;
      c.save();
      c.globalAlpha = 0.24;
      c.translate(x, y);
      c.rotate(Math.sin(t + i));
      ellipse(
        c,
        0,
        0,
        w.zone === "city" ? 3 : 1.3,
        1,
        w.zone === "city" ? "#e5cc8f" : "#abddd2",
      );
      c.restore();
    }
  }
  function water(c, x, y, t) {
    B.drawProp(c, 27, x - 95, y - 170, 190, 170);
    for (let i = 0; i < 5; i++) {
      const phase = (t * 0.8 + i * 0.2) % 1;
      c.strokeStyle = "#d3eee9aa";
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(x, y - 36, phase * 69, phase * 7, 0, 0, B.TAU);
      c.stroke();
      line(
        c,
        x - 41 + i * 20,
        y - 91,
        x - 41 + i * 20 + Math.sin(t * 5 + i) * 2,
        y - 39,
        "#bfe3df77",
      );
    }
  }
  function shadow(c, o, rx) {
    ellipse(
      c,
      o.x + o.w / 2 + 12,
      o.y + o.h + 2,
      rx || o.w * 0.66,
      8,
      "#102e3d44",
    );
  }
  function crate(c, o) {
    shadow(c, o);
    B.drawProp(c, 21, o.x, o.y + o.h - 76, o.w, 76);
  }
  function pillar(c, o) {
    shadow(c, o);
    B.drawProp(c, 22, o.x - 12, o.y + o.h - 200, o.w + 24, 200);
  }
  function machine(c, o, g) {
    shadow(c, o);
    B.drawProp(c, 23, o.x - 16, o.y + o.h - 190, o.w + 32, 190);
    glow(c, o.x + o.w / 2, o.y + o.h - 90, 65, palette(g.world).light, 0.1);
  }
  function gate(c, g, o) {
    const { x, y, w, h } = o,
      progress =
        o.kind === "gate"
          ? g.world.objects.find((a) => a.id === "gate")?.progress || 0
          : 0,
      p = palette(g.world);
    c.save();
    c.globalAlpha = 1 - progress;
    const back = y + 20,
      front = y + h;
    for (const [xx, yy] of [
      [x + 8, back],
      [x + w - 8, front],
    ]) {
      box(c, xx - 9, yy - 225, 18, 225, p.ink, 3);
      box(c, xx - 4, yy - 213, 4, 200, p.trim, 2);
      ellipse(c, xx, yy, 17, 5, p.ink);
    }
    c.fillStyle = o.kind === "gate" ? "#e5b46d55" : "#70dbde44";
    c.beginPath();
    c.moveTo(x + 10, back - 205);
    c.lineTo(x + w - 10, front - 205);
    c.lineTo(x + w - 10, front);
    c.lineTo(x + 10, back);
    c.fill();
    for (let i = 0; i < 7; i++) {
      const yy = back - 190 + i * 29;
      line(c, x + 10, yy, x + w - 10, yy + front - back, "#e9d6ad88", 2);
    }
    c.restore();
  }
  function rv(c, o, g) {
    const b = o.y + o.h,
      x = o.x - 40;
    shadow(c, { x, y: o.y, w: 300, h: o.h }, 170);
    B.drawProp(c, 20, x, b - 210, 300, 210);
    for (let n = 0; n < 3; n++) {
      const q = (g.world.time * 0.3 + n / 3) % 1;
      ellipse(
        c,
        x - 4 - q * 18,
        b - 31 - q * 16,
        4 + q * 8,
        2 + q * 3,
        "#a0b4ac13",
      );
    }
  }
  function obstacle(c, g, o) {
    if (o.kind === "crate") crate(c, o);
    else if (o.kind === "pillar" || o.kind === "crystal") pillar(c, o);
    else if (o.kind === "machine") machine(c, o, g);
    else if (o.kind === "gate" || o.kind === "security") gate(c, g, o);
    else if (o.kind === "rv") rv(c, o, g);
    else if (o.kind === "chasm") {
      const { x, y, w, h } = o;
      if (o.open) {
        box(c, x, y, w, h, "#639f9c");
        for (let xx = x + 8; xx < x + w; xx += 22) {
          line(c, xx, y + 4, xx + 12, y + h - 4, "#d0f6dc99", 3);
        }
        line(c, x, y, x + w, y, "#a4e6cf", 4);
        line(c, x, y + h, x + w, y + h, "#a4e6cf", 4);
      } else {
        const deep = c.createLinearGradient(0, 500, 0, 730);
        deep.addColorStop(0, "#101e2d");
        deep.addColorStop(1, "#203c48");
        c.fillStyle = deep;
        c.fillRect(x, y, w, h);
        c.fillStyle = "#43565c";
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 14, y + 10);
        c.lineTo(x + 14, y + h);
        c.lineTo(x, y + h);
        c.fill();
        c.fillStyle = "#2c454f";
        c.beginPath();
        c.moveTo(x + w, y);
        c.lineTo(x + w - 13, y + 10);
        c.lineTo(x + w - 13, y + h);
        c.lineTo(x + w, y + h);
        c.fill();
        for (let yy = y + 8; yy < y + h; yy += 28) {
          line(c, x + 1, yy, x + 13, yy + 8, "#81958d", 2);
          line(c, x + w - 1, yy, x + w - 12, yy + 8, "#5d7880", 2);
        }
        line(c, x, y, x, y + h, "#96a69a", 3);
        line(c, x + w, y, x + w, y + h, "#96a69a", 3);
        if (y + h >= 730) {
          line(c, x, 730, x + w, 730, "#88968c", 4);
          for (let xx = x + 9; xx < x + w; xx += 37)
            box(c, xx, 724, 20, 8, "#718480", 2);
        }
      }
    }
  }
  function object(c, g, o) {
    if (g.save.items.includes(o.id) || o.broken) return;
    const { x, y, type } = o,
      t = g.world.time,
      p = palette(g.world);
    if (type === "safe") {
      ellipse(c, x, y, 33, 8, "#a6e8a733");
      line(c, x - 22, y + 13, x + 22, y + 13, "#abdcae55", 2);
      return;
    }
    if (["gate", "support", "heater", "socket", "bridge"].includes(type)) {
      if (o.progress >= 1) return;
      const color =
        o.heat >= 100
          ? "#f6c587"
          : type === "bridge" || type === "socket"
            ? "#a8ecdc"
            : "#82cfcb";
      ellipse(c, x + 7, y + 3, 30, 7, "#152d3b66");
      B.drawProp(c, 24, x - 34, y - 126, 68, 126);
      glow(c, x, y - 74, 50, color, 0.14);
      if (o.heat > 0) {
        box(c, x - 23, y + 10, 46, 4, "#263b43");
        box(c, x - 23, y + 10, o.heat * 0.46, 4, color);
      }
      return;
    }
    const color =
      type === "health" ? "#e8b1a0" : type === "energy" ? "#bfe486" : "#d9bc85";
    ellipse(c, x, y, 18, 5, "#152e3b33");
    const yy = y - 27 - Math.sin(t * 2.8 + x) * 3;
    glow(c, x, yy, 35, color, 0.12);
    c.fillStyle = color;
    c.strokeStyle = "#3d5e62";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, yy - 17);
    c.lineTo(x + 11, yy);
    c.lineTo(x, yy + 12);
    c.lineTo(x - 11, yy);
    c.closePath();
    c.fill();
    c.stroke();
  }
  function foreground(c, g) {
    const p = palette(g.world),
      left = g.camera.x - g.view.w / g.camera.zoom / 2;
    const anchors =
      {
        intro: [80, 1340],
        city: [100, 1930, 3560, 5110],
        market: [60, 1660, 3350, 4740],
        fort: [80, 1510, 2920, 4130],
        throne: [60, 2520],
        escape: [60, 1920, 3520],
      }[g.world.zone] || [];
    for (const anchor of anchors) {
      const x = anchor - g.camera.x * 0.07;
      if (x < left - 200 || x > left + g.view.w / g.camera.zoom + 200) continue;
      c.save();
      c.globalAlpha = 0.65;
      if (
        (g.world.zone === "city" && anchor > 1800 && anchor < 3500) ||
        (g.world.zone === "escape" && anchor > 1800)
      ) {
        for (let n = 0; n < 7; n++)
          ellipse(c, x + n * 23, 829 + Math.sin(n) * 9, 29, 15, p.ink);
      } else {
        box(c, x, 824, 150, 34, p.ink, 4);
        for (let a = 8; a < 145; a += 23)
          line(c, x + a, 831, x + a + 6, 853, p.trim, 1);
      }
      c.restore();
    }
  }

  B.SideScene = {
    palette,
    background,
    ambient,
    foreground,
    obstacle,
    object,
    water,
    glow,
  };
  B.drawStageActor = (c, g, id, x, y, scale = 1, opts = {}) => {
    const p = palette(g.world),
      depth = B.clamp((y - 500) / 230, 0, 1),
      size = scale * (1.4 + depth * 0.07);
    if (["market", "fort", "throne"].includes(g.world.zone)) {
      c.save();
      c.translate(x, y + 4);
      c.scale(1, -0.18);
      c.globalAlpha = 0.055;
      B.drawActor(c, id, 0, 0, size, {
        ...opts,
        lateral: true,
        shadow: false,
        light: p.light,
      });
      c.restore();
    }
    B.drawActor(c, id, x, y, size, { ...opts, lateral: true, light: p.light });
  };
})(window.B10);
