const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PlayerStats } = require("../systems/player-stats.js");
const form = { id: "future-test-form", name: "FORMA DE PRUEBA" };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
const prime = (s) => {
  s.recordLightHit();
  s.recordLightHit();
};

test("Ben keeps his energy and recovers a partially charged watch", () => {
  const s = new PlayerStats();
  s.tick(20);
  assert.equal(s.energy, 100);
  s.energy = 60;
  s.tick(2);
  assert.equal(s.energy, 76);
  assert.equal(s.transformed, false);
});
test("active transformations drain with elapsed time, independently of frame rate", () => {
  for (const frames of [1, 30, 60, 120]) {
    const s = new PlayerStats();
    s.transform(form);
    for (let i = 0; i < frames; i++) s.tick(4 / frames);
    close(s.energy, 94);
    assert.equal(s.transformed, true);
  }
});
test("empty energy returns to Ben without losing life, XP or level", () => {
  const s = new PlayerStats();
  s.damage(27);
  s.awardXP(120);
  s.energy = 1.5;
  s.transform(form);
  s.tick(1);
  assert.equal(s.energy, 0);
  assert.equal(s.form, null);
  assert.equal(s.health, 73);
  assert.equal(s.level, 2);
  assert.equal(s.xp, 20);
  assert.equal(
    s.drainEvents().filter((e) => e.type === "form-ended").length,
    1,
  );
  s.tick(3);
  assert.equal(s.energy, 0);
  s.tick(1);
  assert.equal(s.energy, 8);
});
test("a long update handles exhaustion, recharge delay and remaining time consistently", () => {
  const a = new PlayerStats(),
    b = new PlayerStats();
  a.transform(form);
  b.transform(form);
  a.tick(80);
  for (let i = 0; i < 4800; i++) b.tick(1 / 60);
  assert.equal(a.form, null);
  assert.equal(b.form, null);
  close(a.energy, b.energy);
});
test("human combos never spend Omnitrix energy", () => {
  const s = new PlayerStats();
  prime(s);
  assert.equal(s.useComboSpecial(), false);
  assert.equal(s.energy, 100);
});
test("two connected light hits unlock one special and charge only once", () => {
  const s = new PlayerStats();
  s.transform(form);
  prime(s);
  assert.equal(s.specialReady, true);
  assert.equal(s.useComboSpecial().cost, 20);
  assert.equal(s.energy, 80);
  assert.equal(s.useComboSpecial(), false);
  assert.equal(s.energy, 80);
});
test("insufficient energy, a single hit or an expired chain cannot trigger a special", () => {
  const s = new PlayerStats();
  s.transform(form);
  s.recordLightHit();
  assert.equal(s.useComboSpecial(), false);
  prime(s);
  s.energy = 19;
  assert.equal(s.useComboSpecial(), false);
  assert.equal(s.energy, 19);
  s.energy = 100;
  prime(s);
  s.tick(1.4);
  assert.equal(s.useComboSpecial(), false);
});
test("a special that spends the last charge returns immediately to Ben", () => {
  const s = new PlayerStats();
  s.energy = 20;
  s.transform(form);
  prime(s);
  assert.equal(s.useComboSpecial().cost, 20);
  assert.equal(s.energy, 0);
  assert.equal(s.form, null);
  assert.deepEqual(
    s.drainEvents().map((e) => e.type),
    ["form-started", "special-used", "form-ended"],
  );
});
test("switching forms cannot refill energy; empty and defeated players cannot transform", () => {
  const s = new PlayerStats();
  s.transform(form);
  s.tick(10);
  s.transform({ id: "another-form" });
  assert.equal(s.energy, 85);
  s.energy = 0;
  s.returnToBen();
  assert.equal(s.transform(form), false);
  s.energy = 100;
  s.damage(150);
  assert.equal(s.transform(form), false);
});
test("life stays within bounds and lethal damage ends the active form", () => {
  const s = new PlayerStats();
  s.transform(form);
  assert.equal(s.damage(35), 35);
  assert.equal(s.health, 65);
  s.setHealth(999);
  assert.equal(s.health, 100);
  s.damage(150);
  assert.equal(s.health, 0);
  assert.equal(s.form, null);
  assert.equal(s.damage(-1), 0);
  s.setHealth(NaN);
  assert.equal(s.health, 0);
});
test("XP retains overflow across one and multiple level thresholds", () => {
  const s = new PlayerStats();
  s.awardXP(120);
  assert.equal(s.level, 2);
  assert.equal(s.xp, 20);
  assert.equal(s.xpNeeded, 150);
  s.awardXP(355);
  assert.equal(s.level, 4);
  assert.equal(s.xp, 25);
  assert.equal(s.xpNeeded, 250);
  assert.equal(s.totalXP, 475);
});
test("invalid rewards and negative time do not change progression", () => {
  const s = new PlayerStats();
  s.transform(form);
  const before = s.snapshot();
  for (const value of [-10, NaN, Infinity]) {
    s.awardXP(value);
    s.tick(value);
  }
  // Infinite time is rejected as well as negative/NaN time.
  assert.deepEqual(s.snapshot(), before);
});
test("snapshots cannot change the active form and reset starts a fresh session", () => {
  const s = new PlayerStats();
  s.transform(form);
  s.snapshot().form.id = "changed";
  assert.equal(s.form.id, form.id);
  s.awardXP(120);
  s.damage(50);
  s.reset();
  assert.equal(s.level, 1);
  assert.equal(s.xp, 0);
  assert.equal(s.energy, 100);
  assert.equal(s.health, 100);
  assert.equal(s.form, null);
});
test("the standalone embeds exactly the tested source module", () => {
  const root = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const embedded = html.match(
    /<!-- PLAYER_STATS_START -->\s*<script>([\s\S]*?)<\/script>\s*<!-- PLAYER_STATS_END -->/,
  );
  assert.ok(embedded);
  assert.equal(
    embedded[1].trim(),
    fs.readFileSync(path.join(root, "systems/player-stats.js"), "utf8").trim(),
  );
});
