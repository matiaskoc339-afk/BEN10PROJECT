const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
global.window = global;
for (const file of [
  "data",
  "actors",
  "world",
  "combat",
  "scenery",
  "world-life",
])
  vm.runInThisContext(
    fs.readFileSync(path.join(__dirname, "../js", file + ".js"), "utf8"),
    { filename: file + ".js" },
  );
const B = global.B10;
function fixture(zone = "city") {
  const g = {
    save: B.fresh(),
    player: B.makePlayer(),
    clock: 0,
    mode: "play",
    view: { w: 1400, h: 900 },
    camera: { x: 700, y: 550, zoom: 1 },
    shake: 0,
    hitstop: 0,
    particles: [],
    texts: [],
    settings: { difficulty: "normal" },
    keys: new Set(),
  };
  g.world = B.createWorld(zone, g.save);
  g.ui = {
    toast() {},
    refreshFavorites() {},
    hint() {},
    scene(id, done) {
      if (done) done();
    },
  };
  g.audio = { play() {} };
  g.has = (id, index) => g.save.skills[id]?.includes(index) || false;
  g.persist = () => {};
  g.addXP = (n) => {
    g.save.xp += n;
  };
  g.burst = () => {};
  g.floatText = () => {};
  g.field = (x, y, r, life, kind, damage) =>
    g.world.fields.push({ x, y, r, life, kind, damage, tick: 0 });
  g.shoot = (x, y, angle, speed, damage, kind, team, r, life) =>
    g.world.shots.push({
      x,
      y,
      angle,
      speed,
      damage,
      kind,
      team,
      r,
      life,
      touched: new Set(),
    });
  g.keyLabel = (k) => k;
  g.input = { held: (k) => g.keys.has(k), mouse: { x: 900, y: 450 } };
  g.screenToWorld = (x, y) => ({ x, y });
  g.defeat = () => {
    g.mode = "dead";
  };
  return g;
}
test("exactly ten alien profiles, two initially unlocked and no Master Control", () => {
  const g = fixture();
  assert.equal(B.forms.length, 10);
  assert.deepEqual(g.save.unlocked, ["heat", "four"]);
  assert.ok(!g.save.flags.master);
  assert.equal(B.transform(g, "diamond"), false);
  assert.equal(g.player.form, "ben");
});
test("transformations share health, cancellation preserves energy, change is queued", () => {
  const g = fixture();
  g.player.hp = 57;
  g.player.energy = 40;
  assert.ok(B.transform(g, "four"));
  assert.equal(g.player.hp, 57);
  B.transform(g, "heat");
  assert.equal(g.player.form, "four");
  assert.equal(g.player.queued, "heat");
  B.revert(g);
  assert.equal(g.player.energy, 40);
  assert.equal(g.player.hp, 57);
  assert.ok(B.transform(g, "heat"));
});
test("exhaustion reverts, locks, and eventually recovers without puzzle softlock", () => {
  const g = fixture();
  B.transform(g, "heat");
  g.player.energy = 0.01;
  B.updatePlayer(g, 0.1);
  assert.equal(g.player.form, "ben");
  assert.ok(g.player.locked);
  assert.equal(B.transform(g, "four"), false);
  for (let i = 0; i < 40; i++) B.updatePlayer(g, 0.1);
  assert.equal(g.player.locked, false);
  assert.ok(B.transform(g, "four"));
});
test("axis collisions stop movement into buildings and allow sliding", () => {
  const g = fixture();
  g.player.x = 300;
  g.player.y = 370;
  B.move(g, g.player, 0, -100);
  assert.equal(g.player.y, 370);
  B.move(g, g.player, 50, 0);
  assert.ok(Math.abs(g.player.x - 350) < 0.00001);
});
test("light and heavy attacks damage enemies and mixed combo has a finisher", () => {
  const g = fixture();
  g.world.enemies = [B.makeEnemy("heavy", 390, 550, "test")];
  g.player.x = 300;
  g.player.y = 550;
  g.player.form = "four";
  g.player.facing = 0;
  B.attack(g, "J");
  B.advanceAttack(g, 0.14);
  g.player.attackCD = 0;
  B.attack(g, "J");
  B.advanceAttack(g, 0.14);
  g.player.attackCD = 0;
  B.attack(g, "K");
  B.advanceAttack(g, 0.14);
  assert.ok(g.world.enemies[0].hp < 50);
  assert.equal(g.player.attack.finisher, true);
  assert.equal(g.player.attack.pattern, "JJK");
});
test("a shield blocks frontal light attacks but heavy attacks break its guard", () => {
  const g = fixture();
  const e = B.makeEnemy("shield", 400, 550, "shield");
  g.player.x = 300;
  g.player.y = 550;
  e.facing = Math.PI;
  B.hitEnemy(g, e, 20, { power: "four", heavy: false });
  assert.equal(e.hp, 96);
  B.hitEnemy(g, e, 40, { power: "four", heavy: true });
  assert.equal(e.hp, 56);
  assert.ok(e.stun >= 0.8);
});
test("dodge cancels recovery and protects from damage", () => {
  const g = fixture();
  g.player.attack = {};
  g.player.attackCD = 0.5;
  B.dodge(g);
  assert.equal(g.player.attack, null);
  const hp = g.player.hp;
  B.hurtPlayer(g, 50, { x: 310, y: 550 });
  assert.equal(g.player.hp, hp);
});
test("perfect block parries; purchased Revancha causes a real counterattack", () => {
  const g = fixture();
  g.player.form = "four";
  g.save.skills.four = [1];
  g.player.blocking = true;
  g.player.blockTime = 0.1;
  g.player.facing = 0;
  const e = B.makeEnemy("basic", 330, 550, "parry");
  B.hurtPlayer(g, 20, e);
  assert.equal(g.player.hp, 120);
  assert.ok(e.stun >= 1);
  assert.ok(e.hp < 68);
});
test("two attack tokens limit coordinated enemy windups", () => {
  const g = fixture();
  g.world.obstacles = [];
  g.player.x = 700;
  g.player.y = 550;
  g.world.enemies = Array.from({ length: 5 }, (_, i) => {
    const e = B.makeEnemy("basic", 730 + i, 550, "token" + i);
    e.cd = 0;
    return e;
  });
  B.updateEnemies(g, 0.01);
  assert.equal(g.world.enemies.filter((e) => e.state === "windup").length, 2);
});
test("ranged enemy maintains distance and launches a projectile after a telegraph", () => {
  const g = fixture();
  g.world.obstacles = [];
  g.player.x = 500;
  g.player.y = 500;
  const e = B.makeEnemy("energy", 750, 500, "ranged");
  g.world.enemies = [e];
  e.cd = 0;
  B.updateEnemies(g, 0.01);
  assert.equal(e.state, "windup");
  B.updateEnemies(g, 0.8);
  assert.equal(g.world.shots.length, 1);
  assert.equal(g.world.shots[0].team, "enemy");
});
test("gate requires heating then a sustained lift; energy exhaustion cannot reset heat", () => {
  const g = fixture();
  const gate = g.world.objects.find((o) => o.type === "gate");
  g.player.x = 1530;
  g.player.y = 550;
  g.player.form = "four";
  g.keys.add("interact");
  B.updateWorld(g, 2);
  assert.equal(gate.progress, 0);
  for (let i = 0; i < 4; i++) B.applyPuzzle(g, gate.x, gate.y, 3, "heat");
  assert.equal(gate.heat, 100);
  B.revert(g, true);
  assert.equal(gate.heat, 100);
  g.player.locked = false;
  g.player.energy = 80;
  B.transform(g, "four");
  B.updateWorld(g, 1);
  assert.ok(gate.progress > 0 && gate.progress < 1);
  B.updateWorld(g, 1);
  assert.equal(gate.progress, 1);
  assert.ok(g.world.obstacles.find((o) => o.id === "gate").open);
});
test("fortress supports resist raw force, then break after heat and two heavy strikes", () => {
  const g = fixture("fort");
  const supports = g.world.objects.filter((o) => o.type === "support");
  for (const o of supports) {
    B.applyPuzzle(g, o.x, o.y, 3, "four", true);
    assert.equal(o.progress, 0);
    B.applyPuzzle(g, o.x, o.y, 3, "heat", true);
    B.applyPuzzle(g, o.x, o.y, 3, "heat", true);
    B.applyPuzzle(g, o.x, o.y, 3, "four", true);
    assert.equal(o.broken, false);
    B.applyPuzzle(g, o.x, o.y, 3, "four", true);
    assert.ok(o.broken);
  }
  assert.ok(g.save.flags.supports);
  assert.ok(g.world.obstacles.find((o) => o.id === "supports").open);
});
test("king requires two thermal fractures, then changes to sword and retreat phases", () => {
  const g = fixture("throne");
  const e = g.world.enemies[0];
  g.player.x = 1100;
  g.player.y = 550;
  const hp = e.hp;
  B.hitEnemy(g, e, 100, { power: "four", heavy: true });
  assert.ok(e.hp > hp - 5);
  for (let plate = 0; plate < 2; plate++) {
    for (let j = 0; j < 5; j++) B.hitEnemy(g, e, 18, { power: "heat" });
    assert.equal(e.heat, 100);
    B.hitEnemy(g, e, 53, { power: "four", heavy: true });
    B.hitEnemy(g, e, 53, { power: "four", heavy: true });
  }
  assert.equal(e.phase, 2);
  assert.equal(e.armor, 0);
  B.hitEnemy(g, e, e.hp - 300, { power: "four", heavy: true });
  e.stun = 0;
  B.updateEnemies(g, 0.01);
  assert.equal(e.phase, 3);
  assert.ok(g.world.enemies.filter((a) => a !== e && !a.dead).length <= 2);
  B.hitEnemy(g, e, 400, { power: "heat", heavy: true });
  assert.ok(e.dead);
  assert.ok(g.save.flags.king);
});
test("the first armor plate cannot be bypassed by killing the king during exposure", () => {
  const g = fixture("throne"),
    e = g.world.enemies[0];
  e.vulnerable = 5;
  B.hitEnemy(g, e, 5000, { power: "four" });
  assert.equal(e.hp, 720);
  assert.equal(e.dead, false);
});
test("executor has a genuine second behavior phase and can be defeated", () => {
  const g = fixture("market");
  const e = g.world.enemies.find((e) => e.type === "executor");
  g.player.x = e.x - 100;
  g.player.y = e.y;
  B.hitEnemy(g, e, 300, { heavy: true });
  e.stun = 0;
  B.updateEnemies(g, 0.01);
  assert.equal(e.phase, 2);
  assert.equal(e.speed, 125);
  B.hitEnemy(g, e, 400, { heavy: true });
  assert.ok(e.dead);
  assert.ok(g.save.flags.executor);
});
test("escape mechanisms only respond to Diamante and build a usable bridge", () => {
  const g = fixture("escape");
  const bridge = g.world.objects.find((o) => o.type === "bridge");
  B.applyPuzzle(g, bridge.x, bridge.y, 2, "four", true);
  assert.equal(bridge.progress, 0);
  for (let i = 0; i < 3; i++)
    B.applyPuzzle(g, bridge.x, bridge.y, 2, "diamond");
  assert.equal(bridge.progress, 1);
  assert.ok(g.world.obstacles.find((o) => o.id === "bridge").open);
});
test("permanent upgrades are collected only once and alter maximum capacity", () => {
  const g = fixture("market");
  g.player.x = 1150;
  g.player.y = 245;
  B.interact(g);
  assert.equal(g.player.maxHp, 145);
  B.interact(g);
  assert.equal(g.player.maxHp, 145);
  assert.deepEqual(g.save.items, ["hp-shop"]);
});
test("purchased fire combustion creates splash damage; unpurchased shots do not", () => {
  function run(learn) {
    const g = fixture();
    g.world.obstacles = [];
    g.world.objects = [];
    g.save.skills.heat = learn ? [0] : [];
    g.world.enemies = [
      B.makeEnemy("basic", 330, 550, "a"),
      B.makeEnemy("basic", 350, 595, "b"),
    ];
    g.shoot(300, 550, 0, 500, 18, "fire", "player", 11, 1);
    B.updateEffects(g, 0.05);
    return g.world.enemies[1].hp;
  }
  assert.equal(run(false), 68);
  assert.ok(run(true) < 68);
});

