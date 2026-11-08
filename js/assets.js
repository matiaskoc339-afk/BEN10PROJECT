"use strict";
(function (B) {
  const sheets = {},
    specs = {
      ben: ["assets/characters/ben-atlas.png", 6, 4],
      benSide: ["assets/characters/ben-side.png", 8, 2],
      fourSide: ["assets/characters/four-side.png", 8, 2],
      heatSide: ["assets/characters/heat-side.png", 8, 2],
      diamondSide: ["assets/characters/diamond-side.png", 8, 2],
      knightSide: ["assets/characters/knight-side.png", 8, 2],
      benIdle: ["assets/characters/ben-idle.png", 4, 2],
      fourIdle: ["assets/characters/four-idle.png", 4, 2],
      heatIdle: ["assets/characters/heat-idle.png", 4, 2],
      diamondIdle: ["assets/characters/diamond-idle.png", 4, 2],
      benFight: ["assets/characters/ben-fight.png", 6, 4],
      fourFight: ["assets/characters/four-fight.png", 6, 4],
      heatFight: ["assets/characters/heat-fight.png", 6, 4],
      diamondFight: ["assets/characters/diamond-fight.png", 6, 4],
      castActA: ["assets/characters/cast-act-a.png", 6, 4],
      castActB: ["assets/characters/cast-act-b.png", 6, 6],
      bossAct: ["assets/characters/boss-act.png", 6, 3],
      extractor: ["assets/stages/extractor.png", 1, 1],
      scene_intro: ["assets/stages/intro.png", 1, 1],
      scene_cityPark: ["assets/stages/city-park.png", 1, 1],
      scene_cityStation: ["assets/stages/city-station.png", 1, 1],
      scene_marketBazaar: ["assets/stages/market-bazaar.png", 1, 1],
      scene_marketPlaza: ["assets/stages/market-plaza.png", 1, 1],
      scene_fortWorks: ["assets/stages/fort-works.png", 1, 1],
      scene_fortHall: ["assets/stages/fort-hall.png", 1, 1],
      scene_escapeGarden: ["assets/stages/escape-garden.png", 1, 1],
      sideProps: ["assets/stages/props.png", 4, 2],
      scene_city: ["assets/stages/city.png", 1, 1],
      scene_market: ["assets/stages/market.png", 1, 1],
      scene_fort: ["assets/stages/fort.png", 1, 1],
      scene_throne: ["assets/stages/throne.png", 1, 1],
      scene_escape: ["assets/stages/escape.png", 1, 1],
      four: ["assets/characters/four-atlas.png", 6, 4],
      heat: ["assets/characters/heat-atlas.png", 6, 4],
      diamond: ["assets/characters/diamond-atlas.png", 6, 4],
      knight: ["assets/characters/knight-atlas.png", 6, 4],
      cast: ["assets/characters/story-cast.png", 4, 3],
      props: ["assets/world/props.png", 4, 4],
      terrain: ["assets/world/terrain.png", 2, 2],
      buildings: ["assets/world/buildings.png", 2, 2],
      flora: ["assets/world/flora.png", 2, 2],
      benCombat: ["assets/characters/ben-combat.png", 8, 4],
      fourCombat: ["assets/characters/four-combat.png", 8, 4],
      heatCombat: ["assets/characters/heat-combat.png", 8, 4],
      diamondCombat: ["assets/characters/diamond-combat.png", 8, 4],
      benWalk: ["assets/characters/ben-walk.png", 6, 4],
      fourWalk: ["assets/characters/four-walk.png", 6, 4],
      heatWalk: ["assets/characters/heat-walk.png", 6, 4],
      diamondWalk: ["assets/characters/diamond-walk.png", 6, 4],
      knightWalk: ["assets/characters/knight-walk.png", 6, 4],
    };
  function paintFrame(c, img, frame, width = frame.w, height = frame.h) {
    c.save();
    c.scale(width / frame.w, height / frame.h);
    if (frame.clip) {
      c.beginPath();
      frame.clip.forEach(([x, y], n) => (n ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.clip();
    }
    c.drawImage(
      img,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      0,
      0,
      frame.w,
      frame.h,
    );
    c.restore();
  }
  B.paintAtlasFrame = (c, key, index) =>
    paintFrame(c, sheets[key].img, sheets[key].frames[index]);
  function bounds(img, x, y, w, h, clip) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    paintFrame(c, img, { x, y, w, h, clip });
    let data;
    try {
      data = c.getImageData(0, 0, w, h).data;
    } catch {
      return { x: w * 0.1, y: h * 0.08, w: w * 0.8, h: h * 0.84 };
    }
    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0;
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++)
        if (data[(yy * w + xx) * 4 + 3] > 128) {
          minX = Math.min(minX, xx);
          maxX = Math.max(maxX, xx);
          minY = Math.min(minY, yy);
          maxY = Math.max(maxY, yy);
        }
    if (maxX <= minX) return { x: 0, y: 0, w, h, rootX: w / 2 };
    // Register the pelvis, not the outermost hand or weapon. Each pose stays grounded.
    let sumX = 0,
      weight = 0;
    const top = minY + (maxY - minY) * 0.57,
      bottom = minY + (maxY - minY) * 0.73;
    for (let yy = Math.floor(top); yy < bottom; yy++)
      for (let xx = Math.floor(w * 0.32); xx < w * 0.68; xx++) {
        const alpha = data[(yy * w + xx) * 4 + 3] / 255;
        if (alpha > 0.5) {
          sumX += xx * alpha;
          weight += alpha;
        }
      }
    return {
      x: minX,
      y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1,
      rootX: weight ? sumX / weight : (minX + maxX) / 2,
    };
  }

  B.assetsReady = Promise.all(
    Object.entries(specs).map(
      ([key, [url, cols, rows]]) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const sw = Math.floor(img.width / cols),
              sh = Math.floor(img.height / rows);
            const frames = [];
            for (let row = 0; row < rows; row++)
              for (let col = 0; col < cols; col++) {
                const box = B.atlasFrames?.[key]?.[row * cols + col],
                  x = box ? box[0] : Math.round((col * img.width) / cols),
                  y = box ? box[1] : Math.round((row * img.height) / rows),
                  fw = box ? box[2] : sw,
                  fh = box ? box[3] : sh;
                frames.push({
                  x,
                  y,
                  w: fw,
                  h: fh,
                  clip: B.atlasClips?.[key]?.[row * cols + col],
                  b:
                    key === "terrain" || key.startsWith("scene_")
                      ? { x: 0, y: 0, w: sw, h: sh }
                      : bounds(
                          img,
                          x,
                          y,
                          fw,
                          fh,
                          B.atlasClips?.[key]?.[row * cols + col],
                        ),
                });
              }
            const rowHeights = [];
            for (let row = 0; row < rows; row++) {
              const hs = frames
                .slice(row * cols, (row + 1) * cols)
                .map((f) => f.b.h)
                .sort((a, b) => a - b);
              rowHeights.push(
                key.endsWith("Fight")
                  ? frames[0].b.h / 0.93
                  : key.startsWith("castAct") || key === "bossAct"
                    ? frames[row * cols].b.h
                    : key.endsWith("Idle")
                      ? Math.max(...frames.slice(0, cols).map((f) => f.b.h))
                      : key.endsWith("Walk") ||
                          key.endsWith("Combat") ||
                          key.endsWith("Side")
                        ? hs[Math.floor(hs.length / 2)]
                        : frames[row * cols].b.h,
              );
            }
            sheets[key] = { key, img, cols, rows, frames, rowHeights };
            resolve();
          };
          img.onerror = () => reject(new Error("No se pudo cargar " + url));
          img.src = url;
        }),
    ),
  ).then(() => {
    B.assetsLoaded = true;
  });
  B.sheets = sheets;
  const cast = {
    Gwen: 0,
    Max: 1,
    Kevin: 2,
    Vilgax: 3,
    Malware: 4,
    Hex: 5,
    Zombozo: 6,
    "Dr. Ánimo": 7,
    Driscoll: 8,
    Ejecutor: 9,
    executor: 9,
    king: 10,
  };
  const heights = {
    ben: 108,
    heat: 114,
    four: 126,
    diamond: 118,
    knight: 106,
    Vilgax: 182,
    Malware: 164,
    Kevin: 104,
    Gwen: 94,
    Max: 116,
    Hex: 134,
    Zombozo: 138,
    "Dr. Ánimo": 132,
    Driscoll: 148,
    king: 148,
    executor: 150,
    Ejecutor: 150,
  };
  B.actorVariant = (id, opts = {}) =>
    id === "king" || id === "Driscoll"
      ? opts.scene === "intro" || !opts.armor
        ? "eternal"
        : "crystal"
      : "original";
  function selection(id, opts) {
    const acting = {
      Vilgax: ["castActA", 0],
      Malware: ["castActA", 1],
      Kevin: ["castActA", 2],
      Hex: ["castActA", 3],
      Zombozo: ["castActB", 0],
      "Dr. Ánimo": ["castActB", 1],
      Driscoll: ["castActB", 2],
      ben: ["castActB", 3],
      Gwen: ["castActB", 4],
      Max: ["castActB", 5],
    };
    if (opts.cinePose !== undefined && acting[id]) {
      const [key, row] = acting[id];
      return {
        key,
        row,
        index: row * 6 + opts.cinePose,
        flip: opts.facing === Math.PI,
      };
    }
    if ((id === "Gwen" || id === "Max") && opts.lateral) {
      const [key, row] = acting[id];
      const cycle = Math.floor((opts.time || 0) * 3) % 8;
      const pose = opts.speaking
        ? [1, 2, 1, 0][cycle % 4]
        : [0, 0, 0, 1, 0, 0, 0, 0][cycle];
      return { key, row, index: row * 6 + pose, flip: opts.facing === Math.PI };
    }
    if (opts.lateral && (id === "king" || id === "executor")) {
      const row = id === "executor" ? 0 : opts.armor > 0 ? 1 : 2;
      const col =
        opts.hurtTime > 0
          ? 4
          : opts.attack
            ? opts.attack.fired
              ? 3
              : 2
            : opts.moving
              ? Math.floor((opts.walk || 0) * 1.5) % 2
                ? 5
                : 1
              : Math.floor((opts.time || 0) * 3) % 2;
      return {
        key: "bossAct",
        row,
        index: row * 6 + col,
        flip: Math.cos(opts.facing ?? 0) < 0,
      };
    }
    if (id === "Driscoll" || id === "king")
      return {
        key: "cast",
        index:
          B.actorVariant(id, opts) === "crystal"
            ? 10
            : opts.phase >= 2 && opts.attack
              ? 11
              : 8,
      };
    if (cast[id] !== undefined) return { key: "cast", index: cast[id] };
    let key = sheets[id]
      ? id
      : [
            "basic",
            "shield",
            "heavy",
            "energy",
            "commander",
            "Comandante",
          ].includes(id)
        ? "knight"
        : null;
    if (!key) return null;
    let row = 0;
    if (opts.facing !== undefined) {
      const a = B.wrap(opts.facing);
      row =
        Math.abs(a) < Math.PI / 4
          ? 1
          : Math.abs(a) > Math.PI * 0.75
            ? 3
            : a < 0
              ? 2
              : 0;
    }
    if (opts.lateral) row = Math.cos(opts.facing ?? 0) >= 0 ? 1 : 3;
    let col = 0;
    const action = opts.attack || opts.special;
    if (
      opts.lateral &&
      !action &&
      !opts.hurtTime &&
      !opts.dodging &&
      sheets[key + "Side"]
    ) {
      const sideRow = row === 1 ? 0 : 1;
      const moving = opts.moving || (opts.walk && opts.moving !== false);
      if (!moving && sheets[key + "Idle"]) {
        const guard = opts.combatReady || opts.blocking ? 1 : 0;
        return {
          key: key + "Idle",
          index: guard * 4 + (Math.floor((opts.time || 0) * 4) % 4),
          row: guard,
          flip: sideRow === 1,
        };
      }
      const phase = ((opts.walk || 0) / B.TAU) % 1;
      col = moving
        ? 2 + Math.floor(((phase + 1) % 1) * 6)
        : opts.combatReady || opts.blocking
          ? Math.floor((opts.time || 0) * 2) % 2
          : Math.floor((opts.time || 0) * 1.5) % 2;
      return { key: key + "Side", index: sideRow * 8 + col, row: sideRow };
    }
    if (action) {
      const elapsed = action.total - action.time,
        contact = action.hitAt ?? action.total * 0.3;
      const variant = action.variant ?? (action.kind === "K" ? 3 : 0);
      if (opts.lateral && sheets[key + "Fight"]) {
        const phase =
          elapsed < contact
            ? Math.min(2, Math.floor((elapsed / contact) * 3))
            : elapsed < contact + 0.045
              ? 3
              : elapsed < contact + (action.total - contact) * 0.55
                ? 4
                : 5;
        return {
          key: key + "Fight",
          index: variant * 6 + phase,
          row: variant,
          variant,
          phase,
          flip: row === 3,
        };
      }
      if (sheets[key + "Combat"] && elapsed < contact + 0.11) {
        return {
          key: key + "Combat",
          index: row * 8 + variant * 2 + (elapsed < contact ? 0 : 1),
          row,
          variant,
          phase: elapsed < contact ? "windup" : "contact",
        };
      }
      col = elapsed < contact ? 3 : elapsed < contact + 0.085 ? 4 : 5;
    } else if (opts.hurtTime > 0) col = 5;
    else if (opts.dodging) {
      const phase = 1 - (opts.dodgeTime ?? 0.1) / (opts.dodgeDuration || 0.21);
      col = phase < 0.5 ? 2 : 5;
    } else if (opts.blocking) col = 5;
    else if (opts.moving || (opts.walk && opts.moving !== false)) {
      return {
        key: key + "Walk",
        index: row * 6 + Math.floor((((opts.walk || 0) / B.TAU) % 1) * 6),
        row,
      };
    }
    if (
      opts.combatReady &&
      !action &&
      !opts.moving &&
      !opts.hurtTime &&
      !opts.dodging
    )
      col = 5;
    return { key, index: row * 6 + col, row };
  }
  B.spriteFrame = (id, opts = {}) => selection(id, opts);

  function locked(c, id, x, y, size) {
    c.save();
    c.translate(x, y);
    c.strokeStyle = B.form(id).color;
    c.fillStyle = "#15251c";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(0, -size * 0.4, size * 0.22, size * 0.36, 0, 0, B.TAU);
    c.fill();
    c.stroke();
    for (let n = 0; n < 5; n++) {
      const yy = -size * 0.66 + n * size * 0.12;
      c.beginPath();
      c.moveTo(-size * 0.14, yy);
      c.lineTo(size * 0.14, yy + size * 0.07);
      c.stroke();
    }
    c.restore();
  }
  const silhouettes = new Map();
  function silhouette(key, index) {
    const cacheKey = key + ":" + index;
    if (silhouettes.has(cacheKey)) return silhouettes.get(cacheKey);
    const sheet = sheets[key],
      f = sheet.frames[index],
      cv = document.createElement("canvas");
    cv.width = f.w;
    cv.height = f.h;
    const c = cv.getContext("2d");
    paintFrame(c, sheet.img, f);
    c.globalCompositeOperation = "source-in";
    c.fillStyle = "#183329";
    c.fillRect(0, 0, cv.width, cv.height);
    silhouettes.set(cacheKey, cv);
    return cv;
  }
  const projectedShadows = new Map();
  const contactShadow = document.createElement("canvas");
  contactShadow.width = 128;
  contactShadow.height = 32;
  {
    const c = contactShadow.getContext("2d");
    c.translate(64, 16);
    c.scale(1, 0.25);
    const g = c.createRadialGradient(0, 0, 2, 0, 0, 64);
    g.addColorStop(0, "#16372677");
    g.addColorStop(1, "#16372600");
    c.fillStyle = g;
    c.fillRect(-64, -64, 128, 128);
  }
  function projection(
    key,
    index,
    left,
    top,
    width,
    height,
    shear,
    depth,
    flip = false,
  ) {
    const id = [key, index, left, top, width, height, shear, depth, flip]
      .map((x) => (typeof x === "number" ? x.toFixed(2) : x))
      .join(":");
    if (projectedShadows.has(id)) return projectedShadows.get(id);
    const corners = [
      [left, top],
      [left + width, top],
      [left, top + height],
      [left + width, top + height],
    ].map(([x, y]) => [(flip ? -x : x) - shear * y, -depth * y]);
    const minX = Math.floor(Math.min(...corners.map((a) => a[0]))) - 4,
      minY = Math.floor(Math.min(...corners.map((a) => a[1]))) - 4;
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(Math.max(...corners.map((a) => a[0])) - minX) + 4;
    cv.height = Math.ceil(Math.max(...corners.map((a) => a[1])) - minY) + 4;
    const c = cv.getContext("2d");
    c.translate(-minX, -minY);
    c.transform(1, 0, -shear, -depth, 0, 0);
    if (flip) c.scale(-1, 1);
    c.filter = "blur(2px)";
    const sheet = sheets[key],
      f = sheet.frames[index];
    if (
      key === "props" ||
      key === "buildings" ||
      key === "flora" ||
      key === "sideProps"
    ) {
      const b = f.b;
      c.drawImage(
        silhouette(key, index),
        b.x,
        b.y,
        b.w,
        b.h,
        left,
        top,
        width,
        height,
      );
    } else c.drawImage(silhouette(key, index), left, top, width, height);
    const result = { canvas: cv, x: minX, y: minY };
    projectedShadows.set(id, result);
    return result;
  }
  function softShadow(
    c,
    key,
    index,
    left,
    top,
    width,
    height,
    anchorX,
    anchorY,
    opacity = 0.18,
    flip = false,
  ) {
    const cached = projection(
      key,
      index,
      left - anchorX,
      top - anchorY,
      width,
      height,
      0.58,
      0.24,
      flip,
    );
    c.save();
    c.globalAlpha *= opacity;
    c.drawImage(cached.canvas, anchorX + cached.x, anchorY + cached.y);
    c.restore();
  }
  const prepared = new Map();
  function preparedImage(key, index, width, height) {
    const id =
      key + ":" + index + ":" + width.toFixed(2) + ":" + height.toFixed(2);
    if (prepared.has(id)) return prepared.get(id);
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(width * 1.5);
    cv.height = Math.ceil(height * 1.5);
    const c = cv.getContext("2d");
    c.imageSmoothingQuality = "high";
    const sheet = sheets[key],
      f = sheet.frames[index];
    if (
      key === "props" ||
      key === "buildings" ||
      key === "flora" ||
      key === "sideProps"
    ) {
      const b = f.b;
      c.drawImage(
        sheet.img,
        f.x + b.x,
        f.y + b.y,
        b.w,
        b.h,
        0,
        0,
        cv.width,
        cv.height,
      );
    } else paintFrame(c, sheet.img, f, cv.width, cv.height);
    prepared.set(id, cv);
    return cv;
  }
  const lighting = new WeakMap();
  function litPaint(paint, color) {
    if (!color) return paint;
    let colors = lighting.get(paint);
    if (!colors) {
      colors = new Map();
      lighting.set(paint, colors);
    }
    if (colors.has(color)) return colors.get(color);
    const cv = document.createElement("canvas");
    cv.width = paint.width;
    cv.height = paint.height;
    const c = cv.getContext("2d");
    c.drawImage(paint, 0, 0);
    c.globalCompositeOperation = "multiply";
    c.globalAlpha = 0.18;
    c.fillStyle = color;
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = "destination-in";
    c.globalAlpha = 1;
    c.drawImage(paint, 0, 0);
    colors.set(color, cv);
    return cv;
  }
  function drawBody(c, sheet, f, left, top, width, height, opts, scale, paint) {
    const t = opts.time || 0,
      action = opts.attack || opts.special;
    const breathing =
      !opts.moving && !action ? Math.sin(t * 2.6 + (opts.seed || 0)) * 0.65 : 0;
    const step = opts.moving ? Math.sin((opts.walk || 0) * 2) * 0.7 : 0;
    const sway = opts.moving ? Math.sin(opts.walk || 0) * 0.35 : 0;
    const progress = action ? (action.total - action.time) / action.total : 0;
    const variant = action?.variant ?? 0,
      contact = action
        ? (action.hitAt ?? action.total * 0.3) / action.total
        : 0,
      strike = action
        ? Math.sin(
            (Math.min(1, progress / Math.max(0.01, contact)) * Math.PI) / 2,
          )
        : 0,
      settling =
        action && action.fired ? Math.max(0, 1 - (progress - contact) * 3) : 0;
    const anticipation = action
      ? action.fired
        ? settling * [1.2, 2.5, 2, 3.5][variant]
        : -strike * [1.2, 2.2, 1.5, 3][variant]
      : 0;
    // Continuous band coordinates keep the legs planted while the chest breathes.
    const bend = (u) => Math.pow(1 - u, 2);
    const yAt = (u) => top + height * u - (breathing + step) * scale * bend(u);
    const bands = opts.moving || /Idle|Fight|Act/.test(sheet.key) ? 1 : 8;
    for (let i = 0; i < bands; i++) {
      const u = i / bands,
        v = (i + 1) / bands,
        dy = yAt(u),
        dh = yAt(v) - dy;
      const offset =
        sway * scale * bend((u + v) / 2) +
        Math.cos(opts.facing || 0) * anticipation * scale * bend((u + v) / 2);
      c.drawImage(
        paint,
        0,
        paint.height * u,
        paint.width,
        paint.height / bands,
        left + offset,
        dy,
        width,
        dh + 0.15,
      );
    }
  }
  B.drawActor = (c, id, x, y, scale = 1, opts = {}) => {
    const chosen = selection(id, opts);
    if (!chosen) {
      locked(c, id, x, y, 65 * scale);
      return;
    }
    const sheet = sheets[chosen.key];
    if (!sheet) return;
    c.save();
    const f = sheet.frames[chosen.index],
      height = (heights[id] || 106) * scale;
    const s =
      height /
      (sheet.rowHeights[Math.floor(chosen.index / sheet.cols)] || f.b.h);
    const anchorX = f.b.rootX ?? f.b.x + f.b.w / 2,
      anchorY = f.b.y + f.b.h;
    const left = x - anchorX * s,
      top = y - anchorY * s,
      width = f.w * s,
      h = f.h * s;
    const jump = opts.dodging
      ? Math.sin(
          B.clamp(
            1 - (opts.dodgeTime ?? 0.1) / (opts.dodgeDuration || 0.21),
            0,
            1,
          ) * Math.PI,
        ) * 12
      : 0;
    c.save();
    if (opts.invuln && Math.floor((opts.time || 0) * 18) % 2 === 0)
      c.globalAlpha *= 0.7;
    if (opts.shadow !== false) {
      softShadow(
        c,
        chosen.key,
        chosen.index,
        left,
        top,
        width,
        h,
        x,
        y,
        0.16 * (1 - jump / 30),
        !!chosen.flip,
      );
      const aoWidth = height * 0.42 * (1 - jump / 35);
      c.drawImage(
        contactShadow,
        x - aoWidth / 2,
        y - height * 0.06,
        aoWidth,
        height * 0.12,
      );
    }
    if (opts.flash > 0) c.filter = "brightness(1.45)";
    if (chosen.flip) {
      c.translate(x * 2, 0);
      c.scale(-1, 1);
    }
    drawBody(
      c,
      sheet,
      f,
      left,
      top - jump,
      width,
      h,
      chosen.flip ? { ...opts, facing: 0 } : opts,
      s,
      litPaint(preparedImage(chosen.key, chosen.index, width, h), opts.light),
    );
    c.restore();
    c.restore();
  };
  B.drawCharacterPortrait = (canvas, id, opts = {}) => {
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, canvas.width, canvas.height);
    const chosen = selection(id, { ...opts, facing: Math.PI / 2 });
    if (!chosen) {
      locked(c, id, canvas.width * 0.5, canvas.height * 1.1, canvas.height);
      return;
    }
    const sheet = sheets[chosen.key];
    if (!sheet) return;
    let index = chosen.index;
    if (id === "ben" && /ALARM|SORPREND/.test(opts.expression || "")) index = 3;
    else if (id === "ben" && /SONRI|FELIZ/.test(opts.expression || ""))
      index = 5;
    const f = sheet.frames[index],
      b = f.b;
    const cropW = Math.min(f.w, b.w * 1.08),
      cropH = Math.min(b.h * 0.54, cropW),
      sx = f.x + b.x + b.w / 2 - cropW / 2,
      sy = f.y + b.y;
    c.drawImage(
      sheet.img,
      sx,
      sy,
      cropW,
      cropH,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  };
  function propSource(index) {
    if (index === 28) return { key: "extractor", index: 0 };
    if (index >= 20) return { key: "sideProps", index: index - 20 };
    if (index >= 16) return { key: "flora", index: index - 16 };
    return [0, 1, 2, 7].includes(index)
      ? { key: "buildings", index: index === 7 ? 3 : index }
      : { key: "props", index };
  }
  // One layout is shared by the sprite, projected shadow, water and culling.
  // Contain the entire alpha silhouette; never stretch it to a collision box.
  B.propRect = (index, x, y, w, h) => {
    const source = propSource(index),
      frame = sheets[source.key]?.frames[source.index];
    if (!frame) return { ...source, x, y, w, h };
    const scale = Math.min(w / frame.b.w, h / frame.b.h),
      width = frame.b.w * scale,
      height = frame.b.h * scale;
    return {
      ...source,
      x: x + (w - width) / 2,
      y: y + h - height,
      w: width,
      h: height,
    };
  };
  B.drawProp = (c, index, x, y, w, h, opts = {}) => {
    const r = B.propRect(index, x, y, w, h);
    if (!sheets[r.key]) return;
    const paint = preparedImage(r.key, r.index, r.w, r.h);
    if (opts.wind || opts.fadeCanopy) {
      for (let i = 0; i < 12; i++) {
        const u = i / 12,
          shift = (opts.wind || 0) * (1 - u) * (1 - u);
        c.save();
        if (opts.fadeCanopy && i < 8) c.globalAlpha *= 0.45;
        c.drawImage(
          paint,
          0,
          paint.height * u,
          paint.width,
          paint.height / 12,
          r.x + shift,
          r.y + r.h * u,
          r.w,
          r.h / 12 + 0.2,
        );
        c.restore();
      }
    } else c.drawImage(paint, r.x, r.y, r.w, r.h);
  };
  B.drawPropShadow = (c, index, x, y, w, h, opacity = 0.17) => {
    const r = B.propRect(index, x, y, w, h);
    if (!sheets[r.key]) return;
    const cached = projection(r.key, r.index, 0, -r.h, r.w, r.h, 0.48, 0.26);
    c.save();
    c.globalAlpha *= opacity;
    c.drawImage(cached.canvas, r.x + cached.x, r.y + r.h + cached.y);
    c.restore();
  };
  const patterns = new Map();
  B.groundPattern = (c, index) => {
    if (patterns.has(index)) return patterns.get(index);
    const a = sheets.terrain;
    if (!a) return "#5b8052";
    const f = a.frames[index],
      cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    cv.getContext("2d").drawImage(
      a.img,
      f.x + 3,
      f.y + 3,
      f.w - 6,
      f.h - 6,
      0,
      0,
      256,
      256,
    );
    const p = c.createPattern(cv, "repeat");
    patterns.set(index, p);
    return p;
  };
})(window.B10);
