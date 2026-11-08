"use strict";
(function (B) {
  const sheets = {},
    specs = {
      ben: ["assets/characters/ben-atlas.png", 6, 4],
      four: ["assets/characters/four-atlas.png", 6, 4],
      heat: ["assets/characters/heat-atlas.png", 6, 4],
      diamond: ["assets/characters/diamond-atlas.png", 6, 4],
      knight: ["assets/characters/knight-atlas.png", 6, 4],
      cast: ["assets/characters/story-cast.png", 4, 3],
      props: ["assets/world/props.png", 4, 4],
      terrain: ["assets/world/terrain.png", 2, 2],
    };
  function bounds(img, x, y, w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    c.drawImage(img, x, y, w, h, 0, 0, w, h);
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
    return maxX > minX
      ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
      : { x: 0, y: 0, w, h };
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
                const x = Math.round((col * img.width) / cols),
                  y = Math.round((row * img.height) / rows);
                frames.push({
                  x,
                  y,
                  w: sw,
                  h: sh,
                  b:
                    key === "terrain"
                      ? { x: 0, y: 0, w: sw, h: sh }
                      : bounds(img, x, y, sw, sh),
                });
              }
            sheets[key] = { img, cols, rows, frames };
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
    ben: 96,
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
    let col = 0;
    const action = opts.attack || opts.special;
    if (action) {
      const elapsed = action.total - action.time,
        contact = action.hitAt ?? action.total * 0.3;
      col = elapsed < contact ? 3 : elapsed < contact + 0.085 ? 4 : 5;
    } else if (opts.blocking || opts.dodging) col = 5;
    else if (opts.moving || (opts.walk && opts.moving !== false))
      col = [0, 1, 0, 2][Math.floor((opts.walk || 0) * 0.8) % 4];
    return { key, index: row * 6 + col };
  }
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
  B.drawActor = (c, id, x, y, scale = 1, opts = {}) => {
    const chosen = selection(id, opts);
    if (!chosen) {
      locked(c, id, x, y, 65 * scale);
      return;
    }
    const sheet = sheets[chosen.key];
    if (!sheet) return;
    const f = sheet.frames[chosen.index],
      ref = sheet.frames[Math.floor(chosen.index / sheet.cols) * sheet.cols],
      height = (heights[id] || 106) * scale,
      s = height / ref.b.h;
    // A constant row anchor prevents punches from dragging the body across the ground.
    const anchorX = ref.b.x + ref.b.w * 0.5,
      anchorY = f.b.y + f.b.h;
    c.save();
    if (opts.invuln && Math.floor((opts.time || 0) * 18) % 2 === 0)
      c.globalAlpha = 0.6;
    if (opts.flash > 0) c.filter = "brightness(1.7)";
    if (opts.shadow !== false) {
      c.fillStyle = "#1a233b33";
      c.beginPath();
      c.ellipse(x, y + 2, height * 0.23, height * 0.065, 0, 0, B.TAU);
      c.fill();
    }
    c.drawImage(
      sheet.img,
      f.x,
      f.y,
      f.w,
      f.h,
      x - anchorX * s,
      y - anchorY * s,
      f.w * s,
      f.h * s,
    );
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
  B.drawProp = (c, index, x, y, w, h) => {
    const sheet = sheets.props;
    if (!sheet) return;
    const f = sheet.frames[index],
      b = f.b;
    c.drawImage(sheet.img, f.x + b.x, f.y + b.y, b.w, b.h, x, y, w, h);
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