test("revisiting zones works after the chapter: west returns and the empty throne has an exit", () => {
  const g = fixture("market");
  g.save.flags.gate = true;
  g.save.flags.king = true;
  g.player.x = 80;
  g.player.y = 550;
  B.updateWorld(g, 0.01);
  assert.equal(g.world.zone, "city");
  assert.equal(g.player.x, g.world.exit.x - 80);
  const throne = B.createWorld("throne", g.save);
  assert.equal(throne.enemies.length, 0);
  assert.ok(throne.exit);
});

test("a constructed bridge leaves the rest of the chasm impassable", () => {
  const g = fixture("escape");
  const bridge = g.world.objects.find((o) => o.type === "bridge");
  for (let i = 0; i < 3; i++)
    B.applyPuzzle(g, bridge.x, bridge.y, 3, "diamond");
  g.player.x = 680;
  g.player.y = 300;
  B.move(g, g.player, 80, 0);
  assert.ok(g.player.x <= 710 - g.player.r);
  g.player.x = 680;
  g.player.y = 550;
  B.move(g, g.player, 80, 0);
  assert.equal(g.player.x, 760);
});

test("special action animation expires and cannot leak into the next transformation", () => {
  const g = fixture();
  B.transform(g, "four");
  B.special(g);
  assert.equal(g.player.specialPose.total, 0.65);
  B.updatePlayer(g, 0.2);
  assert.ok(g.player.specialPose.time > 0);
  B.updatePlayer(g, 0.6);
  assert.equal(g.player.specialPose, null);
  g.player.specialCD = 0;
  B.special(g);
  B.revert(g);
  assert.equal(g.player.specialPose, null);
  B.transform(g, "heat");
  assert.equal(g.player.specialPose, null);
});

