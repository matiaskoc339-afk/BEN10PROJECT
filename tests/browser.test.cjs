/* Browser integration checks use explicit fixtures for distant story encounters;
   keyboard, UI, combat, puzzle, save and transition code remains the production code. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.join(
    root,
    decodeURIComponent(
      req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0],
    ),
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      file.endsWith(".png")
        ? "image/png"
        : file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "text/html",
    );
    res.end(data);
  });
});
let browser;
let count = 0,
  skipped = 0;
const errors = [];
async function check(name, fn) {
  const result = await fn();
  if (result === false) {
    skipped++;
    console.log("SKIP", name);
    return;
  }
  count++;
  console.log("PASS", name);
}
(async () => {
  await new Promise((r) => server.listen(8765, "127.0.0.1", r));
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", () => {
    errors.push("Unexpected native browser dialog");
  });
  await page.goto("http://127.0.0.1:8765");
  await page.waitForFunction(() => B10.assetsLoaded);
  await check("menu and empty continue slot", async () => {
    assert.ok(await page.locator("#menu").isVisible());
    assert.ok(await page.locator("#continue").isDisabled());
    await page.screenshot({ path: path.join(root, "artifacts/menu.png") });
  });
  await check(
    "every story character and every DNA silhouette renders",
    async () => {
      const counts = await page.evaluate(() => {
        const names = [
          "ben",
          "Kevin",
          "Vilgax",
          "Malware",
          "Hex",
          "Zombozo",
          "Dr. Ánimo",
          "Driscoll",
          "Gwen",
          "Max",
          "Comandante",
          "Ejecutor",
          ...B10.forms.map((form) => form.id),
        ];
        return names.map((name) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 180;
          B10.drawCharacterPortrait(canvas, name, { scene: "intro", time: 0 });
          const pixels = canvas
            .getContext("2d")
            .getImageData(0, 0, 180, 180).data;
          let painted = 0;
          for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) painted++;
          return { name, painted };
        });
      });
      assert.equal(counts.length, 22);
      for (const { name, painted } of counts) assert.ok(painted > 1000, name);
    },
  );
  await check(
    "Driscoll has original armor in the prologue and crystal only in the boss encounter",
    async () => {
      const result = await page.evaluate(() => {
        function render(scene, armor) {
          const c = document.createElement("canvas");
          c.width = 240;
          c.height = 280;
          B10.drawActor(c.getContext("2d"), "Driscoll", 120, 265, 2, {
            time: 0,
            scene,
            armor,
          });
          return c.toDataURL();
        }
        return {
          intro: render("intro", 2),
          original: render("intro", 0),
          crystal: render("throne", 2),
          shattered: render("throne", 0),
        };
      });
      assert.equal(result.intro, result.original);
      assert.equal(result.intro, result.shattered);
      assert.notEqual(result.crystal, result.intro);
    },
  );
  await check(
    "directional walk, windup, contact and recovery have distinct frames",
    async () => {
      const frames = await page.evaluate(() => {
        const states = [
          {},
          { walk: 2 },
          { walk: 4.5 },
          { attack: { time: 0.46, total: 0.48, hitAt: 0.13 } },
          { attack: { time: 0.32, total: 0.48, hitAt: 0.13 } },
          { attack: { time: 0.05, total: 0.48, hitAt: 0.13 } },
        ];
        return states.map((state) => {
          const c = document.createElement("canvas");
          c.width = 300;
          c.height = 300;
          B10.drawActor(c.getContext("2d"), "four", 150, 280, 2, {
            time: 0,
            ...state,
          });
          return c.toDataURL();
        });
      });
      assert.equal(new Set(frames).size, frames.length);
    },
  );
  await check("Ben's dialogue expressions change the face itself", async () => {
    const frames = await page.evaluate(() =>
      ["DECIDIDO", "ALARMADO", "SONRIENTE"].map((expression) => {
        const c = document.createElement("canvas");
        c.width = c.height = 180;
        B10.drawCharacterPortrait(c, "ben", { expression, time: 0 });
        return c.toDataURL();
      }),
    );
    assert.equal(new Set(frames).size, 3);
  });
  await check("options persist and controls can be remapped", async () => {
    await page.click("[data-panel=settings]");
    await page.locator("input[type=range]").fill("20");
    await page.click("#close-panel");
    await page.click("[data-panel=controls]");
    await page
      .locator(".control-row")
      .filter({ hasText: "Ataque fuerte" })
      .locator("button")
      .click();
    await page.keyboard.press("KeyL");
    assert.equal(await page.evaluate(() => game.bindings.heavy), "KeyL");
    await page.getByText("RESTAURAR CONTROLES", { exact: true }).click();
    await page.click("#close-panel");
    assert.equal(await page.evaluate(() => game.bindings.heavy), "KeyK");
  });
  await check(
    "typewriter first press reveals line, next advances, scenes skip safely",
    async () => {
      await page.click("#new-game");
      assert.equal(await page.evaluate(() => game.mode), "dialogue");
      await page.keyboard.press("KeyE");
      assert.equal(
        await page.locator("#dialogue-text").textContent(),
        "Al fin. El Omnitrix completo será mío. ¡Activa el extractor, Malware!",
      );
      await page.keyboard.press("KeyE");
      assert.equal(await page.locator("#speaker").textContent(), "MALWARE");
      await page.click("#skip-scene");
      assert.equal(await page.evaluate(() => game.ui.dialogue.id), "arrival");
      await page.keyboard.press("KeyE");
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(root, "artifacts/dialogue.png"),
      });
      await page.click("#skip-scene");
      assert.equal(await page.evaluate(() => game.player.form), "four");
      assert.equal(await page.evaluate(() => game.world.zone), "city");
    },
  );
  await check(
    "WASD movement and mouse-facing attacks damage real enemies",
    async () => {
      const x = await page.evaluate(() => game.player.x);
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(450);
      await page.keyboard.up("KeyD");
      assert.ok((await page.evaluate(() => game.player.x)) > x + 45);
      await page.evaluate(() => {
        game.player.x = 530;
        game.player.y = 510;
        game.player.invuln = 0;
        game.world.enemies[0].x = 600;
        game.world.enemies[0].y = 510;
        game.camera.x = 700;
        game.camera.y = 550;
      });
      await page.mouse.move(1000, 460);
      await page.waitForTimeout(50);
      const hp = await page.evaluate(() => game.world.enemies[0].hp);
      await page.keyboard.press("KeyJ");
      await page.waitForTimeout(120);
      assert.ok((await page.evaluate(() => game.world.enemies[0].hp)) < hp);
      await page.keyboard.press("Space");
      assert.ok((await page.evaluate(() => game.player.dodgeCD)) > 0);
      await page.screenshot({
        path: path.join(root, "artifacts/gameplay.png"),
      });
    },
  );
  await check(
    "camera stays centered on the player even at the map boundary",
    async () => {
      const centered = await page.evaluate(() => {
        const x = game.player.x,
          y = game.player.y;
        game.player.x = 25;
        game.player.y = 570;
        game.update(1 / 60);
        const error = Math.hypot(
          game.camera.x - game.player.x,
          game.camera.y - (game.player.y - 28),
        );
        game.player.x = x;
        game.player.y = y;
        game.update(1 / 60);
        return error;
      });
      assert.ok(centered < 0.001);
    },
  );
  await check(
    "M opens a usable map and pauses movement while viewing it",
    async () => {
      await page.keyboard.press("KeyM");
      assert.equal(await page.evaluate(() => game.ui.panelType), "map");
      assert.ok(await page.locator("#panel-body canvas").isVisible());
      const x = await page.evaluate(() => game.player.x);
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(150);
      await page.keyboard.up("KeyD");
      assert.equal(await page.evaluate(() => game.player.x), x);
      await page.keyboard.press("KeyM");
      assert.equal(await page.evaluate(() => game.mode), "play");
    },
  );
  await check("real AI attacks can reduce player health", async () => {
    await page.evaluate(() => {
      game.player.form = "ben";
      game.player.invuln = 0;
      game.player.dodgeTime = 0;
      game.player.x = 500;
      game.player.y = 550;
      game.player.hp = 120;
      game.world.enemies = [B10.makeEnemy("basic", 540, 550, "ai-fixture")];
      game.world.enemies[0].cd = 0;
      game.world.enemies[0].stun = 0;
    });
    await page.waitForTimeout(1100);
    assert.ok((await page.evaluate(() => game.player.hp)) < 120);
  });
  await check("transform cancel, queuing and wheel locks", async () => {
    await page.evaluate(() => {
      game.player.energy = 65;
      game.player.hp = 80;
      game.player.form = "ben";
      game.player.locked = false;
    });
    await page.keyboard.press("Digit1");
    await page.keyboard.press("Digit2");
    assert.equal(await page.evaluate(() => game.player.form), "four");
    assert.equal(await page.evaluate(() => game.player.queued), "heat");
    const energy = await page.evaluate(() => game.player.energy);
    await page.keyboard.press("KeyX");
    assert.equal(await page.evaluate(() => game.player.form), "ben");
    assert.ok(
      Math.abs((await page.evaluate(() => game.player.energy)) - energy) < 2,
    );
    await page.keyboard.press("KeyE");
    assert.equal(await page.evaluate(() => game.player.form), "heat");
    assert.equal(await page.evaluate(() => game.player.hp), 80);
    await page.keyboard.down("KeyQ");
    assert.ok(await page.locator("#wheel").isVisible());
    assert.equal(await page.locator(".wheel-slot").count(), 10);
    assert.equal(await page.locator(".wheel-slot.locked").count(), 8);
    await page.evaluate(() => {
      game.ui.wheelIndex = 3;
      game.ui.wheelHighlight();
    });
    await page.screenshot({ path: path.join(root, "artifacts/omnitrix.png") });
    await page.keyboard.up("KeyQ");
    assert.equal(await page.evaluate(() => game.player.form), "heat");
  });
  await check(
    "skills spend points and favorites exclude locked DNA",
    async () => {
      await page.evaluate(() => {
        game.addXP(100);
      });
      await page.keyboard.press("Tab");
      await page.locator(".skill-node").first().click();
      assert.ok(await page.evaluate(() => game.save.skills.heat.includes(0)));
      assert.equal(await page.evaluate(() => game.save.points), 0);
      await page.click("#close-panel");
      await page.keyboard.press("Escape");
      await page
        .getByText("OMNITRIX · Configurar favoritos", { exact: true })
        .click();
      assert.equal(
        await page.locator("select").first().locator("option").count(),
        3,
      );
      await page.locator("select").nth(2).selectOption("heat");
      assert.equal(await page.evaluate(() => game.save.favorites[2]), "heat");
      await page.click("#close-panel");
    },
  );
  await check(
    "exhaustion recovers, death retries current checkpoint, save reloads",
    async () => {
      await page.evaluate(() => {
        game.player.form = "heat";
        game.player.energy = 0.001;
        B10.updatePlayer(game, 0.04);
      });
      assert.equal(await page.evaluate(() => game.player.form), "ben");
      assert.ok(await page.evaluate(() => game.player.locked));
      await page.evaluate(() => {
        for (let i = 0; i < 90; i++) B10.updatePlayer(game, 0.04);
      });
      assert.equal(await page.evaluate(() => game.player.locked), false);
      await page.evaluate(() => {
        game.persist();
        game.player.invuln = 0;
        game.player.hp = 1;
        B10.hurtPlayer(game, 20, { x: game.player.x + 20, y: game.player.y });
      });
      assert.equal(
        await page.locator("#panel-title").textContent(),
        "HÉROE FUERA DE COMBATE",
      );
      await page
        .getByText("↗  REINTENTAR DESDE EL PUNTO DE CONTROL", { exact: true })
        .click();
      assert.equal(await page.evaluate(() => game.player.hp), 120);
      assert.equal(await page.evaluate(() => game.world.zone), "city");
      await page.reload();
      await page.click("#continue");
      assert.ok(await page.evaluate(() => game.save.skills.heat.includes(0)));
      assert.equal(await page.evaluate(() => game.save.favorites[2]), "heat");
    },
  );
  // Fixture placement skips walking time; mechanisms are activated through actual attacks.
  await check(
    "fire projectiles heat gate and sustained interaction lifts it",
    async () => {
      await page.evaluate(() => {
        game.save.flags.gateHint = true;
        game.world.enemies = [];
        game.player.form = "heat";
        game.player.energy = 100;
        game.player.x = 1500;
        game.player.y = 550;
        game.player.facing = 0;
        for (let i = 0; i < 4; i++) {
          game.player.attackCD = 0;
          B10.attack(game, "J");
          B10.advanceAttack(game, 0.14);
          for (let j = 0; j < 10; j++) B10.updateEffects(game, 0.04);
        }
      });
      assert.equal(
        await page.evaluate(
          () => game.world.objects.find((o) => o.type === "gate").heat,
        ),
        100,
      );
      await page.keyboard.press("KeyX");
      await page.keyboard.press("Digit1");
      await page.keyboard.down("KeyE");
      await page.waitForFunction(() => game.save.flags.gate, null, {
        timeout: 7000,
      });
      await page.keyboard.up("KeyE");
      assert.ok(await page.evaluate(() => game.save.flags.gate));
      await page.evaluate(() => {
        game.player.x = game.world.exit.x;
        game.player.y = 550;
        B10.updateWorld(game, 0.01);
      });
      assert.equal(await page.evaluate(() => game.world.zone), "market");
      await page.click("#skip-scene");
    },
  );
  await check(
    "executor encounter has a second phase and victory opens fortress",
    async () => {
      await page.evaluate(() => {
        const e = game.world.enemies.find((e) => e.type === "executor");
        game.player.x = e.x - 75;
        game.player.y = e.y;
        game.player.form = "four";
        game.player.facing = 0;
        game.player.invuln = 2;
        for (let i = 0; i < 7; i++) {
          game.player.attackCD = 0;
          B10.attack(game, "K");
          B10.advanceAttack(game, 0.14);
        }
        e.stun = 0;
        B10.updateEnemies(game, 0.01);
      });
      assert.equal(
        await page.evaluate(
          () => game.world.enemies.find((e) => e.type === "executor").phase,
        ),
        2,
      );
      await page.evaluate(() => {
        const e = game.world.enemies.find((e) => e.type === "executor");
        for (let i = 0; i < 10 && !e.dead; i++) {
          game.player.attackCD = 0;
          B10.attack(game, "K");
          B10.advanceAttack(game, 0.14);
        }
        if (game.ui.dialogue) game.ui.skip();
      });
      assert.ok(await page.evaluate(() => game.save.flags.executor));
      await page.waitForTimeout(1000);
      if (await page.locator("#dialogue").isVisible())
        await page.click("#skip-scene");
      await page.evaluate(() => {
        game.player.x = game.world.exit.x;
        game.player.y = 550;
        B10.updateWorld(game, 0.01);
      });
      assert.equal(await page.evaluate(() => game.world.zone), "fort");
      await page.click("#skip-scene");
    },
  );
  await check(
    "crystal puzzle opens throne and boss entry preserves checkpoint",
    async () => {
      await page.evaluate(() => {
        for (const o of game.world.objects.filter(
          (o) => o.type === "support",
        )) {
          game.player.x = o.x - 95;
          game.player.y = o.y;
          game.player.form = "heat";
          game.player.facing = 0;
          for (let i = 0; i < 4; i++) {
            game.player.attackCD = 0;
            B10.attack(game, "J");
            B10.advanceAttack(game, 0.14);
            for (let n = 0; n < 8; n++) B10.updateEffects(game, 0.04);
          }
          B10.revert(game);
          B10.transform(game, "four");
          for (let i = 0; i < 2; i++) {
            game.player.attackCD = 0;
            B10.attack(game, "K");
            B10.advanceAttack(game, 0.14);
          }
        }
      });
      assert.ok(await page.evaluate(() => game.save.flags.supports));
      await page.evaluate(() => {
        game.pending = null;
        game.player.x = game.world.exit.x;
        game.player.y = 550;
        B10.updateWorld(game, 0.01);
      });
      assert.equal(await page.evaluate(() => game.world.zone), "throne");
      assert.equal(await page.evaluate(() => B10.Save.read().zone), "throne");
      await page.click("#skip-scene");
    },
  );
  await check(
    "two thermal fractures trigger sword phase, retreat, victory and DNA recovery",
    async () => {
      await page.evaluate(() => {
        const e = game.world.enemies.find((e) => e.type === "king");
        game.player.x = e.x - 105;
        game.player.y = e.y;
        game.player.invuln = 5;
        for (let plate = 0; plate < 2; plate++) {
          game.player.form = "heat";
          game.player.facing = 0;
          for (let i = 0; i < 5; i++) {
            game.player.attackCD = 0;
            B10.attack(game, "J");
            B10.advanceAttack(game, 0.14);
            for (let n = 0; n < 10; n++) B10.updateEffects(game, 0.04);
          }
          B10.revert(game);
          B10.transform(game, "four");
          for (let i = 0; i < 2; i++) {
            game.player.attackCD = 0;
            B10.attack(game, "K");
            B10.advanceAttack(game, 0.14);
          }
        }
      });
      assert.equal(await page.evaluate(() => game.world.enemies[0].phase), 2);
      await page.evaluate(() => {
        const e = game.world.enemies[0];
        for (let i = 0; i < 12 && e.hp >= 330; i++) {
          game.player.attackCD = 0;
          B10.attack(game, "K");
          B10.advanceAttack(game, 0.14);
        }
        e.stun = 0;
        B10.updateEnemies(game, 0.01);
      });
      assert.equal(await page.evaluate(() => game.world.enemies[0].phase), 3);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(root, "artifacts/boss.png") });
      await page.evaluate(() => {
        const e = game.world.enemies[0];
        game.player.x = e.x - 85;
        game.player.y = e.y;
        game.player.facing = 0;
        for (let i = 0; i < 12 && !e.dead; i++) {
          game.player.attackCD = 0;
          B10.attack(game, "K");
          B10.advanceAttack(game, 0.14);
        }
        game.pending?.();
        game.pending = null;
        game.defer = 0;
      });
      assert.ok(await page.evaluate(() => game.save.flags.king));
      assert.equal(await page.evaluate(() => game.ui.dialogue.id), "recovery");
      await page.click("#skip-scene");
      assert.ok(
        await page.evaluate(() => game.save.unlocked.includes("diamond")),
      );
      assert.equal(
        await page.evaluate(() => game.save.favorites[2]),
        "diamond",
      );
      assert.equal(await page.evaluate(() => game.world.zone), "escape");
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(root, "artifacts/unlock.png") });
    },
  );
  await check(
    "Diamante constructs escape route and chapter completes with saved progress",
    async () => {
      await page.evaluate(() => {
        B10.revert(game);
        B10.transform(game, "diamond");
        for (const o of game.world.objects.filter((o) =>
          ["bridge", "socket"].includes(o.type),
        )) {
          game.player.x = o.x - 65;
          game.player.y = o.y;
          game.player.facing = 0;
          for (let i = 0; i < 3; i++) {
            game.player.attackCD = 0;
            B10.attack(game, "J");
            B10.advanceAttack(game, 0.14);
            for (let n = 0; n < 8; n++) B10.updateEffects(game, 0.04);
          }
        }
      });
      assert.ok(
        await page.evaluate(
          () => game.save.flags.bridge && game.save.flags["exit-crystal"],
        ),
      );
      await page.evaluate(() => {
        game.player.x = game.world.exit.x;
        game.player.y = 550;
        B10.updateWorld(game, 0.01);
      });
      assert.equal(await page.evaluate(() => game.ui.dialogue.id), "finish");
      await page.click("#skip-scene");
      assert.equal(await page.evaluate(() => game.mode), "complete");
      assert.ok(await page.evaluate(() => B10.Save.read().completed));
      await page.screenshot({
        path: path.join(root, "artifacts/completed.png"),
      });
      await page.click("#explore");
      assert.equal(await page.evaluate(() => game.world.zone), "city");
    },
  );
  await check("small desktop viewport renders without overflow", async () => {
    await page.evaluate(() => game.toMenu());
    await page.setViewportSize({ width: 1024, height: 720 });
    await page.screenshot({
      path: path.join(root, "artifacts/menu-small.png"),
    });
    assert.ok(await page.locator("#new-game").isVisible());
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      1024,
    );
  });
  await check(
    "index.html also loads from file URL without a server",
    async () => {
      const p = await browser.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      try {
        await p.goto("file://" + path.join(root, "index.html"));
      } catch (e) {
        if (e.message.includes("ERR_BLOCKED_BY_ADMINISTRATOR")) {
          await p.close();
          return false;
        }
        throw e;
      }
      await p.click("#new-game");
      assert.equal(await p.evaluate(() => game.mode), "dialogue");
      await p.close();
    },
  );
  assert.deepEqual(errors, []);
  console.log(
    `\n${count} browser integration checks passed; ${skipped} optional check skipped by browser policy; no page errors.`,
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.close();
  });
