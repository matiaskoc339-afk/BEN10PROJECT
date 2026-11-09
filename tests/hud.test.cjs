const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { instrument } = require("./demo-fixture.cjs");
const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(req.url === "/production" ? html : instrument(html));
});
let browser,
  count = 0;
const check = async (name, fn) => {
  await fn();
  count++;
  console.log("PASS", name);
};
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`);
(async () => {
  await new Promise((r) => server.listen(8777, "127.0.0.1", r));
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    requestAnimationFrame = () => 0;
  });
  await page.goto("http://127.0.0.1:8777");
  await page.evaluate(() => __demo.readyPromise);
  const reset = () => page.evaluate(() => __demo.reset());
  const tick = (n) => page.evaluate((n) => __demo.tick(n), n);

  await check(
    "initial HUD exposes life, energy, XP and level with correct colors",
    async () => {
      await reset();
      assert.equal(
        await page.locator("#healthText").textContent(),
        "100 / 100",
      );
      assert.equal(await page.locator("#xpText").textContent(), "0 / 100");
      assert.equal(await page.locator("#levelText").textContent(), "NIVEL 1");
      assert.equal(await page.locator("#formName").textContent(), "BEN");
      assert.equal(
        await page.locator("#energyGauge").getAttribute("aria-valuenow"),
        "100",
      );
      assert.equal(
        await page.locator("#healthFill").getAttribute("fill"),
        "url(#hudRed)",
      );
      assert.equal(
        await page.locator("#xpFill").getAttribute("fill"),
        "url(#hudAmber)",
      );
    },
  );
  await check(
    "damage updates the red life bar without spending XP or energy",
    async () => {
      await reset();
      await page.evaluate(() => {
        __demo.stats.damage(38);
        __demo.updateStats(0);
      });
      assert.equal(await page.locator("#healthText").textContent(), "62 / 100");
      close(
        Number(await page.locator("#healthFill").getAttribute("width")),
        392 * 0.62,
      );
      assert.equal(
        await page.locator("#healthGauge").getAttribute("aria-valuenow"),
        "62",
      );
      assert.equal(
        await page.locator("#energyGauge").getAttribute("aria-valuenow"),
        "100",
      );
      assert.equal(
        await page.locator("#xpGauge").getAttribute("aria-valuenow"),
        "0",
      );
    },
  );
  await check(
    "real target defeats grant XP once and carry overflow into the next level",
    async () => {
      await reset();
      await page.evaluate(() => {
        const p = __demo.player;
        p.dir = "right";
        p.faceX = 1;
        p.faceY = 0;
        for (const y of [-3, 0, 3])
          __demo.dummies.push({
            x: p.x + 75,
            y: p.y + y,
            health: 1,
            alive: true,
            hit: 0,
            shake: 0,
            respawn: 0,
          });
        __demo.heavyAttack();
      });
      await tick(0.5);
      assert.equal(await page.locator("#levelText").textContent(), "NIVEL 2");
      assert.equal(await page.locator("#xpText").textContent(), "20 / 150");
      close(
        Number(await page.locator("#xpFill").getAttribute("width")),
        (392 * 20) / 150,
      );
      assert.equal(await page.evaluate(() => __demo.stats.totalXP), 120);
      await tick(0.5);
      await page.evaluate(() => __demo.heavyAttack());
      await tick(0.5);
      assert.equal(await page.evaluate(() => __demo.stats.totalXP), 120);
      assert.equal(await page.locator("#formName").textContent(), "BEN");
    },
  );
  await check(
    "future-form energy drains by time, pauses with the wheel and reverts to Ben",
    async () => {
      await reset();
      await page.evaluate(() => {
        __demo.stats.transform({ id: "test-only-form", name: "PRUEBA" });
        __demo.player.selectedAlien = 0;
      });
      await tick(2);
      assert.equal(
        await page.locator("#energyGauge").getAttribute("aria-valuenow"),
        "97",
      );
      assert.equal(await page.locator("#formName").textContent(), "PRUEBA");
      await page.keyboard.press("r");
      const before = await page.evaluate(() => __demo.stats.energy);
      await tick(5);
      assert.equal(await page.evaluate(() => __demo.stats.energy), before);
      await page.keyboard.press("r");
      await page.evaluate(() => {
        __demo.stats.energy = 0.12;
      });
      await tick(0.1);
      assert.equal(await page.evaluate(() => __demo.stats.form), null);
      assert.equal(await page.evaluate(() => __demo.player.selectedAlien), -1);
      assert.equal(await page.locator("#formName").textContent(), "BEN");
      assert.equal(
        Number(await page.locator("#energyFill").getAttribute("height")),
        0,
      );
      assert.equal(
        Number(await page.locator("#energyLiquidMask").getAttribute("height")),
        0,
      );
      await page.evaluate(() => {
        __demo.stats.energy = 99.96;
        __demo.updateStats(0);
      });
      assert.ok(
        (await page.locator("#energyText").textContent()).includes(
          "RECARGANDO",
        ),
      );
      await page.evaluate(() => {
        __demo.stats.energy = 100;
        __demo.updateStats(0);
      });
      assert.ok(
        (await page.locator("#energyText").textContent()).includes("LISTO"),
      );
    },
  );
  await check(
    "a two-light-hit combo spends energy once on special contact, including misses",
    async () => {
      for (const miss of [false, true]) {
        await reset();
        await page.evaluate(() => {
          const p = __demo.player;
          p.dir = "right";
          p.faceX = 1;
          p.faceY = 0;
          __demo.stats.transform({ id: "test-only-form" });
          __demo.dummies.push({
            x: p.x + 80,
            y: p.y,
            health: 500,
            alive: true,
            hit: 0,
            shake: 0,
            respawn: 0,
          });
          __demo.lightAttack();
        });
        await tick(0.3);
        await page.evaluate(() => __demo.lightAttack());
        await tick(0.3);
        assert.equal(await page.evaluate(() => __demo.stats.comboHits), 2);
        if (miss)
          await page.evaluate(() => {
            __demo.dummies[0].x += 600;
          });
        const energy = await page.evaluate(() => __demo.stats.energy);
        await page.evaluate(() => __demo.heavyAttack());
        await tick(0.2);
        close(await page.evaluate(() => __demo.stats.energy), energy - 0.3);
        await tick(0.3);
        close(
          await page.evaluate(() => __demo.stats.energy),
          energy - 0.75 - 20,
        );
        await tick(0.2);
        close(
          await page.evaluate(() => __demo.stats.energy),
          energy - 1.05 - 20,
        );
        assert.equal(await page.evaluate(() => __demo.stats.comboHits), 0);
      }
    },
  );
  await check("dodging before a queued special cancels its cost", async () => {
    await reset();
    await page.evaluate(() => {
      __demo.stats.transform({ id: "test-only-form" });
      __demo.stats.recordLightHit();
      __demo.stats.recordLightHit();
      __demo.heavyAttack();
    });
    await page.keyboard.press("Space");
    await tick(0.45);
    close(await page.evaluate(() => __demo.stats.energy), 100 - 0.45 * 1.5);
  });
  await check(
    "placeholder slots stay placeholders and never pretend to transform Ben",
    async () => {
      await reset();
      await page.keyboard.press("r");
      await page.keyboard.press("1");
      await tick(2);
      assert.equal(await page.evaluate(() => __demo.stats.transformed), false);
      assert.equal(await page.locator("#formName").textContent(), "BEN");
      assert.equal(
        await page.locator("#energyGauge").getAttribute("aria-valuenow"),
        "100",
      );
    },
  );
  await check(
    "the watch opens by pointer and keyboard and the wheel closes normally",
    async () => {
      await reset();
      await page.locator("#watchShortcut").click();
      assert.equal(await page.evaluate(() => __demo.state.wheel), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.evaluate(() => __demo.state.wheel), false);
      await page.locator("#watchShortcut").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => __demo.state.wheel), true);
      await page.keyboard.press("r");
      assert.equal(await page.evaluate(() => __demo.state.wheel), false);
    },
  );
  await check(
    "HUD and touch controls fit portrait and landscape mobile screens",
    async () => {
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 844, height: 390 },
      ]) {
        const mobile = await browser.newPage({
          viewport,
          hasTouch: true,
          isMobile: true,
        });
        mobile.on("pageerror", (e) => errors.push(e.message));
        await mobile.goto("http://127.0.0.1:8777/production");
        await mobile.waitForFunction(() =>
          document.getElementById("toast").textContent.includes("DEMO LISTA"),
        );
        const box = await mobile.locator("#hud").boundingBox();
        assert.ok(
          box.x >= 0 &&
            box.x + box.width <= viewport.width &&
            box.y + box.height < viewport.height / 2,
        );
        assert.equal(await mobile.locator("#touchUI").isVisible(), true);
        assert.equal(
          await mobile.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await mobile.locator("#watchShortcut").tap();
        assert.equal(
          await mobile
            .locator("#wheelLayer")
            .evaluate((el) => el.classList.contains("open")),
          true,
        );
        assert.equal(await mobile.evaluate(() => !!window.__demo), false);
        await mobile.close();
      }
    },
  );
  assert.deepEqual(errors, []);
  console.log(`${count} HUD checks passed; no page errors.`);
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.close();
  });