test("damage is applied once at contact, using the direction captured at attack start", () => {
  const g = fixture();
  g.player.form = "four";
  g.player.x = 300;
  g.player.y = 550;
  g.player.facing = 0;
  const enemy = B.makeEnemy("heavy", 390, 550, "timing");
  g.world.enemies = [enemy];
  B.attack(g, "K");
  assert.equal(enemy.hp, 155);
  B.advanceAttack(g, 0.1);
  assert.equal(enemy.hp, 155);
  g.player.facing = Math.PI;
  B.advanceAttack(g, 0.04);
  assert.equal(enemy.hp, 102);
  B.advanceAttack(g, 0.15);
  assert.equal(enemy.hp, 102);
});
test("dodge cancels the pending contact instead of dealing invisible damage", () => {
  const g = fixture();
  g.player.form = "four";
  g.player.x = 300;
  g.player.y = 550;
  g.player.facing = 0;
  const enemy = B.makeEnemy("heavy", 390, 550, "cancel");
  g.world.enemies = [enemy];
  B.attack(g, "K");
  B.dodge(g);
  B.advanceAttack(g, 0.5);
  assert.equal(enemy.hp, 155);
});
test("walk animation stops against a wall and advances with actual displacement", () => {
  const g = fixture();
  g.world.obstacles = [{ x: 340, y: 0, w: 40, h: 1000 }];
  g.player.x = 320;
  g.player.y = 550;
  g.player.walk = 6;
  g.keys.add("right");
  B.updatePlayer(g, 1 / 60);
  assert.equal(g.player.moving, false);
  assert.equal(g.player.walk, 6);
  g.world.obstacles = [];
  B.updatePlayer(g, 1 / 60);
  assert.ok(g.player.moving);
  assert.ok(g.player.walk > 6);
});
test("the expanded town connects north streets, southern paths and garden before the main gate", () => {
  const g = fixture(),
    w = g.world,
    step = 32,
    cols = Math.ceil(w.w / step),
    rows = Math.ceil(w.h / step);
  assert.ok(w.w >= 2600 && w.h >= 1900);
  const free = (x, y) =>
    x >= 19 &&
    y >= 19 &&
    x < w.w - 19 &&
    y < w.h - 19 &&
    !w.obstacles.some((o) => !o.open && B.circleRect(x, y, 19, o));
  const sx = Math.round(280 / step),
    sy = Math.round(570 / step),
    queue = [[sx, sy]],
    visited = new Set([sy * cols + sx]);
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        key = ny * cols + nx;
      if (
        nx < 0 ||
        ny < 0 ||
        nx >= cols ||
        ny >= rows ||
        visited.has(key) ||
        !free(nx * step, ny * step) ||
        !free(((x + nx) * step) / 2, ((y + ny) * step) / 2)
      )
        continue;
      visited.add(key);
      queue.push([nx, ny]);
    }
  }
  for (const [x, y] of [
    [480, 32],
    [500, 1700],
    [1300, 1450],
    [1500, 550],
  ])
    assert.ok(
      visited.has(Math.round(y / step) * cols + Math.round(x / step)),
      `reachable ${x},${y}`,
    );
});

