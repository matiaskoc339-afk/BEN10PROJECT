"use strict";
(function (B) {
  const xs = [520, 1100, 1700, 2250],
    ys = [430, 930, 1460];
  const town = (w) => ["city", "market"].includes(w.zone);
  const random = (seed) => () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function roads(w) {
    return [
      ...ys.map((y) => ({ x: 0, y, w: w.w, h: 150 })),
      ...xs.map((x, i) => ({ x, y: i < 2 ? 430 : 0, w: 160, h: w.h })),
    ];
  }
  B.surfaceAt = (w, x, y) => {
    if (!town(w)) return "stone";
    if (w.zone === "market" && x >= 950 && x <= 1430 && y >= 130 && y <= 365)
      return "paving";
    const r = roads(w);
    if (r.some((a) => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h))
      return "asphalt";
    if (
      r.some(
        (a) =>
          x >= a.x - 58 &&
          x <= a.x + a.w + 58 &&
          y >= a.y - 58 &&
          y <= a.y + a.h + 58,
      )
    )
      return "paving";
    if (((x - 1375) / 112) ** 2 + ((y - 1366) / 82) ** 2 < 1) return "paving";
    return "grass";
  };
  B.buildingBox = (o) => {
    const width = Math.min(o.w - 16, o.h * 1.43);
    return {
      index: o.label?.includes("CAFÉ")
        ? 7
        : o.palette === 1
          ? 1
          : o.palette === 2
            ? 2
            : 0,
      x: o.x + (o.w - width) / 2,
      y: o.y + o.h - width * 0.9,
      w: width,
      h: width * 0.9,
    };
  };
  function round(c, x, y, w, h, r, color) {
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
  function planting(c, x, y, size, seed) {
    const index = 16 + (seed % 4);
    B.drawPropShadow(
      c,
      index,
      x - size * 1.2,
      y - size,
      size * 2.4,
      size * 1.3,
      0.13,
    );
    B.drawProp(c, index, x - size * 1.2, y - size, size * 2.4, size * 1.3);
  }
  function texture(c, index, x, y, w, h, opacity = 0.45) {
    c.save();
    c.globalAlpha = opacity;
    c.fillStyle = B.groundPattern(c, index);
    c.fillRect(x, y, w, h);
    c.restore();
  }
  B.vehicleBox = (o) => {
    const rv = o.kind === "rv",
      knight = o.kind === "knightcar",
      width = rv ? 250 : knight ? 210 : 175,
      height = rv ? 190 : knight ? 170 : 145;
    return {
      index: rv ? 3 : knight ? 6 : o.palette ? 5 : 4,
      x: o.x + o.w / 2 - width / 2,
      y: o.y + o.h - height,
      w: width,
      h: height,
    };
  };
  function townGround(c, w) {
    const rand = random(70419),
      r = roads(w);
    c.fillStyle = "#739365";
    c.fillRect(0, 0, w.w, w.h);
    texture(c, 0, 0, 0, w.w, w.h, 0.65);
    // Quiet broad lawn shapes sit under material detail.
    for (let j = 0; j < 90; j++) {
      c.fillStyle = j % 2 ? "#8ba46d14" : "#507c5414";
      c.beginPath();
      c.ellipse(
        rand() * w.w,
        rand() * w.h,
        25 + rand() * 100,
        12 + rand() * 35,
        rand(),
        0,
        B.TAU,
      );
      c.fill();
    }
    for (const a of r)
      round(c, a.x - 58, a.y - 58, a.w + 116, a.h + 116, 22, "#c6b99c");
    // Material and paving joints precede asphalt so they never run across the road.
    c.save();
    c.beginPath();
    for (const a of r) c.rect(a.x - 56, a.y - 56, a.w + 112, a.h + 112);
    c.clip();
    texture(c, 1, 0, 0, w.w, w.h, 0.45);
    for (let y = 0; y < w.h; y += 48) {
      line(c, 0, y, w.w, y, "#a69d8517");
      for (let x = (y / 48) % 2 ? 24 : 0; x < w.w; x += 64)
        line(c, x, y, x, y + 48, "#a69d8517");
    }
    c.restore();
    c.fillStyle = "#607578";
    for (const a of r) {
      c.fillRect(a.x, a.y, a.w, a.h);
      texture(c, 2, a.x, a.y, a.w, a.h, 0.55);
    }
    // Segment curbs at intersections, with a narrow stone lip and an inner edge.
    for (const y of ys)
      for (const edge of [y, y + 150]) {
        let start = 0;
        for (const end of [...xs, w.w]) {
          line(c, start, edge, end, edge, "#394f5144", 6);
          line(c, start, edge - 2, end, edge - 2, "#e3d6b5", 3);
          start = end + 160;
        }
      }
    for (let i = 0; i < xs.length; i++)
      for (const edge of [xs[i], xs[i] + 160]) {
        let start = i < 2 ? 430 : 0;
        for (const end of [...ys.filter((y) => y >= start), w.h]) {
          if (end > start) {
            line(c, edge, start, edge, end, "#394f5144", 6);
            line(c, edge - 2, start, edge - 2, end, "#e3d6b5", 3);
          }
          start = end + 150;
        }
      }
    c.save();
    c.setLineDash([25, 33]);
    for (const y of ys) {
      let start = 0;
      for (const end of [...xs, w.w]) {
        line(c, start + 15, y + 75, end - 15, y + 75, "#d9cd9b77", 2);
        start = end + 160;
      }
    }
    c.restore();
    for (let j = 0; j < 2400; j++) {
      const x = rand() * w.w,
        y = rand() * w.h;
      if (B.surfaceAt(w, x, y) !== "asphalt") continue;
      c.fillStyle = j % 2 ? "#d8dfd515" : "#263f4115";
      c.fillRect(x, y, 1.2, 1.2);
    }
    for (const [x, y] of [
      [520, 430],
      [1100, 930],
      [1700, 430],
      [2250, 1460],
    ]) {
      for (let j = 0; j < 6; j++)
        round(c, x + 17, y + 8 + j * 23, 125, 9, 2, "#e1d8b4b3");
    }
    for (const o of w.obstacles.filter((o) => o.kind === "building")) {
      round(c, o.x - 8, o.y + o.h - 36, o.w + 16, 49, 8, "#bcaf9180");
      line(
        c,
        o.x + 8,
        o.y + o.h + 13,
        o.x + o.w - 8,
        o.y + o.h + 13,
        "#e4d5ae99",
        2,
      );
      for (const side of [o.x + 12, o.x + o.w - 14])
        planting(c, side, o.y + o.h + 2, 13, Math.round(side + o.y));
    }
    // A small designed public garden, with paths leading to the fountain and seats.
    c.strokeStyle = "#d7c6a4";
    c.lineWidth = 38;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(1290, 1190);
    c.bezierCurveTo(1420, 1195, 1280, 1280, 1375, 1366);
    c.quadraticCurveTo(1405, 1420, 1505, 1425);
    c.stroke();
    c.lineCap = "butt";
    c.fillStyle = "#d7c6a4";
    c.beginPath();
    c.ellipse(1375, 1366, 109, 78, 0, 0, B.TAU);
    c.fill();
    c.strokeStyle = "#eee1bd";
    c.lineWidth = 3;
    c.stroke();
    c.strokeStyle = "#b3a58766";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(1375, 1366, 98, 69, 0, 0, B.TAU);
    c.stroke();
    for (const [x, y, size] of [
      [1338, 1260, 23],
      [1493, 1320, 28],
      [1510, 1410, 20],
      [1320, 1440, 22],
      [1450, 1190, 22],
    ])
      planting(c, x, y, size, x + y);
    if (w.zone === "market") {
      // The enterable archive has its own floor and open facade, rather than
      // compressing an entire building into its narrow back-wall collision box.
      round(c, 950, 130, 480, 235, 5, "#bdb49c");
      texture(c, 1, 950, 130, 480, 235, 0.6);
      round(c, 1195, 395, 400, 400, 48, "#c5b592");
      c.strokeStyle = "#dfd1ad";
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(1400, 585, 150, 100, 0, 0, B.TAU);
      c.stroke();
      for (const [x, y] of [
        [1220, 425],
        [1565, 425],
        [1230, 760],
        [1560, 760],
      ])
        planting(c, x, y, 24, x + y);
    }
  }
  function interior(c, w) {
    const throne = w.zone === "throne",
      intro = w.zone === "intro";
    c.fillStyle = throne ? "#444c51" : "#40565c";
    c.fillRect(0, 0, w.w, w.h);
    for (let y = 0; y < w.h; y += 80)
      for (let x = 0; x < w.w; x += 120) {
        c.fillStyle = (x / 120 + y / 80) % 3 ? "#607478" : "#657a7e";
        c.fillRect(x + 2, y + 2, 116, 76);
        line(c, x + 3, y + 3, x + 117, y + 3, "#a1b0a12b");
      }
    texture(c, 3, 0, 0, w.w, w.h, 0.32);
    round(c, 90, 350, w.w - 180, 400, 16, throne ? "#716b6480" : "#82959440");
    if (throne) {
      round(c, 370, 390, 1180, 320, 5, "#643c4d");
      c.strokeStyle = "#c4a573";
      c.lineWidth = 3;
      c.strokeRect(385, 405, 1150, 290);
      c.strokeStyle = "#ad8e6a55";
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(1180, 550, 125, 90, 0, 0, B.TAU);
      c.stroke();
    } else {
      for (const y of [345, 750]) line(c, 90, y, w.w - 90, y, "#9dc1b36b", 3);
      if (intro) {
        c.fillStyle = "#334b55";
        c.beginPath();
        c.ellipse(700, 500, 260, 175, 0, 0, B.TAU);
        c.fill();
        c.strokeStyle = "#78b9ad";
        c.lineWidth = 5;
        c.stroke();
      }
    }
  }
  B.paintScenery = (c, w) => {
    c.save();
    if (town(w)) townGround(c, w);
    else interior(c, w);
    c.restore();
  };
  B.drawWall = (c, o) => {
    const { x, y, w, h } = o;
    const shop = o.kind === "shopwall";
    c.save();
    round(c, x + 4, y + 7, w, h, 4, "#20353c80");
    round(c, x, y, w, h, 4, shop ? "#a7a08b" : "#697c7d");
    c.save();
    c.beginPath();
    c.rect(x + 2, y + 2, w - 4, h - 4);
    c.clip();
    for (let yy = y + 30; yy < y + h; yy += 34) {
      line(c, x, yy, x + w, yy, "#40565c", 2);
      for (let xx = x + ((yy - y) % 68 ? 42 : 0); xx < x + w; xx += 84)
        line(c, xx, yy - 32, xx, yy, "#40565c", 2);
    }
    c.restore();
    round(
      c,
      x - 2,
      y - 3,
      w + 4,
      Math.min(13, h * 0.25),
      3,
      shop ? "#d5c7a5" : "#a0aaa0",
    );
    line(c, x, y + h - 4, x + w, y + h - 4, "#334a50", 6);
    if (o.label) {
      round(c, x + w / 2 - 100, y + 19, 200, 35, 4, "#304c48");
      c.fillStyle = "#e6d8af";
      c.font = "bold 12px Arial";
      c.textAlign = "center";
      c.fillText(o.label, x + w / 2, y + 41);
    }
    c.restore();
  };
  B.drawBookcase = (c, o) => {
    const { x, y, w, h } = o;
    c.save();
    round(c, x + 5, y + h - 4, w, 10, 3, "#263e3738");
    round(c, x, y - 29, w, h + 29, 2, "#66553f");
    round(c, x + 5, y - 23, w - 10, h + 17, 1, "#403f32");
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 12; col++) {
        const height = 15 + ((col * 3 + row) % 5);
        c.fillStyle = ["#b77a60", "#76907b", "#c5ab74", "#718b91"][col % 4];
        c.fillRect(x + 8 + col * 7, y - 19 + row * 25 + 20 - height, 5, height);
      }
      round(c, x + 3, y + row * 25, w - 6, 4, 1, "#ae9368");
    }
    round(c, x - 2, y - 31, w + 4, 6, 2, "#b4a07a");
    c.restore();
  };
})(window.B10);
