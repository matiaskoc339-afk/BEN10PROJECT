"use strict";
(function (B) {
  const { poly, ellipse, line, box, label } = B.art;
  const surfaces = new Map();
  function random(seed) {
    let n = seed;
    return () => {
      n = (Math.imul(1664525, n) + 1013904223) >>> 0;
      return n / 4294967296;
    };
  }
  function ground(c, w) {
    let surface = surfaces.get(w.zone);
    if (!surface) {
      surface = document.createElement("canvas");
      surface.width = w.w;
      surface.height = w.h;
      const p = surface.getContext("2d"),
        r = random(w.zone.length * 973 + 41),
        city = ["city", "market"].includes(w.zone);
      // A fixed, cached texture prevents shimmering or random changes between frames.
      for (let j = 0; j < 18000; j++) {
        const x = r() * w.w,
          y = r() * w.h;
        p.fillStyle = j % 2 ? "#ffffff08" : "#050e1812";
        p.fillRect(x, y, 1 + r() * 2, 0.6 + r() * 1.5);
      }
      if (city) {
        for (let j = 0; j < 9; j++) {
          const x = 105 + j * 191,
            y = j % 2 ? 744 : 453;
          box(p, x, y, 38, 9, "#26353d");
          for (let z = 0; z < 6; z++)
            line(
              p,
              [
                [x + 4 + z * 5, y + 1],
                [x + 4 + z * 5, y + 8],
              ],
              "#84958e",
              1,
            );
        }
        for (const [x, y] of [
          [660, 660],
          [1260, 520],
          [250, 710],
        ]) {
          ellipse(p, x, y, 23, 11, "#3b4b50", "#8b9182", 1);
          ellipse(p, x, y, 17, 7, "#4b5b60", "#657476", 1);
          for (let j = -2; j <= 2; j++)
            line(
              p,
              [
                [x - 12, y + j * 2],
                [x + 12, y + j * 2],
              ],
              "#283d45",
              0.7,
            );
        }
        for (let j = 0; j < 18; j++) {
          const x = 100 + r() * 1600,
            y = 465 + r() * 290;
          line(
            p,
            [
              [x, y],
              [x + 7, y - 3],
              [x + 13, y + 1],
              [x + 20, y - 7],
              [x + 30, y - 6],
            ],
            "#253b433a",
            0.7,
          );
        }
        for (let j = 0; j < 28; j++) {
          const x = 40 + r() * 1720,
            y = j % 2 ? 790 + r() * 35 : 365 + r() * 45;
          poly(
            p,
            [
              [x, y],
              [x + 5, y - 1],
              [x + 7, y + 4],
              [x + 2, y + 5],
            ],
            j % 3 ? "#d7cbb344" : "#b2a97d66",
            null,
          );
        }
        // Road stencil arrows and a parking bay are authored decals, not extra UI.
        for (const x of [780, 1450])
          poly(
            p,
            [
              [x, 684],
              [x + 30, 684],
              [x + 30, 677],
              [x + 48, 691],
              [x + 30, 704],
              [x + 30, 698],
              [x, 698],
            ],
            "#d6d0ae55",
            null,
          );
        line(
          p,
          [
            [1160, 735],
            [1310, 735],
            [1310, 660],
          ],
          "#d1c29a55",
          2,
        );
        label(p, "P", 1190, 714, 25, "#d1c29a55");
        for (const y of [433, 776]) {
          const g = p.createLinearGradient(0, y - 8, 0, y + 12);
          g.addColorStop(0, "#112b3b00");
          g.addColorStop(0.5, "#112b3b40");
          g.addColorStop(1, "#112b3b00");
          p.fillStyle = g;
          p.fillRect(0, y - 8, w.w, 20);
        }
      } else {
        for (let j = 0; j < 48; j++) {
          const x = 80 + r() * 1640,
            y = 140 + r() * 800;
          line(
            p,
            [
              [x, y],
              [x + 14, y + 6],
              [x + 27, y + 2],
              [x + 33, y + 12],
            ],
            "#071b2533",
            1,
          );
        }
        for (const x of [70, 1720]) {
          box(p, x, 140, 5, 810, "#0a1e28");
          box(p, x + 1, 140, 1.5, 810, "#7aabb166");
        }
        if (w.zone === "throne") {
          for (const y of [392, 704]) {
            line(
              p,
              [
                [402, y],
                [1490, y],
              ],
              "#b3a17b",
              2,
            );
            line(
              p,
              [
                [402, y + 5],
                [1490, y + 5],
              ],
              "#988365",
              0.6,
            );
          }
          for (let x = 440; x < 1470; x += 55) {
            poly(
              p,
              [
                [x, 400],
                [x + 6, 406],
                [x, 412],
                [x - 6, 406],
              ],
              "#b3a17b88",
              null,
            );
            poly(
              p,
              [
                [x, 683],
                [x + 6, 689],
                [x, 695],
                [x - 6, 689],
              ],
              "#b3a17b88",
              null,
            );
          }
          ellipse(p, 1160, 552, 145, 130, "#201e2b22", "#a89a7144", 2);
          poly(
            p,
            [
              [1160, 465],
              [1214, 552],
              [1160, 637],
              [1106, 552],
            ],
            null,
            "#a89a7144",
            2,
          );
        }
        for (const [x, y] of [
          [320, 210],
          [1320, 860],
          [650, 820],
        ]) {
          box(p, x, y, 65, 7, "#182f35");
          for (let j = 0; j < 6; j++)
            line(
              p,
              [
                [x + j * 12, y],
                [x + 5 + j * 12, y + 6],
              ],
              "#d1b98177",
              2,
            );
        }
      }
      surfaces.set(w.zone, surface);
    }
    c.drawImage(surface, 0, 0);
  }
  function building(c, o) {
    const { x, y, w, h } = o,
      colors = [
        ["#667b80", "#a3ac9e", "#3e565e", "#d9d2b9"],
        ["#9d806d", "#c5b49b", "#665e58", "#e1c9a5"],
        ["#596e83", "#9ba8aa", "#344d64", "#ccd5c8"],
      ][o.palette || 0];
    poly(
      c,
      [
        [x + 10, y + 15],
        [x + w + 26, y + 24],
        [x + w + 29, y + h + 24],
        [x + 17, y + h + 23],
      ],
      "#071b2b45",
      null,
    );
    box(c, x, y, w, h, colors[1]);
    const roof = c.createLinearGradient(x, y, x + w, y + h - 70);
    roof.addColorStop(0, colors[0]);
    roof.addColorStop(1, colors[2]);
    c.fillStyle = roof;
    c.fillRect(x + 5, y + 5, w - 10, h - 64);
    box(c, x, y, w, 7, colors[3]);
    box(c, x, y + 4, 7, h - 62, colors[1]);
    box(c, x + w - 8, y + 6, 8, h - 61, colors[2]);
    line(
      c,
      [
        [x + 13, y + 14],
        [x + w - 18, y + 14],
        [x + w - 18, y + h - 72],
      ],
      "#d6ddca55",
      1.3,
    );
    const frontY = y + h - 56;
    box(c, x, frontY, w, 56, colors[1]);
    box(c, x, frontY, w, 6, "#142e3b55");
    box(c, x, y + h - 5, w, 5, "#3b536055");
    for (let xx = x + 18; xx < x + w - 28; xx += 65) {
      box(c, xx, frontY + 14, 43, 32, colors[2]);
      const glass = c.createLinearGradient(xx, frontY, xx + 43, frontY + 46);
      glass.addColorStop(0, "#73949a");
      glass.addColorStop(1, "#263e4c");
      c.fillStyle = glass;
      c.fillRect(xx + 2, frontY + 16, 39, 27);
      poly(
        c,
        [
          [xx + 3, frontY + 16],
          [xx + 20, frontY + 16],
          [xx + 4, frontY + 35],
        ],
        "#bbd2c155",
        null,
      );
      line(
        c,
        [
          [xx + 21, frontY + 16],
          [xx + 21, frontY + 43],
        ],
        colors[1],
        2,
      );
      box(c, xx - 2, frontY + 45, 47, 3, colors[3]);
    }
    // Individual rooftop details give the buildings scale and a consistent light source.
    box(c, x + 27, y + 28, 91, 58, "#10293344");
    box(c, x + 23, y + 22, 91, 58, colors[1], colors[2]);
    box(c, x + 28, y + 27, 81, 48, colors[0]);
    ellipse(c, x + 67, y + 51, 20, 19, colors[2], "#a2b0a0", 2);
    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI) / 3;
      line(
        c,
        [
          [x + 67, y + 51],
          [x + 67 + Math.cos(a) * 14, y + 51 + Math.sin(a) * 14],
        ],
        colors[0],
        4,
      );
    }
    line(
      c,
      [
        [x + 131, y + 31],
        [x + 131, y + 87],
        [x + w - 33, y + 87],
      ],
      "#162e3a66",
      8,
    );
    line(
      c,
      [
        [x + 129, y + 29],
        [x + 129, y + 85],
        [x + w - 35, y + 85],
      ],
      colors[1],
      5,
    );
    line(
      c,
      [
        [x + 128, y + 29],
        [x + 128, y + 83],
        [x + w - 35, y + 83],
      ],
      "#d8dcc044",
      1,
    );
    box(c, x + w - 84, y + 24, 51, 34, "#1d344255");
    box(c, x + w - 88, y + 20, 51, 34, colors[1], colors[2]);
    for (let j = 0; j < 5; j++)
      line(
        c,
        [
          [x + w - 82, y + 25 + j * 5],
          [x + w - 43, y + 25 + j * 5],
        ],
        colors[2],
        1.5,
      );
    const labelW = Math.min(w * 0.64, 280),
      labelX = x + (w - labelW) / 2;
    box(c, labelX + 2, frontY - 23, labelW, 28, "#0c263c55");
    box(c, labelX, frontY - 27, labelW, 28, "#233a46", colors[1]);
    line(
      c,
      [
        [labelX + 3, frontY - 25],
        [labelX + labelW - 3, frontY - 25],
      ],
      "#c1c39855",
      1,
    );
    label(c, o.label || "BELLWOOD", x + w * 0.5, frontY - 9, 10, colors[3]);
  }
  function atmosphere(c, w, t) {
    c.save();
    const city = ["city", "market"].includes(w.zone);
    const shade = c.createLinearGradient(0, 0, w.w, w.h);
    shade.addColorStop(0, "#ccdfd205");
    shade.addColorStop(0.5, "#16416400");
    shade.addColorStop(1, "#10244020");
    c.fillStyle = shade;
    c.fillRect(0, 0, w.w, w.h);
    if (!city)
      for (const o of w.objects.filter(
        (a) => ["support", "socket", "bridge"].includes(a.type) && !a.broken,
      )) {
        const col = o.heat >= 100 ? "255,159,82" : "107,211,193",
          glow = c.createRadialGradient(o.x, o.y - 20, 3, o.x, o.y - 20, 110);
        glow.addColorStop(0, `rgba(${col},.14)`);
        glow.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = glow;
        c.fillRect(o.x - 115, o.y - 135, 230, 230);
      }
    for (const d of w.decor.filter((a) => a.kind === "lamp")) {
      const glow = c.createRadialGradient(
        d.x + 23,
        d.y + 2,
        4,
        d.x + 23,
        d.y + 2,
        95,
      );
      glow.addColorStop(0, "#ffdc8c13");
      glow.addColorStop(1, "#ffdc8c00");
      c.fillStyle = glow;
      c.fillRect(d.x - 75, d.y - 100, 200, 200);
    }
    c.restore();
  }
  B.environmentArt = { ground, building, atmosphere };
})(window.B10);