test("melee weight transfer is gradual and never lunges through a wall", () => {
  const g = fixture();
  g.player.x = 320;
  g.player.y = 550;
  g.player.form = "four";
  g.player.facing = 0;
  g.world.obstacles = [{ x: 342, y: 0, w: 35, h: 1000 }];
  g.world.enemies = [];
  B.attack(g, "K");
  const x = g.player.x;
  B.advanceAttack(g, 0.12);
  assert.equal(g.player.x, x);
  B.advanceAttack(g, 0.02);
  assert.ok(g.player.x - x < 4);
  B.advanceAttack(g, 0.09);
  assert.ok(g.player.x + g.player.r <= 342);
});
test("an enemy recoils over multiple updates instead of teleporting at the hit", () => {
  const g = fixture();
  const e = B.makeEnemy("basic", 500, 550, "recoil");
  g.world.enemies = [e];
  B.hitEnemy(g, e, 10, { power: "four", angle: 0, knock: 85 });
  assert.equal(e.x, 500);
  assert.ok(e.knockVX > 0);
  B.updateEnemies(g, 1 / 60);
  assert.ok(e.x > 500 && e.x < 515);
  const speed = e.knockVX;
  B.updateEnemies(g, 1 / 60);
  assert.ok(e.knockVX < speed);
});
test("foot contacts appear only on a moving stride and expire without touching save data", () => {
  const g = fixture();
  const life = new B.WorldLife(),
    save = JSON.stringify(g.save);
  life.update(g, 0.01);
  assert.equal(life.state(g.world).steps.length, 0);
  g.player.moving = true;
  g.player.moveFacing = 0;
  g.player.walk = Math.PI + 0.1;
  life.update(g, 0.01);
  assert.equal(life.state(g.world).steps.length, 1);
  g.player.moving = false;
  life.update(g, 2);
  assert.equal(life.state(g.world).steps.length, 0);
  assert.equal(JSON.stringify(g.save), save);
});
test("environment motion is deterministic, surface-aware and changes with world time", () => {
  const g = fixture(),
    a = new B.WorldLife(),
    b = new B.WorldLife();
  assert.deepEqual(a.state(g.world).leaves, b.state(g.world).leaves);
  assert.equal(B.surfaceAt(g.world, 600, 505), "asphalt");
  assert.equal(B.surfaceAt(g.world, 300, 390), "paving");
  assert.equal(B.surfaceAt(g.world, 960, 1280), "grass");
  assert.equal(B.surfaceAt(B.createWorld("fort", g.save), 600, 505), "stone");
  const wind = a.wind(g.world, 600, 800);
  g.world.time += 1;
  assert.notEqual(a.wind(g.world, 600, 800), wind);
});

