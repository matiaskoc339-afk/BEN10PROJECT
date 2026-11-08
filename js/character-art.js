"use strict";
/* Character-specific model sheets. All artwork is local, resolution-independent
   and articulated from the same combat state used by the simulation. */
(function (B) {
  const { poly, ellipse, line, box, badge } = B.art;
  const ink = "#111923",
    paths = new Map();
  function shape(c, d, fill, stroke = ink, width = 1.45) {
    let p = paths.get(d);
    if (!p) {
      p = new Path2D(d);
      // Animated coordinates must not accumulate a new cached path every frame.
      if (!/\d\.\d{4}/.test(d)) {
        if (paths.size >= 2048) paths.delete(paths.keys().next().value);
        paths.set(d, p);
      }
    }
    if (fill) {
      c.fillStyle = fill;
      c.fill(p);
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.stroke(p);
    }
  }
  function bone(c, a, b, w1, w2, fill, shade) {
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
      nx = -Math.sin(angle),
      ny = Math.cos(angle);
    poly(
      c,
      [
        [a[0] + nx * w1, a[1] + ny * w1],
        [b[0] + nx * w2, b[1] + ny * w2],
        [b[0] - nx * w2, b[1] - ny * w2],
        [a[0] - nx * w1, a[1] - ny * w1],
      ],
      fill,
      ink,
      1.5,
    );
    if (shade)
      poly(
        c,
        [
          [a[0] - nx * w1, a[1] - ny * w1],
          [b[0] - nx * w2, b[1] - ny * w2],
          [b[0], b[1]],
          [a[0], a[1]],
        ],
        shade,
        null,
      );
  }
  function fist(c, x, y, s, skin = "#e5ad7e") {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    shape(c, "M-5-5 Q-1-8 5-5 L7 1 3 6 -4 5 -7 0Z", skin);
    line(
      c,
      [
        [-3, -3],
        [-2, 1],
      ],
      "#9e6b51",
      0.7,
    );
    line(
      c,
      [
        [0, -4],
        [1, 0],
      ],
      "#9e6b51",
      0.7,
    );
    c.restore();
  }
  function shoe(c, x, y, flip = 1, color = "#20282d") {
    c.save();
    c.translate(x, y);
    c.scale(flip, 1);
    shape(c, "M-5-8 L4-8 8-3 15-1 16 3 -7 3Z", color);
    shape(c, "M-7 0 L16 0 16 3 -7 3Z", "#d5daca");
    shape(c, "M0-7 L5-7 8-3 3-3Z", "#e6e9da", null);
    c.restore();
  }
  function eye(c, x, y, side, expression, iris = "#568c43", evil = false) {
    c.save();
    c.translate(x, y);
    c.scale(side, 1);
    const angry = /FURIOS|AMENAZ|DESAF|DECIDID|MOLEST/.test(expression);
    shape(
      c,
      angry ? "M-6-2 L5 0 2 4 -4 3Z" : "M-6 0 Q0-5 5-1 L4 3 -3 4Z",
      evil ? "#e8c07e" : "#f0f0d4",
      ink,
      1,
    );
    ellipse(c, 1, 1, 2.1, 3, iris);
    ellipse(c, 1.7, 1, 1, 2.5, "#11221b");
    line(
      c,
      angry
        ? [
            [-7, -5],
            [4, -2],
          ]
        : [
            [-7, -5],
            [3, -6],
          ],
      evil ? "#1b2023" : "#5f3b25",
      2,
    );
    c.restore();
  }
  function benHead(c, e) {
    c.save();
    c.translate(0, -90);
    c.scale(0.9, 0.82);
    c.translate(0, 90);
    shape(
      c,
      "M-17-91 Q-20-80-13-76 L-11-70 9-70 12-78 Q21-81 17-91Z",
      "#dfa576",
    );
    shape(
      c,
      "M-16-103 Q-6-113 9-106 L18-96 15-82 6-74 -5-75 -14-82Z",
      "#f0bd8b",
    );
    shape(c, "M9-103 L17-95 14-82 6-75 1-76 9-83Z", "#dca376", null);
    shape(
      c,
      "M-17-87 L-21-99 -18-111 -11-109 -9-117 -1-113 10-117 8-112 20-109 17-99 12-92 9-101 -2-100 -9-96 -13-86 -15-92Z",
      "#70462a",
    );
    shape(
      c,
      "M-17-104 L-9-109 -8-112 1-109 11-112 8-106 -4-105 -11-99Z",
      "#a3733f",
      null,
    );
    eye(c, -7, -89, 1, e);
    eye(c, 8, -90, -1, e);
    line(
      c,
      [
        [1, -86],
        [-1, -82],
        [2, -81],
      ],
      "#ba815b",
      0.85,
    );
    if (/SORPREND|ALARM|PREOCUP/.test(e))
      ellipse(c, 1, -78, 2.3, 2.5, "#724835");
    else if (/SONRI|FELIZ|IRÓN|BURL/.test(e))
      shape(c, "M-5-79 L7-80 3-76 -2-76Z", "#f8e4bf", "#8a563c", 0.7);
    else
      line(
        c,
        [
          [-5, -78],
          [5, -79],
        ],
        "#784b37",
        1.1,
      );
    c.restore();
  }
  function humanLegs(
    c,
    p,
    { pants = "#697448", shade = "#434f36", long = false } = {},
  ) {
    const stride = p.stride,
      upper = long ? -54 : -44;
    bone(c, [-8, upper], [-12 + stride * 0.5, -24], 8, 6, pants, shade);
    bone(
      c,
      [-12 + stride * 0.5, -24],
      [-14 - stride * 0.5, -7],
      6,
      5,
      pants,
      shade,
    );
    bone(c, [8, upper], [12 - stride * 0.5, -24], 8, 6, pants, shade);
    bone(
      c,
      [12 - stride * 0.5, -24],
      [14 + stride * 0.5, -7],
      6,
      5,
      pants,
      shade,
    );
    shoe(c, -15 - stride * 0.5, -2, -1);
    shoe(c, 15 + stride * 0.5, -2);
  }
  function ben(c, p) {
    humanLegs(c, p);
    shape(c, "M-15-42 L-13-58 12-58 16-40 7-36 -4-39 -13-36Z", "#6a784c");
    shape(c, "M-14-42 L-12-51 -5-51 -6-40Z", "#87915a", null);
    line(
      c,
      [
        [7, -50],
        [14, -50],
        [13, -41],
        [8, -41],
      ],
      "#384b33",
      1,
    );
    // The shoulder line sits below a visible neck; arms are bent, never horizontal.
    shape(
      c,
      "M-9-73 L-16-69 -18-56 -12-53 -13-42 10-41 15-49 17-64 10-71 6-72Z",
      "#e8e9d9",
    );
    shape(c, "M-3-72 L4-72 7-43 -2-43Z", "#18242a", null);
    shape(c, "M10-69 L16-64 13-45 7-43 5-64Z", "#c4cbbd", null);
    line(
      c,
      [
        [-12, -57],
        [-11, -46],
      ],
      "#b0b9a9",
      1,
    );
    const a = p.attack,
      guard = p.block,
      hero = p.pose === "hero";
    const leftElbow = [-20 - p.stride * 0.35, -49],
      leftHand =
        p.pose === "captured"
          ? [-23, -59]
          : hero
            ? [-5, -64]
            : guard
              ? [-9, -78]
              : [-16, -37 + p.stride * 0.45];
    const rightElbow = [21, -50 - p.stride * 0.4],
      rightHand =
        p.pose === "captured"
          ? [24, -59]
          : a
            ? [31 + p.punch * 30, -62 - p.punch * 7]
            : guard
              ? [15, -72]
              : [24, -36 - p.stride * 0.35];
    bone(c, [-13, -65], leftElbow, 5.5, 4, "#e5e6d5", "#bcc5b8");
    bone(c, leftElbow, leftHand, 4.3, 3.2, "#eab586", "#cb9065");
    fist(c, ...leftHand, 0.72);
    c.save();
    c.translate(leftHand[0], leftHand[1] + 6);
    c.rotate(-0.5);
    box(c, -5, -4, 10, 7, "#323b39", ink);
    badge(c, 0, -0.5, 4);
    c.restore();
    bone(c, [13, -65], rightElbow, 5.5, 4, "#e5e6d5", "#bcc5b8");
    bone(c, rightElbow, rightHand, 4.3, 3.2, "#eab586", "#cb9065");
    fist(c, ...rightHand, 0.78);
    c.save();
    c.translate(0, -74);
    c.rotate(p.attack ? -0.07 * p.punch : p.stride * 0.004);
    c.translate(0, 74);
    benHead(c, p.expression);
    c.restore();
  }
  function kevin(c, p) {
    humanLegs(c, p, { pants: "#68707b", shade: "#3e4856", long: true });
    shape(
      c,
      "M-10-83 L-18-76 -15-52 -19-45 -9-47 -3-44 5-47 15-45 13-59 15-77 6-84Z",
      "#222831",
    );
    shape(c, "M9-80 L14-76 12-50 4-49Z", "#111822", null);
    line(
      c,
      [
        [-11, -51],
        [-7, -53],
        [-5, -49],
        [2, -51],
      ],
      "#6c7076",
      1,
    );
    bone(c, [-14, -74], [-24, -53], 4.5, 3.5, "#d1ad99", "#9d8075");
    bone(c, [-24, -53], [-23, -38], 3.5, 2.7, "#d1ad99", "#9d8075");
    fist(c, -23, -37, 0.7, "#d1ad99");
    bone(c, [13, -74], [22, -58], 4.5, 3.4, "#d1ad99", "#9d8075");
    bone(c, [22, -58], [19, -44], 3.5, 2.7, "#d1ad99", "#9d8075");
    fist(c, 19, -43, 0.72, "#d1ad99");
    shape(c, "M-7-89 L-7-79 0-75 7-81 7-91Z", "#bf9986");
    shape(c, "M-14-112 L8-117 16-105 13-91 5-84 -5-87 -13-96Z", "#d2b09a");
    shape(c, "M8-110 L15-104 12-92 4-85 -1-89 6-94Z", "#ae8e7e", null);
    shape(
      c,
      "M-16-91 L-22-101 -17-120 -9-124 -5-121 5-126 15-117 19-103 14-94 11-107 2-102 -5-92 -4-104 -11-97 -12-87Z",
      "#19212a",
    );
    shape(c, "M-15-114 L-8-119 -5-115 6-122 9-116 -4-108Z", "#3a4249", null);
    eye(c, -6, -100, 1, "FURIOSO", "#666a67", true);
    eye(c, 8, -101, -1, "FURIOSO", "#666a67", true);
    line(
      c,
      [
        [-5, -91],
        [5, -92],
        [8, -90],
      ],
      "#714e44",
      1.1,
    );
    line(
      c,
      [
        [-7, -80],
        [0, -68],
        [8, -80],
      ],
      "#8b9696",
      1,
    );
    shape(c, "M-2-70 L3-70 3-64 -2-64Z", "#aeb6ad", ink, 0.7);
  }
  function gwen(c, p) {
    humanLegs(c, p, { pants: "#577488", shade: "#354b63" });
    shape(c, "M-10-74 L-17-64 -13-43 13-43 15-64 8-74Z", "#598fbd");
    shape(c, "M7-70 L14-63 11-45 5-44Z", "#326586", null);
    for (const s of [-1, 1]) {
      bone(c, [s * 13, -65], [s * 19, -50], 4.8, 3.6, "#6b9dc1", "#3e779f");
      bone(
        c,
        [s * 19, -50],
        [s * 17, -36 + p.stride * s],
        3.6,
        2.6,
        "#efbd98",
        "#c89274",
      );
      fist(c, s * 17, -35 + p.stride * s, 0.65);
    }
    // Classic blue shirt's cat emblem, rather than an unrelated glyph.
    shape(c, "M-5-59 L-5-63 -1-61 4-64 5-58 3-54 -3-54Z", "#ecead1", ink, 0.6);
    ellipse(c, -1, -58, 0.7, 1, "#263b45");
    ellipse(c, 3, -58, 0.7, 1, "#263b45");
    shape(c, "M-8-79 L-7-71 5-71 8-80Z", "#dba17b");
    shape(c, "M-15-102 Q0-114 15-101 L13-84 5-76 -7-79 -15-88Z", "#efbd98");
    shape(
      c,
      "M-16-84 Q-23-114-4-116 Q20-118 20-98 L15-80 12-91 11-102 -3-105 -11-99 -12-87 -13-76 -21-79Z",
      "#aa502f",
    );
    shape(c, "M-13-105 Q0-118 13-105 L1-110 -9-103Z", "#d47943", null);
    eye(c, -6, -94, 1, p.expression, "#55979b");
    eye(c, 7, -94, -1, p.expression, "#55979b");
    line(
      c,
      [
        [-3, -83],
        [4, -83],
      ],
      "#a56a58",
      1,
    );
  }
  function max(c, p) {
    humanLegs(c, p, { pants: "#737d60", shade: "#465640", long: true });
    shape(
      c,
      "M-14-87 L-24-77 -23-45 -12-37 15-37 25-47 22-77 11-86Z",
      "#bd6953",
    );
    shape(c, "M8-84 L21-76 22-48 13-39 4-42Z", "#964e43", null);
    shape(c, "M-11-86 L0-75 10-86 4-64Z", "#ddb092");
    for (const s of [-1, 1]) {
      bone(c, [s * 21, -74], [s * 29, -56], 7, 6, "#c37158", "#a55347");
      bone(c, [s * 29, -56], [s * 27, -38], 5.5, 4.2, "#dba982", "#b67f64");
      fist(c, s * 27, -36, 1, "#dba982");
    }
    for (const [x, y] of [
      [-12, -68],
      [11, -57],
      [-11, -48],
      [10, -77],
    ]) {
      shape(c, `M${x - 4} ${y}l4-4 4 4-4 4Z`, "#e0aa85", null);
      line(
        c,
        [
          [x, y - 6],
          [x, y + 6],
        ],
        "#ead4a0",
        1,
      );
    }
    shape(c, "M-14-114 Q0-127 16-113 L18-98 11-86 -9-85 -18-97Z", "#deb08e");
    shape(
      c,
      "M-18-101 L-21-113 -12-125 5-127 20-117 18-103 11-114 -11-114 -13-100Z",
      "#d3d0bb",
    );
    shape(c, "M-15-116 L-9-122 8-123 16-116Z", "#f2e9cb", null);
    eye(c, -7, -105, 1, p.expression, "#527d88");
    eye(c, 8, -105, -1, p.expression, "#527d88");
    line(
      c,
      [
        [-7, -92],
        [7, -92],
      ],
      "#91654f",
      1.2,
    );
    line(
      c,
      [
        [-9, -97],
        [-4, -98],
      ],
      "#b18168",
      0.8,
    );
    line(
      c,
      [
        [4, -98],
        [9, -97],
      ],
      "#b18168",
      0.8,
    );
  }
  function vilgax(c, p) {
    const skin = "#79947c",
      shade = "#455e55",
      steel = "#34454d";
    for (const s of [-1, 1]) {
      bone(c, [s * 17, -66], [s * 24, -34], 12, 10, steel, "#222f36");
      bone(c, [s * 24, -34], [s * 27, -10], 11, 10, "#60716e", "#354b49");
      shape(
        c,
        `M${s * 27 - 11}-14 L${s * 27 + 10}-14 ${s * 27 + 16} 0 ${s * 27 + 10} 5 ${s * 27 - 14} 5Z`,
        "#384b50",
      );
      line(
        c,
        [
          [s * 27 - 8, -28],
          [s * 27 + 8, -28],
        ],
        "#8a9c8b",
        2,
      );
    }
    shape(
      c,
      "M-28-122 L-43-106 -35-78 -20-57 20-57 37-78 42-107 25-123Z",
      skin,
    );
    shape(c, "M4-119 L30-115 35-86 18-61 4-62 13-83Z", shade, null);
    shape(c, "M-24-121 L-40-124 -57-109 -48-90 -30-95 -20-110Z", steel);
    shape(c, "M23-121 L41-124 57-108 48-90 31-95 20-110Z", steel);
    shape(c, "M-40-120 L-53-109 -46-103 -32-111Z", "#6a7b79", null);
    shape(c, "M39-120 L52-109 46-103 30-112Z", "#6a7b79", null);
    shape(c, "M-25-120 L-14-106 -17-86 -31-86 -36-102Z", "#743f3f");
    shape(c, "M25-120 L14-106 17-86 31-86 36-102Z", "#743f3f");
    shape(c, "M-21-81 L20-81 24-64 14-53 -15-53 -25-64Z", steel);
    line(
      c,
      [
        [-11, -88],
        [0, -84],
        [11, -88],
      ],
      "#354e45",
      2,
    );
    line(
      c,
      [
        [-10, -96],
        [0, -92],
        [10, -96],
      ],
      "#354e45",
      2,
    );
    for (const s of [-1, 1]) {
      const el = [s * 48, -81],
        hand = [s * (47 + p.punch * 12), -47];
      bone(c, [s * 40, -105], el, 13, 12, skin, shade);
      bone(c, el, hand, 13, 10, skin, shade);
      shape(
        c,
        `M${s * 47 - 13}-78 L${s * 47 + 12}-78 ${s * 47 + 13}-57 ${s * 47 - 10}-53Z`,
        "#6c4844",
      );
      for (let j = 0; j < 3; j++)
        ellipse(c, s * 47, -72 + j * 7, 4, 2.4, "#ad6f57", ink, 0.7);
      fist(c, hand[0], hand[1], 1.75, skin);
    }
    shape(
      c,
      "M-19-148 Q0-164 20-148 L22-129 15-116 -17-118 -24-132Z",
      "#8da28a",
    );
    shape(c, "M8-152 L19-146 19-128 10-118 3-124Z", "#5c7a68", null);
    shape(c, "M-23-140 L-31-136 -27-126 -19-127Z", "#738f7d");
    shape(c, "M22-141 L29-135 26-125 19-126Z", "#738f7d");
    shape(c, "M-18-138 L-3-135 -6-131 -16-132Z", "#ee9c73", ink, 1.3);
    shape(c, "M3-135 L18-138 16-132 6-131Z", "#ee9c73", ink, 1.3);
    line(
      c,
      [
        [-19, -141],
        [-3, -137],
      ],
      "#263c37",
      3,
    );
    line(
      c,
      [
        [3, -137],
        [18, -142],
      ],
      "#263c37",
      3,
    );
    for (let j = -2; j <= 2; j++) {
      const x = j * 6;
      shape(
        c,
        `M${x - 3}-128 Q${x - 7}-114 ${x - 5}-104 Q${x - 4}-97 ${x + 2}-101 Q${x - 1}-105 ${x + 2}-113 L${x + 4}-128Z`,
        j > 0 ? "#6d8872" : "#92a487",
        ink,
        1.15,
      );
      line(
        c,
        [
          [x - 1, -120],
          [x - 2, -111],
        ],
        "#b4baa0",
        0.65,
      );
    }
    line(
      c,
      [
        [-12, -151],
        [-5, -154],
        [3, -154],
      ],
      "#b0b69b",
      1,
    );
  }
  function malware(c, p) {
    const dark = "#171d27",
      red = "#c43d32",
      lit = "#ff955b";
    // Corrupted Mechamorph: asymmetric mass, cable limbs and a single sensor.
    shape(
      c,
      "M-13-69 L-21-40 -24-6 -39 2 -15 5 -7-29 1-49 7-28 9-1 28 4 37-2 21-11 17-45 15-69Z",
      dark,
    );
    line(
      c,
      [
        [-13, -64],
        [-17, -35],
        [-20, -9],
        [-30, -3],
      ],
      red,
      4,
    );
    line(
      c,
      [
        [10, -60],
        [10, -34],
        [16, -15],
        [24, -6],
      ],
      red,
      4,
    );
    shape(c, "M-15-126 L-37-117 -35-88 -21-65 13-60 29-87 26-117 8-132Z", dark);
    shape(
      c,
      "M-13-123 L-27-111 -23-94 -11-87 -14-70 0-65 4-93 -6-104Z",
      red,
      null,
    );
    shape(c, "M8-124 L22-113 21-100 8-96 4-106Z", red, null);
    shape(
      c,
      "M-31-119 L-46-128 -55-111 -48-77 -39-52 -47-22 -34-35 -27-60 -29-90Z",
      dark,
    );
    shape(
      c,
      "M-45-118 L-48-109 -44-84 -36-65 -35-48 -31-59 -35-87 -34-110Z",
      red,
      null,
    );
    shape(
      c,
      "M24-115 L43-111 51-88 42-70 44-53 36-41 29-60 31-82 26-94Z",
      dark,
    );
    shape(
      c,
      "M32-108 L41-104 43-88 34-74 34-61 39-55 37-45 28-61 32-83Z",
      red,
      null,
    );
    for (const [x, y] of [
      [-40, -38],
      [36, -49],
    ]) {
      shape(c, `M${x - 4} ${y - 5}l-7 18 8-5 2 8 6-12 3-14Z`, dark);
    }
    shape(
      c,
      "M-14-132 L-21-149 -15-161 -6-150 4-153 18-169 15-146 20-137 9-121 -6-118Z",
      dark,
    );
    shape(
      c,
      "M-15-150 L-11-144 -8-126 -2-122 4-128 2-144 -4-147 -7-139Z",
      red,
      null,
    );
    shape(c, "M6-148 L14-158 11-144 7-137 5-127 1-124Z", red, null);
    ellipse(c, -1, -139, 6, 5, "#e36b41", ink, 1.2);
    ellipse(c, -1, -139, 2.8, 3.2, "#ffd276");
    ellipse(c, -1, -139, 1.4, 2.2, dark);
    line(
      c,
      [
        [-4, -116],
        [-1, -108],
        [10, -102],
        [8, -82],
      ],
      lit,
      1,
    );
    line(
      c,
      [
        [-45, -106],
        [-43, -91],
        [-37, -78],
      ],
      lit,
      1,
    );
  }
  function hex(c, p) {
    shape(
      c,
      "M-21-93 L-31-42 -30-2 -14 3 0-2 15 4 31-1 27-43 20-96Z",
      "#602e3f",
    );
    shape(c, "M-17-88 L-21-17 -11-2 0-5 7-86Z", "#312b39", null);
    shape(c, "M6-88 L19-81 25-9 16-2 10-13Z", "#8d4350", null);
    const orbY = -117 + Math.sin(p.time * 2) * 2;
    line(
      c,
      [
        [40, -3],
        [40, -121],
      ],
      "#75594b",
      5,
    );
    line(
      c,
      [
        [39, -3],
        [39, -121],
      ],
      "#bd9b73",
      1,
    );
    shape(c, "M31-121 L30-131 38-139 48-136 52-124 46-116 35-115Z", "#9d7f59");
    ellipse(c, 41, orbY - 9, 7, 9, "#cb6777", ink, 1);
    ellipse(c, 39, orbY - 11, 2, 3, "#fbc7ba");
    bone(c, [-18, -85], [-29, -62], 6, 4.5, "#6d3547", "#442c3b");
    bone(c, [-29, -62], [-19, -52], 4.5, 3.5, "#c2a993", "#998c7a");
    fist(c, -19, -51, 0.85, "#d8cab0");
    bone(c, [18, -85], [31, -67], 6, 4.5, "#6d3547", "#442c3b");
    bone(c, [31, -67], [39, -79], 4, 3, "#bba88e", "#998c7a");
    fist(c, 39, -79, 0.85, "#d8cab0");
    shape(
      c,
      "M-19-111 Q-25-130-9-140 Q9-149 22-130 L25-105 15-91 -15-92Z",
      "#8c3e4d",
    );
    shape(
      c,
      "M-16-116 Q-11-139 5-136 L17-123 15-103 7-94 -9-97 -18-107Z",
      "#25252f",
      ink,
    );
    shape(c, "M-11-125 L8-128 13-117 9-104 2-99 -7-105 -12-115Z", "#d3ccb0");
    shape(c, "M-10-119 L-2-116 -4-111 -9-112Z", "#37343d", null);
    shape(c, "M2-116 L10-120 9-113 3-111Z", "#37343d", null);
    poly(
      c,
      [
        [-1, -111],
        [-4, -105],
        [2, -105],
      ],
      "#4d3942",
      null,
    );
    line(
      c,
      [
        [-5, -102],
        [5, -102],
      ],
      "#4d3942",
      1.1,
    );
    for (let x = -3; x < 5; x += 2)
      line(
        c,
        [
          [x, -104],
          [x, -100],
        ],
        "#4d3942",
        0.6,
      );
    line(
      c,
      [
        [-13, -94],
        [-9, -79],
        [0, -73],
        [11, -80],
        [15, -94],
      ],
      "#b6a178",
      1.2,
    );
    for (const [x, y] of [
      [-11, -84],
      [-6, -77],
      [1, -74],
      [8, -78],
      [13, -85],
    ])
      shape(c, `M${x - 2} ${y - 2}l4 0 1 5-3 2-3-3Z`, "#c8b483", ink, 0.7);
  }
  function zombozo(c, p) {
    shoe(c, -16, 0, -1, "#5b344d");
    shoe(c, 20, 0, 1, "#5b344d");
    bone(c, [-11, -47], [-15, -9], 8, 6, "#543d63", "#312b40");
    bone(c, [12, -47], [19, -9], 8, 6, "#543d63", "#312b40");
    shape(
      c,
      "M-15-94 L-27-80 Q-31-62-22-45 L-5-38 19-43 Q33-67 25-85 L12-96Z",
      "#64506d",
    );
    shape(c, "M-12-91 L2-82 13-93 18-54 5-45 -12-50Z", "#b5a776");
    shape(c, "M-11-91 L0-78 -18-80 -23-90Z", "#352c43");
    shape(c, "M11-92 L0-78 20-80 25-92Z", "#352c43");
    for (let j = 0; j < 3; j++) ellipse(c, 2, -73 + j * 10, 2, 2, "#52374b");
    bone(c, [-23, -80], [-36, -59], 7, 6, "#6c5573", "#45344f");
    bone(c, [-36, -59], [-32, -42], 6, 4, "#6c5573", "#45344f");
    fist(c, -32, -41, 1.1, "#d4d5b0");
    bone(c, [23, -81], [37, -65], 7, 6, "#6c5573", "#45344f");
    bone(c, [37, -65], [29, -47], 6, 4, "#6c5573", "#45344f");
    fist(c, 29, -46, 1.1, "#d4d5b0");
    shape(c, "M-16-124 Q0-136 18-122 L20-104 11-90 -5-90 -19-103Z", "#d4d5b1");
    shape(c, "M-17-118 L-26-121 -30-113 -25-105 -17-106Z", "#6a794e");
    shape(c, "M17-119 L27-123 31-114 26-104 18-106Z", "#6a794e");
    shape(c, "M-13-116 L-3-112 -7-105 -15-109Z", "#724664", null);
    shape(c, "M4-112 L15-117 15-110 9-105Z", "#724664", null);
    line(
      c,
      [
        [-13, -115],
        [-5, -112],
      ],
      "#27262f",
      2.2,
    );
    line(
      c,
      [
        [5, -112],
        [14, -116],
      ],
      "#27262f",
      2.2,
    );
    ellipse(c, -8, -110, 2.3, 1.4, "#f6d486");
    ellipse(c, 9, -111, 2.3, 1.4, "#f6d486");
    ellipse(c, 1, -106, 5, 4, "#a94f69", ink, 1);
    shape(
      c,
      "M-14-102 Q1-94 15-103 L10-94 0-91 -9-94Z",
      "#e1c975",
      "#633347",
      1.4,
    );
    for (let x = -8; x < 12; x += 4)
      line(
        c,
        [
          [x, -99],
          [x - 1, -95],
        ],
        "#80694d",
        0.7,
      );
  }
  function animo(c, p) {
    humanLegs(c, p, { pants: "#615942", shade: "#383d35", long: true });
    shape(
      c,
      "M-13-87 L-24-75 -26-45 -18-31 -13-39 -5-32 0-42 8-35 18-40 24-35 25-54 20-79 10-89Z",
      "#b6b49b",
    );
    shape(c, "M-8-83 L-12-50 7-46 13-80Z", "#353d38");
    shape(c, "M-15-83 L-7-71 -13-64 -16-44 -23-40 -22-73Z", "#e1d7b4", null);
    shape(c, "M13-84 L21-76 18-44 10-39 7-47 13-66 5-73Z", "#8f9987", null);
    bone(c, [-20, -74], [-30, -57], 6, 4.5, "#b7b79c", "#8b9586");
    bone(c, [-30, -57], [-26, -38], 4.5, 3.5, "#8b9b76", "#667858");
    fist(c, -26, -36, 0.85, "#a0ac84");
    bone(c, [20, -75], [30, -56], 6, 4.5, "#b7b79c", "#8b9586");
    bone(c, [30, -56], [21, -45], 4.5, 3.5, "#8b9b76", "#667858");
    fist(c, 21, -43, 0.85, "#a0ac84");
    box(c, 23, -57, 14, 12, "#6e4a3e", ink);
    ellipse(c, 30, -52, 4, 4, "#d68453", ink, 1);
    shape(c, "M-13-118 L10-123 18-109 11-91 2-84 -8-92 -16-107Z", "#a5b18b");
    shape(c, "M8-118 L16-109 10-94 2-87 -1-92 7-99Z", "#778c71", null);
    shape(
      c,
      "M-15-113 L-20-121 -16-131 -4-136 12-131 18-120 15-112Z",
      "#677568",
    );
    shape(c, "M-13-125 L-11-130 8-129 13-123Z", "#bfab87");
    line(
      c,
      [
        [-11, -127],
        [-20, -142],
        [-17, -146],
      ],
      "#667c6e",
      2,
    );
    line(
      c,
      [
        [9, -128],
        [18, -140],
        [17, -145],
      ],
      "#667c6e",
      2,
    );
    ellipse(c, -17, -146, 3, 2, "#de8b59");
    ellipse(c, 17, -145, 3, 2, "#de8b59");
    line(
      c,
      [
        [-16, -111],
        [17, -111],
      ],
      "#313c3a",
      5,
    );
    ellipse(c, -7, -111, 6, 5, "#704b43", ink, 1.3);
    ellipse(c, 8, -111, 6, 5, "#704b43", ink, 1.3);
    ellipse(c, -8, -112, 3, 2, "#efb26d");
    ellipse(c, 7, -112, 3, 2, "#efb26d");
    shape(c, "M-2-107 L-5-100 1-99Z", "#889b78", null);
    shape(c, "M-7-96 L7-98 3-91 -3-93Z", "#e7d5a6", "#4b5444", 1);
    line(
      c,
      [
        [-1, -96],
        [-1, -92],
      ],
      "#53634d",
      0.7,
    );
  }
  function four(c, p) {
    for (const s of [-1, 1]) {
      bone(
        c,
        [s * 11, -48],
        [s * (17 - p.stride * 0.2), -26],
        10,
        7,
        "#2d3539",
        "#1b252c",
      );
      bone(
        c,
        [s * (17 - p.stride * 0.2), -26],
        [s * 20, -8 + p.stride * s * 0.5],
        7,
        7,
        "#273138",
        "#171f29",
      );
      shoe(c, s * 20, -1 + p.stride * s * 0.5, s, "#303c3f");
    }
    shape(
      c,
      "M-29-103 L-38-91 -29-63 -17-43 15-43 30-67 36-91 25-105Z",
      "#e6e6d6",
    );
    shape(c, "M-12-103 L13-103 17-83 10-47 -11-47 -17-81Z", "#202c31", null);
    shape(c, "M18-100 L31-91 26-69 15-52 10-52 16-75Z", "#b5c3b6", null);
    const red = "#ba443b",
      light = "#d26449",
      dark = "#7d3234";
    for (const s of [-1, 1]) {
      const punch = (p.comboStep % 2 === 0 ? s > 0 : s < 0) ? p.punch : 0;
      const elbow = [s * (40 + punch * 8), -78 + p.stride * s * 0.2],
        hand = p.special
          ? [s * 23, -52 - p.lift * 92]
          : p.block
            ? [s * 17, -105]
            : [s * (34 + punch * 27), -57 - punch * 20];
      bone(c, [s * 28, -96], elbow, 10.5, 9, red, dark);
      ellipse(c, ...elbow, 9, 10, light, ink, 1.5);
      bone(c, elbow, hand, 9, 8, red, dark);
      fist(c, ...hand, 1.4, light);
      line(
        c,
        [
          [s * 34, -92],
          [s * 37, -81],
        ],
        "#292c31",
        5,
      );
      const le = [s * 30, -57],
        lh = p.special
          ? [s * 27, -30 - p.lift * 45]
          : p.block
            ? [s * 18, -86]
            : [s * (30 + p.punch * 9), -36 - p.punch * 10];
      bone(c, [s * 22, -75], le, 8.5, 7.5, red, dark);
      bone(c, le, lh, 7, 6.7, red, dark);
      fist(c, ...lh, 1.15, light);
    }
    shape(
      c,
      "M-14-126 L-4-133 11-128 16-117 12-106 5-100 -7-101 -15-111Z",
      light,
    );
    shape(c, "M9-126 L15-117 11-107 4-101 0-105 7-112Z", red, null);
    for (const yy of [-119, -113]) {
      shape(c, `M-11 ${yy}l7 1-1 3-5-1Z`, "#ecd68e", ink, 0.9);
      shape(c, `M4 ${yy + 1}l7-2-1 4-5 1Z`, "#ecd68e", ink, 0.9);
    }
    line(
      c,
      [
        [-6, -106],
        [6, -107],
      ],
      "#50302e",
      1.4,
    );
    badge(c, 23, -87, 6);
  }
  function heat(c, p) {
    const lava = "#e66c35",
      rock = "#463b37";
    for (const s of [-1, 1]) {
      bone(c, [s * 8, -48], [s * 13, -27], 7, 5, rock, "#282d30");
      bone(
        c,
        [s * 13, -27],
        [s * (15 + p.stride * 0.25), -7],
        5,
        4,
        rock,
        "#282d30",
      );
      shoe(c, s * (16 + p.stride * 0.25), 0, s, rock);
      line(
        c,
        [
          [s * 8, -46],
          [s * 11, -30],
          [s * 15, -8],
        ],
        lava,
        2,
      );
    }
    shape(c, "M-13-92 L-22-80 -16-61 -9-44 10-44 18-67 21-81 10-92Z", rock);
    for (const d of [
      "M-10-88 L-6-73 -13-61 -5-49",
      "M5-89 L0-74 11-63 7-46",
      "M-17-77 L-9-72",
      "M10-79 L17-74",
    ])
      shape(c, d, null, "#f29a47", 2);
    for (const s of [-1, 1]) {
      const hand = p.special
        ? [s * 33, -76 - p.lift * 25]
        : p.block
          ? [s * 15, -88]
          : p.attack
            ? [s * (24 + p.punch * 21), -73 - p.punch * 7]
            : [s * 22, -45 - p.stride * s * 0.5];
      bone(c, [s * 17, -83], [s * 28, -66], 6, 5, rock, "#2a2e32");
      bone(c, [s * 28, -66], hand, 5.5, 4, lava, "#b4452e");
      fist(c, ...hand, 0.85, "#f3b255");
      if (p.attack) {
        ellipse(
          c,
          hand[0],
          hand[1] - 2,
          7 + p.punch * 5,
          9 + p.punch * 6,
          "#ffd68588",
        );
      }
    }
    const flick = Math.sin(p.time * 11) * 2;
    shape(
      c,
      `M-13-90 Q-24-104-16-118 L-20-128 -7-120 -2-143 ${5 + flick}-126 14-133 13-119 Q25-107 11-91Z`,
      "#f2a13c",
    );
    shape(
      c,
      "M-8-94 Q-14-106-8-116 L-4-125 1-116 6-121 8-109 11-100 4-91Z",
      "#ffe2a0",
      null,
    );
    shape(c, "M-10-108 L1-115 12-107 9-94 0-87 -9-94Z", lava);
    shape(c, "M-8-103 L-1-101 -3-98 -8-99Z", "#e9f7a8", ink, 0.7);
    shape(c, "M3-101 L10-104 9-99 4-98Z", "#e9f7a8", ink, 0.7);
    line(
      c,
      [
        [-3, -93],
        [5, -94],
      ],
      "#6d3c2e",
      1,
    );
    badge(c, 0, -72, 6);
  }
  function diamond(c, p) {
    const pale = "#a3dcca",
      mid = "#6db39f",
      dark = "#326d65";
    for (const s of [-1, 1]) {
      poly(
        c,
        [
          [s * 3, -49],
          [s * 16, -47],
          [s * 21, -8 + p.stride * s * 0.5],
          [s * 8, -5 + p.stride * s * 0.5],
        ],
        mid,
      );
      poly(
        c,
        [
          [s * 8, -24],
          [s * 18, -25],
          [s * 21, -8 + p.stride * s * 0.5],
          [s * 9, -7 + p.stride * s * 0.5],
        ],
        pale,
        ink,
        1,
      );
      shoe(c, s * 15, p.stride * s * 0.5, s, mid);
    }
    shape(c, "M-19-95 L-28-79 -18-58 -12-43 13-43 22-65 28-82 15-97Z", pale);
    shape(c, "M-8-93 L3-84 14-96 14-70 9-46 -10-46 -14-69Z", "#223c3d", null);
    shape(c, "M19-90 L26-80 19-63 13-57 14-78Z", mid, null);
    for (const s of [-1, 1]) {
      const el = [s * 31, -70],
        hand = p.special
          ? [s * 36, -80 - p.lift * 10]
          : p.attack
            ? [s * (34 + p.punch * 19), -59 - p.punch * 20]
            : p.block
              ? [s * 17, -88]
              : [s * 28, -43];
      bone(c, [s * 22, -87], el, 8, 7, pale, mid);
      poly(
        c,
        [
          [s * 20, -94],
          [s * 27, -112],
          [s * 39, -90],
          [s * 31, -79],
        ],
        pale,
      );
      bone(c, el, hand, 7.5, 5.5, pale, mid);
      fist(c, ...hand, 0.9, pale);
      line(
        c,
        [
          [s * 26, -83],
          [s * 30, -71],
        ],
        "#d7f2d8",
        1,
      );
    }
    shape(c, "M-13-123 L-1-140 14-128 17-110 7-98 -6-99 -15-111Z", pale);
    shape(c, "M0-139 L14-127 16-110 7-99 1-103 4-118Z", mid, null);
    shape(c, "M-11-118 L-2-115 -5-110 -10-112Z", "#e4f3a4", ink, 1);
    shape(c, "M4-115 L13-120 12-113 5-110Z", "#e4f3a4", ink, 1);
    line(
      c,
      [
        [-4, -104],
        [7, -105],
      ],
      dark,
      1.2,
    );
    badge(c, 15, -79, 6);
  }
  function knight(c, p, type) {
    const king = type === "king" || type === "Driscoll",
      heavy = type === "heavy" || type === "executor",
      commander = type === "commander" || type === "Comandante";
    const metal = king ? "#404a55" : heavy ? "#697277" : "#78918d",
      light = king ? "#7b858b" : "#afbeb2",
      shade = king ? "#242e3b" : "#425b59",
      trim = king ? "#b5a06d" : "#b5bba0";
    if (king || commander)
      shape(
        c,
        "M-20-103 L19-103 30-25 26 3 10-8 0-1 -13-8 -28 2 -29-23Z",
        king ? "#5b303f" : "#70463f",
      );
    for (const s of [-1, 1]) {
      bone(c, [s * 10, -52], [s * 16, -29], 9, 7, shade, "#263b3e");
      shape(
        c,
        `M${s * 16 - 7}-34 L${s * 16 + 7}-34 ${s * 16 + 8}-8 ${s * 16 - 8}-6Z`,
        metal,
      );
      line(
        c,
        [
          [s * 16 - 5, -30],
          [s * 16 + 5, -30],
        ],
        light,
        1,
      );
      shoe(c, s * (18 + p.stride * 0.2), 0, s, shade);
    }
    shape(c, "M-21-102 L-29-88 -23-65 -14-47 15-47 24-65 29-89 18-103Z", metal);
    shape(c, "M3-96 L20-94 22-71 13-51 4-52 10-71Z", shade, null);
    shape(c, "M-17-95 L0-87 18-95 14-72 0-64 -13-73Z", shade);
    line(
      c,
      [
        [-16, -95],
        [0, -87],
        [17, -95],
      ],
      light,
      2,
    );
    shape(c, "M-13-63 L13-63 15-53 -14-53Z", shade);
    box(c, -4, -62, 8, 8, trim, ink);
    for (const s of [-1, 1]) {
      const el = [s * 32, -75],
        hand = [s * (27 + p.punch * 26), -50 - p.punch * 25];
      bone(c, [s * 24, -92], el, 8, 6, shade, "#26333d");
      bone(c, el, hand, 7.5, 5.5, metal, shade);
      fist(c, ...hand, 1, metal);
      poly(
        c,
        [
          [s * 15, -99],
          [s * 28, -107],
          [s * 39, -92],
          [s * 32, -82],
          [s * 19, -87],
        ],
        metal,
      );
      line(
        c,
        [
          [s * 25, -100],
          [s * 34, -92],
        ],
        light,
        1.2,
      );
    }
    if (type === "shield" || type === "executor") {
      shape(c, "M-32-83 L-51-75 -49-48 -32-33 -17-49 -17-75Z", "#395653");
      shape(c, "M-32-76 L-44-70 -43-53 -32-42 -24-53 -24-71Z", trim);
      shape(c, "M-32-70 L-32-47", null, shade, 2);
    }
    const wx = 29 + p.punch * 24,
      wy = -52 - p.punch * 20;
    if (type === "energy") {
      poly(
        c,
        [
          [wx - 6, wy + 4],
          [wx - 5, wy - 25],
          [wx + 4, wy - 39],
          [wx + 12, wy - 24],
          [wx + 10, wy + 4],
        ],
        "#3e555b",
      );
      ellipse(c, wx + 3, wy - 23, 5, 9, "#a389c3", ink, 1);
      line(
        c,
        [
          [wx + 1, wy - 29],
          [wx + 1, wy - 16],
        ],
        "#ead3eb",
        1.5,
      );
    } else if (heavy) {
      line(
        c,
        [
          [wx, wy + 5],
          [wx + 13, wy - 52],
        ],
        "#5c554b",
        4,
      );
      shape(c, `M${wx}-63 L${wx + 29}-56 ${wx + 26}-39 ${wx - 5}-46Z`, metal);
    } else {
      poly(
        c,
        [
          [wx - 2, wy - 4],
          [wx + 4, wy - 4],
          [wx + 13, wy - 55],
          [wx + 7, wy - 65],
        ],
        "#c1d6cf",
      );
      line(
        c,
        [
          [wx - 8, wy - 6],
          [wx + 11, wy - 2],
        ],
        trim,
        3,
      );
      line(
        c,
        [
          [wx + 2, wy - 8],
          [wx + 9, wy - 53],
        ],
        "#f2efcc",
        1,
      );
    }
    shape(c, "M-14-124 L0-132 15-124 17-109 8-99 -9-99 -17-110Z", metal);
    shape(c, "M3-128 L14-123 15-110 7-101 1-102Z", shade, null);
    shape(
      c,
      "M-13-117 L-3-114 0-117 4-114 14-119 11-111 0-108 -12-111Z",
      king ? "#c75b51" : "#e3c28e",
      ink,
      1,
    );
    shape(c, "M-3-110 L0-101 3-110Z", shade, ink, 0.8);
    line(
      c,
      [
        [-14, -123],
        [0, -131],
        [14, -124],
      ],
      light,
      1.3,
    );
    if (king) {
      shape(
        c,
        "M-17-124 L-23-141 -9-134 0-143 10-134 24-141 17-124 0-129Z",
        trim,
      );
      shape(c, "M-5-90 L0-95 6-90 4-79 -3-79Z", "#ab775a");
    }
    if (commander)
      shape(c, "M-2-132 Q-12-151 8-150 L14-142 3-143 4-132Z", "#a94d43");
    if (p.variant === "crystal") {
      for (const s of [-1, 1]) {
        poly(
          c,
          [
            [s * 14, -102],
            [s * 27, -125],
            [s * 45, -100],
            [s * 35, -77],
            [s * 23, -83],
          ],
          "#8bcbb9",
          ink,
          1.5,
        );
        poly(
          c,
          [
            [s * 27, -123],
            [s * 32, -98],
            [s * 44, -100],
          ],
          "#c1eddb",
          null,
        );
        poly(
          c,
          [
            [s * 12, -82],
            [s * 27, -91],
            [s * 24, -56],
            [s * 10, -48],
          ],
          "#6ea995",
          ink,
          1.1,
        );
        line(
          c,
          [
            [s * 24, -86],
            [s * 19, -63],
          ],
          "#b5e5ca",
          1,
        );
      }
      shape(c, "M-10-101 L1-112 14-100 8-82 -4-81Z", "#b4e4d0");
      shape(c, "M1-111 L2-85 8-82 14-100Z", "#6eac99", null);
    }
  }
  function lockedAlien(c, p, id) {
    // Only locked selection silhouettes; no unimplemented combat is advertised.
    const color = B.form(id).color;
    if (id === "ghost") {
      shape(
        c,
        "M-12-89 Q-25-66-16-28 L-26-4 -8-11 4-2 8-15 26-6 17-35 Q30-63 15-88Z",
        color,
      );
      line(
        c,
        [
          [0, -83],
          [-6, -58],
          [3, -32],
        ],
        "#34434d",
        3,
      );
      ellipse(c, 7, -72, 4, 3, "#bba5c9");
    } else if (id === "cannon") {
      ellipse(c, 0, -42, 32, 41, color, ink, 1.5);
      ellipse(c, 0, -66, 16, 15, "#ddd8bd", ink, 1.2);
      for (const s of [-1, 1]) {
        ellipse(c, s * 25, -40, 13, 24, "#c1a163", ink, 1.5);
        shoe(c, s * 18, 0, s, color);
      }
      badge(c, 0, -45, 6);
    } else if (id === "upgrade") {
      shape(
        c,
        "M-13-100 L5-112 18-95 17-68 33-45 25-19 16-32 9-6 0-13 -13-3 -15-34 -31-15 -34-34 -20-69Z",
        "#162b2d",
      );
      line(
        c,
        [
          [0, -103],
          [0, -77],
          [-12, -63],
          [-20, -36],
        ],
        color,
        3,
      );
      line(
        c,
        [
          [0, -77],
          [14, -61],
          [21, -29],
        ],
        color,
        3,
      );
      ellipse(c, 0, -92, 5, 4, color);
    } else if (id === "xlr8") {
      shape(
        c,
        "M-12-87 L-14-107 0-122 22-106 12-89 14-55 22-14 6-12 0-48 -9-13 -23-11 -12-57Z",
        color,
      );
      shape(c, "M-10-105 L18-104 6-95Z", "#233948");
      for (const s of [-1, 1]) {
        bone(c, [s * 9, -82], [s * 25, -49], 5, 3, color, "#2c768c");
        ellipse(c, s * 15, -5, 9, 6, "#263b45");
      }
      line(
        c,
        [
          [0, -43],
          [-23, -25],
          [-38, -49],
        ],
        color,
        5,
      );
    } else if (id === "blitz") {
      shape(
        c,
        "M-20-82 L-10-104 -17-123 -2-114 13-122 14-100 23-78 13-39 -14-39Z",
        color,
      );
      for (const s of [-1, 1]) {
        bone(c, [s * 14, -79], [s * 33, -47], 8, 5, color, "#7b7184");
        bone(c, [s * 8, -41], [s * 15, -6], 8, 5, "#434653", "#343546");
        shoe(c, s * 16, 0, s, color);
      }
      shape(c, "M-11-97 L11-97 8-89 -7-89Z", "#39434b");
    } else if (id === "vine") {
      shape(c, "M-15-83 L0-108 17-82 8-36 -8-36Z", color);
      for (const s of [-1, 1]) {
        bone(c, [s * 9, -76], [s * 34, -43], 5, 3, color, "#3e724d");
        bone(c, [s * 6, -38], [s * 14, -3], 5, 3, color, "#3e724d");
        poly(
          c,
          [
            [s * 8, -86],
            [s * 29, -99],
            [s * 21, -65],
          ],
          "#4d8652",
        );
      }
      ellipse(c, 0, -86, 7, 5, "#d9dd91");
    } else {
      shape(c, "M-13-95 L0-108 13-95 13-36 -12-36Z", color);
      for (const s of [-1, 1]) {
        bone(c, [s * 11, -80], [s * 27, -42], 5, 4, color, "#9f927a");
        bone(c, [s * 6, -37], [s * 12, -4], 6, 4, color, "#9f927a");
      }
      for (let y = -96; y < -38; y += 7)
        line(
          c,
          [
            [-11, y],
            [11, y - 4],
          ],
          "#80765f",
          1,
        );
      line(
        c,
        [
          [-10, -89],
          [10, -89],
        ],
        "#263c3e",
        5,
      );
    }
  }
  const designs = {
    ben: { draw: ben, height: 117, width: 54, head: { y: -94, width: 34 } },
    Kevin: {
      draw: kevin,
      height: 126,
      width: 53,
      head: { y: -106, width: 40 },
    },
    Gwen: { draw: gwen, height: 117, width: 48, head: { y: -97, width: 42 } },
    Max: { draw: max, height: 127, width: 68, head: { y: -105, width: 44 } },
    Vilgax: {
      draw: vilgax,
      height: 165,
      width: 116,
      head: { y: -135, width: 58 },
    },
    Malware: {
      draw: malware,
      height: 170,
      width: 104,
      head: { y: -143, width: 52 },
    },
    Hex: { draw: hex, height: 147, width: 94, head: { y: -119, width: 49 } },
    Zombozo: {
      draw: zombozo,
      height: 136,
      width: 85,
      head: { y: -111, width: 64 },
    },
    "Dr. Ánimo": {
      draw: animo,
      height: 148,
      width: 72,
      head: { y: -112, width: 45 },
    },
    heat: { draw: heat, height: 143, width: 65, head: { y: -114, width: 44 } },
    four: { draw: four, height: 134, width: 110, head: { y: -117, width: 42 } },
    diamond: {
      draw: diamond,
      height: 140,
      width: 90,
      head: { y: -119, width: 40 },
    },
    Driscoll: { height: 143, width: 90, head: { y: -117, width: 48 } },
  };
  B.characterDesigns = designs;
  B.actorVariant = (id, opts = {}) => {
    if (id !== "king" && id !== "Driscoll") return "original";
    if (opts.scene === "intro") return "eternal";
    return opts.armor > 0 ? "crystal" : "eternal";
  };
  function getDesign(id) {
    return (
      designs[id] ||
      (B.enemyTypes[id] || ["Comandante", "Ejecutor"].includes(id)
        ? { height: 143, width: 90, head: { y: -116, width: 42 } }
        : { height: 122, width: 64, head: { y: -94, width: 40 } })
    );
  }
  function paint(c, id, p) {
    if (designs[id]?.draw) designs[id].draw(c, p);
    else if (B.forms.some((f) => f.id === id)) lockedAlien(c, p, id);
    else
      knight(
        c,
        p,
        id === "Ejecutor" ? "executor" : id === "Comandante" ? "commander" : id,
      );
  }
  function pose(opts) {
    const a = opts.attack || opts.special,
      progress = a ? B.clamp(1 - a.time / a.total, 0, 1) : 0;
    return {
      time: opts.time || 0,
      stride: opts.walk ? Math.sin(opts.walk) * 5 : 0,
      attack: !!a,
      special: !!opts.special,
      comboStep: opts.attack?.pattern?.length || 0,
      punch: a ? Math.sin(progress * Math.PI) : 0,
      lift:
        progress < 0.4
          ? Math.sin(((progress / 0.4) * Math.PI) / 2)
          : Math.max(0, 1 - (progress - 0.4) / 0.3),
      block: !!opts.blocking,
      pose: opts.pose,
      expression: opts.expression || "DECIDIDO",
      variant: opts.variant,
    };
  }
  B.drawActor = (c, id, x, y, scale = 1, opts = {}) => {
    const d = getDesign(id),
      p = pose(opts);
    if (!opts.expression)
      p.expression =
        { Max: "TRANQUILO", Gwen: "ATENTA", Kevin: "FURIOSO" }[id] ||
        p.expression;
    p.variant = B.actorVariant(id, opts);
    c.save();
    c.translate(x, y);
    c.scale(scale * 0.82, scale * 0.82);
    if (opts.shadow !== false) {
      ellipse(c, 2, 4, d.width * 0.35, 9, "#07121b66");
      ellipse(c, 2, 3, d.width * 0.22, 5, "#09131c44");
    }
    if (opts.facing !== undefined && Math.cos(opts.facing) < -0.25)
      c.scale(-1, 1);
    if (opts.invuln && Math.floor(p.time * 16) % 2 === 0) c.globalAlpha *= 0.62;
    c.translate(
      0,
      opts.walk
        ? -Math.abs(Math.sin(opts.walk)) * 1.4
        : Math.sin(p.time * 2) * 0.3,
    );
    c.rotate(
      opts.dodging
        ? -0.18
        : p.attack
          ? p.punch * 0.05
          : opts.walk
            ? Math.sin(opts.walk) * 0.012
            : 0,
    );
    if (opts.flash > 0) c.filter = "brightness(1.7)";
    paint(c, id, p);
    c.restore();
  };
  B.drawCharacterPortrait = (canvas, id, opts = {}) => {
    const c = canvas.getContext("2d"),
      d = getDesign(id),
      head = d.head,
      s = (canvas.width * 0.71) / head.width,
      p = pose(opts);
    p.variant = B.actorVariant(id, opts);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.save();
    c.translate(canvas.width * 0.5, canvas.height * 0.46 - head.y * s);
    c.scale(s, s);
    paint(c, id, p);
    c.restore();
  };
})(window.B10);
