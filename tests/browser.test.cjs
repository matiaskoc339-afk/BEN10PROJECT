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
  await check(
    "scenery and combat atlases have complete silhouettes with clear frame borders",
    async () => {
      const bad = await page.evaluate(() => {
        const issues = [];
        for (const [key, sheet] of Object.entries(B10.sheets)) {
          if (
            !["props", "buildings", "flora", "sideProps"].includes(key) &&
            !key.endsWith("Combat") &&
            !key.endsWith("Side")
          )
            continue;
          for (const [index, f] of sheet.frames.entries()) {
            const cv = document.createElement("canvas");
            cv.width = f.w;
            cv.height = f.h;
            const c = cv.getContext("2d");
            c.drawImage(sheet.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
            const pixels = c.getImageData(0, 0, f.w, f.h).data;
            let cut = 0;
            for (let y = 0; y < f.h; y++)
              for (let x = 0; x < f.w; x++) {
                if (
                  (x < 2 || y < 2 || x >= f.w - 2 || y >= f.h - 2) &&
                  pixels[(y * f.w + x) * 4 + 3] > 200
                )
                  cut++;
              }
            if (cut) issues.push({ key, index, cut });
          }
        }
        return issues;
      });
      assert.deepEqual(bad, []);
    },
  );
  await check(
    "scenery keeps its aspect ratio and fits entirely inside its display area",
    async () => {
      const layouts = await page.evaluate(() =>
        Array.from({ length: 28 }, (_, index) => {
          const r = B10.propRect(index, 25, 40, 113, 260),
            f = B10.sheets[r.key].frames[r.index];
          return { ...r, ratio: f.b.w / f.b.h };
        }),
      );
      for (const r of layouts) {
        assert.ok(Math.abs(r.w / r.h - r.ratio) < 0.00001);
        assert.ok(r.x >= 24.99999 && r.y >= 39.99999);
        assert.ok(r.x + r.w <= 138.00001 && r.y + r.h <= 300.00001);
      }
    },
  );
  await check(
    "Ben and each alien have four distinct attacks in both lateral orientations",
    async () => {
      const variants = await page.evaluate(() => {
        const result = [];
        for (const id of ["ben", "four", "heat", "diamond"])
          for (const facing of [0, Math.PI]) {
            const frames = [];
            for (let variant = 0; variant < 4; variant++) {
              const cv = document.createElement("canvas");
              cv.width = cv.height = 300;
              B10.drawActor(cv.getContext("2d"), id, 150, 270, 1.5, {
                time: 0,
                facing,
                lateral: true,
                attack: {
                  time: 0.32,
                  total: 0.48,
                  hitAt: 0.13,
                  variant,
                  fired: true,
                },
              });
              frames.push(cv.toDataURL());
            }
            result.push({ id, facing, count: new Set(frames).size });
          }
        return result;
      });
      for (const v of variants)
        assert.equal(v.count, 4, v.id + " facing " + v.facing);
    },
  );
  await check(
    "lateral walking uses six consecutive gait poses and a separate idle",
    async () => {
      const poses = await page.evaluate(() =>
        ["ben", "four", "heat", "diamond", "basic"].map((id) => {
          const frames = Array.from({ length: 6 }, (_, n) =>
            B10.spriteFrame(id, {
              moving: true,
              walk: ((n + 0.15) * B10.TAU) / 6,
              facing: 0,
              lateral: true,
            }),
          );
          return {
            frames,
            idle: B10.spriteFrame(id, {
              moving: false,
              walk: 4,
              facing: 0,
              lateral: true,
            }),
          };
        }),
      );
      for (const p of poses) {
        assert.equal(new Set(p.frames.map((f) => f.index)).size, 6);
        assert.ok(p.frames.every((f) => f.key.endsWith("Side")));
        assert.equal(p.idle.index, 0);
        assert.ok(p.frames.every((f) => f.index >= 2 && f.index <= 7));
      }
    },
  );
  await check(
    "the fountain animates water over its fitted scenery model",
    async () => {
      const frames = await page.evaluate(() =>
        [0, 1.2].map((t) => {
          const cv = document.createElement("canvas");
          cv.width = 230;
          cv.height = 220;
          const c = cv.getContext("2d");
          B10.SideScene.water(c, 115, 205, t);
          return cv.toDataURL();
        }),
      );
      assert.notEqual(frames[0], frames[1]);
    },
  );
  await check(
    "wind moves foliage while the base of the trunk stays planted",
    async () => {
      const result = await page.evaluate(() => {
        const frames = [-3, 3].map((wind) => {
          const cv = document.createElement("canvas");
          cv.width = 130;
          cv.height = 145;
          const c = cv.getContext("2d");
          B10.drawProp(c, 8, 0, 0, 130, 145, { wind });
          return c.getImageData(0, 0, 130, 145).data;
        });
        const root = (bytes) => {
          let sum = 0,
            mass = 0;
          for (let y = 138; y < 145; y++)
            for (let x = 0; x < 130; x++) {
              const alpha = bytes[(y * 130 + x) * 4 + 3];
              sum += x * alpha;
              mass += alpha;
            }
          return sum / mass;
        };
        let changed = 0;
        for (let i = 0; i < frames[0].length; i += 4)
          if (frames[0][i + 3] !== frames[1][i + 3]) changed++;
        return {
          rootShift: Math.abs(root(frames[0]) - root(frames[1])),
          changed,
        };
      });
      assert.ok(result.rootShift < 0.4);
      assert.ok(result.changed > 50);
    },
  );
  await check(
    "actor shadows project onto the ground below the planted feet",
    async () => {
      const changed = await page.evaluate(() => {
        const frames = [false, true].map((shadow) => {
          const cv = document.createElement("canvas");
          cv.width = 300;
          cv.height = 300;
          const c = cv.getContext("2d");
          B10.drawActor(c, "four", 150, 230, 1, { time: 0, shadow });
          return c.getImageData(0, 230, 300, 60).data;
        });
        let count = 0;
        for (let i = 3; i < frames[0].length; i += 4)
          if (frames[1][i] > frames[0][i]) count++;
        return count;
      });
      assert.ok(changed > 100);
    },
  );
  await check(
    "stage lighting and suspended lamps animate while the camera is stationary",
    async () => {
      const changed = await page.evaluate(() => {
        const old = game.world.time,
          fixture = {
            ...game,
            view: { w: 900, h: 520 },
            camera: { x: 1440, y: 430, zoom: 0.7 },
          };
        const paint = (t) => {
          game.world.time = t;
          const cv = document.createElement("canvas");
          cv.width = 900;
          cv.height = 520;
          const c = cv.getContext("2d");
          c.setTransform(0.7, 0, 0, 0.7, -800 * 0.7, -30);
          B10.SideScene.background(c, fixture);
          B10.SideScene.ambient(c, fixture);
          return c.getImageData(0, 0, 900, 520).data;
        };
        const a = paint(0),
          b = paint(1.4);
        game.world.time = old;
        let count = 0;
        for (let n = 0; n < a.length; n += 4)
          if (a[n] !== b[n] || a[n + 1] !== b[n + 1] || a[n + 2] !== b[n + 2])
            count++;
        return count;
      });
      assert.ok(changed > 200);
    },
  );
  await check(
    "panorama layers redraw continuously when the camera advances horizontally",
    async () => {
      const changed = await page.evaluate(() => {
        const paint = (x) => {
          const fixture = {
              ...game,
              view: { w: 900, h: 520 },
              camera: { x, y: 430, zoom: 0.7 },
            },
            cv = document.createElement("canvas");
          cv.width = 900;
          cv.height = 520;
          const c = cv.getContext("2d");
          c.setTransform(0.7, 0, 0, 0.7, -(x - 640) * 0.7, -30);
          B10.SideScene.background(c, fixture);
          return c.getImageData(0, 0, 900, 400).data;
        };
        const a = paint(1440),
          b = paint(1680);
        let count = 0;
        for (let n = 0; n < a.length; n += 4) if (a[n] !== b[n]) count++;
        return count;
      });
      assert.ok(changed > 10000);
    },
  );
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
    "horizontal camera follows progression and holds its height across depth changes",
    async () => {
      const result = await page.evaluate(() => {
        const p = game.player,
          old = { x: p.x, y: p.y };
        game.world.enemies = [];
        game.save.flags.gateHint = true;
        game.hitstop = 0;
        p.dodgeTime = 0;
        p.attack = null;
        p.x = 2000;
        p.y = 540;
        game.update(1 / 60);
        const first = { ...game.camera };
        p.y = 690;
        game.update(1 / 60);
        const second = { ...game.camera };
        p.x = 25;
        game.update(1 / 60);
        const edge = { ...game.camera };
        p.x = old.x;
        p.y = old.y;
        return {
          first,
          second,
          edge,
          half: game.view.w / game.camera.zoom / 2,
        };
      });
      assert.equal(result.first.x, 2000);
      assert.equal(result.first.y, 430);
      assert.equal(result.second.y, 430);
      assert.equal(result.edge.x, result.half);
    },
  );
  await check(
    "W/S moves through the belt without switching to an overhead sprite or moving the camera vertically",
    async () => {
      await page.evaluate(() => {
        game.player.x = 1700;
        game.player.y = 600;
        game.player.sideFacing = 0;
        game.player.renderFacing = 0;
        game.player.dodgeTime = 0;
        game.player.attack = null;
      });
      const before = await page.evaluate(() => ({
        y: game.player.y,
        cam: game.camera.y,
      }));
      await page.keyboard.down("KeyS");
      await page.waitForTimeout(220);
      await page.keyboard.up("KeyS");
      const after = await page.evaluate(() => ({
        y: game.player.y,
        cam: game.camera.y,
        frame: B10.spriteFrame(game.player.form, {
          lateral: true,
          moving: true,
          walk: game.player.walk,
          facing: game.player.renderFacing,
        }),
      }));
      assert.ok(after.y > before.y + 10);
      assert.equal(after.cam, before.cam);
      assert.ok(after.frame.key.endsWith("Side"));
      assert.equal(after.frame.row, 0);
    },
  );
  await check(
    "M opens a usable map and pauses movement while viewing it",
    async () => {
      await page.keyboard.press("KeyM");
      assert.equal(await page.evaluate(() => game.ui.panelType), "map");
      assert.ok(await page.locator("#panel-body canvas").isVisible());
      const x = await page.evaluate(() => game.player.x);
      const time = await page.evaluate(() => game.world.time);
      await page.keyboard.down("KeyD");
      await page.waitForTimeout(150);
      await page.keyboard.up("KeyD");
      assert.equal(await page.evaluate(() => game.player.x), x);
      assert.equal(await page.evaluate(() => game.world.time), time);
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
  await check(
    "a keyboard punch hits the aligned knight while missing a knight deeper in the belt",
    async () => {
      await page.evaluate(() => {
        Object.assign(game.player, {
          form: "four",
          x: 1800,
          y: 620,
          attack: null,
          attackCD: 0,
          combo: "",
          sideFacing: 0,
          dodgeTime: 0,
        });
        game.world.enemies = [
          B10.makeEnemy("heavy", 1870, 620, "front-belt"),
          B10.makeEnemy("heavy", 1870, 695, "deep-belt"),
        ];
        for (const e of game.world.enemies) {
          e.stun = 1;
          e.cd = 10;
        }
      });
      await page.waitForTimeout(40);
      await page.mouse.move(1150, 570);
      await page.keyboard.press("KeyJ");
      await page.waitForTimeout(110);
      const hp = await page.evaluate(() => game.world.enemies.map((e) => e.hp));
      assert.ok(hp[0] < 155);
      assert.equal(hp[1], 155);
    },
  );
  await check("transform cancel, queuing and wheel locks", async () => {
    await page.evaluate(() => {
      game.world.enemies = [];
      game.save.flags.gateHint = true;
      game.player.energy = 65;
      game.player.hp = 80;
      game.player.form = "ben";
      game.player.locked = false;
    });
    await page.keyboard.press("Digit1");
    await page.keyboard.press("Digit2");
    assert.equal(await page.evaluate(() => game.player.form), "four");
    assert.equal(await page.evaluate(() => game.player.queued), "heat");
    await page.evaluate(() => {
      addEventListener(
        "keydown",
        () => {
          window.cancelBefore = game.player.energy;
          queueMicrotask(() => {
            window.cancelAfter = game.player.energy;
          });
        },
        { once: true, capture: true },
      );
    });
    await page.keyboard.press("KeyX");
    assert.equal(await page.evaluate(() => game.player.form), "ben");
    const preserved = await page.evaluate(() =>
      Math.abs(window.cancelAfter - window.cancelBefore),
    );
    assert.ok(preserved < 0.0001);
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
        const gate = game.world.objects.find((o) => o.type === "gate");
        game.player.x = gate.x - 80;
        game.player.y = gate.y;
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
        game.player.y = game.world.exit.y;
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
        game.player.y = game.world.exit.y;
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
        game.player.y = game.world.exit.y;
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
        game.player.y = game.world.exit.y;
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