test("every playable form uses three distinct light attacks, a separate heavy and restarts the combo", () => {
  for (const form of ["ben", "four", "heat", "diamond"]) {
    const g = fixture();
    g.player.form = form;
    g.world.enemies = [];
    const variants = [];
    for (let n = 0; n < 4; n++) {
      g.player.attackCD = 0;
      B.attack(g, "J");
      variants.push(g.player.attack.variant);
      B.advanceAttack(g, 0.2);
    }
    assert.deepEqual(variants, [0, 1, 2, 0], form);
    g.player.attackCD = 0;
    B.attack(g, "K");
    assert.equal(g.player.attack.variant, 3, form);
    B.advanceAttack(g, 0.6);
    g.player.attackCD = 0;
    g.player.comboTimer = 0.01;
    B.updatePlayer(g, 0.02);
    B.attack(g, "J");
    assert.equal(g.player.attack.variant, 0, form + " after timeout");
  }
});

test("north streets stop before the shops and their surface matches the visible sidewalk", () => {
  const g = fixture();
  assert.equal(B.surfaceAt(g.world, 600, 100), "grass");
  assert.equal(B.surfaceAt(g.world, 600, 410), "paving");
  assert.equal(B.surfaceAt(g.world, 600, 510), "asphalt");
  for (const o of g.world.obstacles.filter((o) => o.kind === "building")) {
    const box = B.buildingBox(o);
    assert.ok(box.w > 0 && box.h > 0);
    assert.equal(box.y + box.h, o.y + o.h);
    assert.ok(box.x >= o.x && box.x + box.w <= o.x + o.w);
  }
});
