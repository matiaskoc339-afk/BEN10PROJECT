"use strict";
(function (B) {
  // Stage acting is tied to story actions, not to advancing the dialogue clock.
  B.cineShot = (g) => {
    const t = g.world.time,
      d = g.ui.dialogue;
    const index = d?.index || 0,
      who = d?.scene.lines[index]?.who;
    const pairs = [
      ["Vilgax", "Malware"],
      ["Vilgax", "Malware"],
      ["Vilgax", "Malware"],
      ["Vilgax", "Malware"],
      ["Kevin", "Driscoll"],
      ["Zombozo", "Kevin"],
      ["Hex", "Dr. Ánimo"],
      ["Dr. Ánimo", "Hex"],
      ["Driscoll", "Kevin"],
    ];
    const cast = g.cine.brawl
      ? ["Vilgax", "Kevin", "Malware", "Zombozo"]
      : pairs[Math.min(index, pairs.length - 1)];
    const slots = g.cine.brawl
      ? [
          [1010, 550],
          [850, 600],
          [1175, 635],
          [980, 645],
        ]
      : [
          [1030, 600],
          [360, 635],
        ];
    const actors = cast.map((id, n) => {
      const [x, y] = slots[n],
        speaking = who === id;
      const beat = Math.floor(t * (g.cine.brawl ? 7 : 5) + n * 2);
      const pose =
        g.cine.fractured && t - g.cine.fractureAt < 0.6
          ? 5
          : g.cine.brawl
            ? [3, 4, 5, 0][beat % 4]
            : speaking
              ? [1, 2, 1, 0][beat % 4]
              : [0, 0, 0, 1, 0, 0][Math.floor(t * 2 + n) % 6];
      const drive = g.cine.brawl
        ? Math.sin(t * 5 + n * 2) * 24
        : speaking
          ? Math.sin(t * 2) * 2
          : 0;
      return {
        id,
        x: x + drive,
        y,
        pose,
        facing: x > 695 ? Math.PI : 0,
        speaking,
      };
    });
    const elapsed = t - (g.cine.escapeAt ?? t);
    const ben = {
      x: g.cine.escaped ? 695 - B.clamp(elapsed / 2.2, 0, 1) * 880 : 695,
      y: 650,
      facing: g.cine.escaped ? Math.PI : 0,
      moving: !!g.cine.escaped,
      walk: (elapsed * 400) / 18,
    };
    if (g.cine.escaped && elapsed < 0.3)
      ben.pose = (Math.floor(t * 12) % 2) + 4;
    else if (!g.cine.escaped && !g.cine.fractured)
      ben.pose = Math.floor(t * (g.cine.extract ? 7 : 3)) % 2;
    else if (!g.cine.escaped && t - g.cine.fractureAt < 0.75)
      ben.pose = t - g.cine.fractureAt < 0.3 ? 2 : 3;
    return { actors, ben, who };
  };
})(window.B10);
