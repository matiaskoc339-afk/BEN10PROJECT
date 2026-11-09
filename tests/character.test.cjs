/* The test server exposes closure references only in memory; the delivered HTML
   contains no test hooks. Controls and all simulation/render functions are production code. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const { instrument } = require("./demo-fixture.cjs");
const instrumented = instrument(html);
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(instrumented);
});
let browser,
  count = 0;
async function check(name, test) {
  await test();
  count++;
  console.log("PASS", name);
}
(async () => {
  await new Promise((r) => server.listen(8776, "127.0.0.1", r));
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
    window.requestAnimationFrame = () => 0;
  });
  await page.goto("http://127.0.0.1:8776");
  await page.evaluate(() => __demo.readyPromise);
  const reset = () =>
    page.evaluate(() => {
      __demo.reset();
      __demo.render();
    });
  const tick = (seconds) =>
    page.evaluate((seconds) => __demo.tick(seconds), seconds);
  await check(
    "both embedded atlases load with all 119 complete poses",
    async () => {
      const counts = await page.evaluate(() => [
        __demo.mainAtlas.rows.flat().length,
        __demo.verticalAtlas.rows.flat().length,
      ]);
      assert.deepEqual(counts, [87, 32]);
    },
  );
  await check(
    "whole silhouettes have transparent borders and registered foot pivots",
    async () => {
      const bad = await page.evaluate(() => {
        const bad = [];
        for (const atlas of [__demo.mainAtlas, __demo.verticalAtlas])
          for (const f of atlas.rows.flat()) {
            const a = f.canvas
              .getContext("2d")
              .getImageData(0, 0, f.w, f.h).data;
            let bottom = -1,
              edge = 0,
              opaque = 0;
            for (let y = 0; y < f.h; y++)
              for (let x = 0; x < f.w; x++)
                if (a[(y * f.w + x) * 4 + 3] > 100) {
                  opaque++;
                  bottom = Math.max(bottom, y);
                  if (x === 0 || y === 0 || x === f.w - 1 || y === f.h - 1)
                    edge++;
                }
            if (edge || opaque < 30 || Math.abs(bottom + 1 - f.anchorY) > 1)
              bad.push({
                row: f.row,
                col: f.col,
                edge,
                opaque,
                pivot: f.anchorY,
                bottom,
              });
          }
        return bad;
      });
      assert.deepEqual(bad, []);
    },
  );
  await check(
    "original sprite sheet opaque pixels survive registration without cell clipping",
    async () => {
      const masses = await page.evaluate(() => {
        const atlas = __demo.mainAtlas,
          cv = document.createElement("canvas");
        cv.width = atlas.image.naturalWidth;
        cv.height = atlas.image.naturalHeight;
        const c = cv.getContext("2d");
        c.drawImage(atlas.image, 0, 0);
        const count = (a) => {
          let n = 0;
          for (let i = 3; i < a.length; i += 4) if (a[i] > 100) n++;
          return n;
        };
        return [
          count(c.getImageData(0, 0, cv.width, cv.height).data),
          atlas.rows
            .flat()
            .reduce(
              (n, f) =>
                n +
                count(
                  f.canvas.getContext("2d").getImageData(0, 0, f.w, f.h).data,
                ),
              0,
            ),
        ];
      });
      assert.ok(
        Math.abs(masses[0] - masses[1]) <= masses[0] * 0.002,
        JSON.stringify(masses),
      );
    },
  );
  await check(
    "releasing movement at every gait phase immediately selects the idle guard",
    async () => {
      for (const [key, dir] of [
        ["a", "left"],
        ["d", "right"],
        ["w", "up"],
        ["s", "down"],
      ])
        for (const duration of [0.04, 0.09, 0.15, 0.22, 0.3, 0.4, 0.5, 0.6]) {
          await reset();
          await page.keyboard.down(key);
          await tick(duration);
          await page.keyboard.up(key);
          const state = await page.evaluate(() => ({
            dir: __demo.player.dir,
            moving: __demo.player.moving,
            idle: __demo.framePlayer().idle,
            clock: __demo.player.runClock,
          }));
          assert.deepEqual(state, { dir, moving: false, idle: true, clock: 0 });
        }
    },
  );
  await check(
    "idle guard has continuous movement while its feet stay planted",
    async () => {
      for (const key of ["a", "d", "w", "s"]) {
        await reset();
        await page.keyboard.down(key);
        await tick(0.03);
        await page.keyboard.up(key);
        const frames = await page.evaluate(() => {
          const frames = [];
          for (const delta of [0, 0.25, 0.35, 0.4]) {
            __demo.tick(delta);
            const cv = document.createElement("canvas");
            cv.width = cv.height = 260;
            __demo.paintPlayerSprite(
              cv.getContext("2d"),
              __demo.framePlayer(),
              130,
              220,
            );
            const a = cv.getContext("2d").getImageData(0, 0, 260, 260).data;
            let bottom = 0;
            for (let y = 0; y < 260; y++)
              for (let x = 0; x < 260; x++)
                if (a[(y * 260 + x) * 4 + 3] > 100)
                  bottom = Math.max(bottom, y);
            frames.push({ image: cv.toDataURL(), bottom });
          }
          return frames;
        });
        assert.ok(new Set(frames.map((f) => f.image)).size > 1, key);
        assert.ok(
          Math.max(...frames.map((f) => f.bottom)) -
            Math.min(...frames.map((f) => f.bottom)) <=
            1,
          key,
        );
      }
    },
  );
  await check(
    "left-facing attacks ignore a stale cursor on the right and hit only the left dummy",
    async () => {
      await reset();
      await page.mouse.move(1120, 250);
      await page.keyboard.down("a");
      await tick(0.08);
      await page.keyboard.up("a");
      await page.evaluate(() => {
        const p = __demo.player;
        __demo.dummies.push(
          { x: p.x - 70, y: p.y, health: 100, alive: true },
          { x: p.x + 70, y: p.y, health: 100, alive: true },
        );
      });
      await page.mouse.click(1120, 250);
      await tick(0.15);
      const state = await page.evaluate(() => ({
        dir: __demo.player.actionDir,
        flip: __demo.framePlayer().flip,
        hp: __demo.dummies.map((d) => d.health),
      }));
      assert.equal(state.dir, "left");
      assert.equal(state.flip, true);
      assert.deepEqual(state.hp, [83, 100]);
    },
  );
  await check(
    "combat bodies mirror around their pivot while the watch stays on the left arm",
    async () => {
      const difference = await page.evaluate(() => {
        const frame = {
          atlas: __demo.mainAtlas,
          row: 4,
          frame: 2,
          idle: false,
        };
        const render = (flip) => {
          const cv = document.createElement("canvas");
          cv.width = 320;
          cv.height = 260;
          __demo.paintPlayerSprite(
            cv.getContext("2d"),
            { ...frame, flip },
            160,
            220,
          );
          return cv.getContext("2d").getImageData(0, 0, 320, 260).data;
        };
        const a = render(false),
          b = render(true);
        let difference = 0;
        const sprite = __demo.mainAtlas.rows[4][2];
        for (let y = 0; y < 260; y++)
          for (let x = 0; x < 320; x++) {
            if (
              sprite.watch.some(
                (w) =>
                  Math.abs(x - (160 + (w.x - sprite.anchorX) * 2)) <= 11 &&
                  Math.abs(y - (220 + (w.y - sprite.anchorY) * 2)) <= 11,
              )
            )
              continue;
            for (let ch = 0; ch < 4; ch++)
              if (a[(y * 320 + x) * 4 + ch] !== b[(y * 320 + 319 - x) * 4 + ch])
                difference++;
          }
        return difference;
      });
      assert.equal(difference, 0);
    },
  );
  for (const [key, dir, vector] of [
    ["d", "right", [1, 0]],
    ["a", "left", [-1, 0]],
    ["w", "up", [0, -1]],
    ["s", "down", [0, 1]],
  ]) {
    await check(
      "light and heavy strikes follow " +
        dir +
        " with matching pose orientation",
      async () => {
        for (const heavy of [false, true]) {
          await reset();
          await page.keyboard.down(key);
          await tick(0.03);
          await page.keyboard.up(key);
          await page.evaluate(([fx, fy]) => {
            const p = __demo.player;
            __demo.dummies.push(
              { x: p.x + fx * 75, y: p.y + fy * 75, health: 100, alive: true },
              { x: p.x - fx * 75, y: p.y - fy * 75, health: 100, alive: true },
            );
          }, vector);
          await page.mouse.click(1100, 150, {
            button: heavy ? "right" : "left",
          });
          await tick(heavy ? 0.64 : 0.15);
          const result = await page.evaluate(() => {
            const f = __demo.framePlayer();
            return {
              dir: __demo.player.actionDir,
              hp: __demo.dummies.map((d) => d.health),
              vertical: f.atlas === __demo.verticalAtlas,
              row: f.row,
            };
          });
          assert.equal(result.dir, dir);
          assert.deepEqual(result.hp, heavy ? [55, 100] : [83, 100]);
          assert.equal(result.vertical, dir === "up" || dir === "down");
          if (result.vertical)
            assert.equal(
              result.row,
              (heavy ? 2 : 0) + (dir === "down" ? 1 : 0),
            );
        }
      },
    );
  }
  await check(
    "movement during a strike cannot turn its pose or damage direction mid-animation",
    async () => {
      await reset();
      await page.keyboard.down("d");
      await tick(0.03);
      await page.keyboard.up("d");
      await page.evaluate(() => {
        const p = __demo.player;
        __demo.dummies.push(
          { x: p.x + 70, y: p.y, health: 100, alive: true },
          { x: p.x - 70, y: p.y, health: 100, alive: true },
        );
      });
      await page.mouse.click(1000, 200);
      await page.keyboard.down("a");
      await tick(0.16);
      assert.deepEqual(
        await page.evaluate(() => [
          __demo.player.dir,
          __demo.player.actionDir,
          ...__demo.dummies.map((d) => d.health),
        ]),
        ["right", "right", 83, 100],
      );
      await tick(0.2);
      assert.equal(await page.evaluate(() => __demo.player.dir), "left");
      await page.keyboard.up("a");
    },
  );
  await check(
    "damage occurs once when the contact drawing is reached, never in windup",
    async () => {
      for (const key of ["a", "d", "w", "s"])
        for (const heavy of [false, true]) {
          await reset();
          await page.keyboard.down(key);
          await tick(0.03);
          await page.keyboard.up(key);
          const timing = await page.evaluate((heavy) => {
            const p = __demo.player;
            __demo.dummies.push({
              x: p.x + p.faceX * 75,
              y: p.y + p.faceY * 75,
              health: 100,
              alive: true,
            });
            (heavy ? __demo.heavyAttack : __demo.lightAttack)();
            const vertical = p.dir === "up" || p.dir === "down";
            return (
              p.modeDur *
              (heavy ? (vertical ? 5 / 8 : 3 / 6) : vertical ? 3 / 8 : 2 / 4)
            );
          }, heavy);
          await tick(timing - 0.015);
          assert.equal(
            await page.evaluate(() => __demo.dummies[0].health),
            100,
            key,
          );
          await tick(0.03);
          const hp = await page.evaluate(() => __demo.dummies[0].health);
          assert.equal(hp, heavy ? 55 : 83, key);
          await tick(0.04);
          assert.equal(
            await page.evaluate(() => __demo.dummies[0].health),
            hp,
            key,
          );
        }
    },
  );
  await check(
    "standing attacks finish once and return to guard without requiring a movement key",
    async () => {
      await reset();
      await page.mouse.click(1000, 200);
      await tick(0.03);
      assert.equal(await page.evaluate(() => __demo.player.mode), "light1");
      await tick(0.4);
      assert.equal(await page.evaluate(() => __demo.framePlayer().idle), true);
    },
  );
  await check(
    "a dodge cancels the pending hit and ends back in a planted idle guard",
    async () => {
      await reset();
      await page.evaluate(() => {
        const p = __demo.player;
        __demo.dummies.push({ x: p.x, y: p.y + 75, health: 100, alive: true });
      });
      await page.mouse.click(1000, 200);
      await page.keyboard.press("Space");
      await tick(0.46);
      assert.equal(await page.evaluate(() => __demo.dummies[0].health), 100);
      assert.equal(await page.evaluate(() => __demo.framePlayer().idle), true);
    },
  );
  await check(
    "blocked movement uses guard instead of running in place",
    async () => {
      await reset();
      await page.evaluate(() => {
        __demo.player.x = 120;
      });
      await page.keyboard.down("a");
      await tick(0.3);
      assert.equal(await page.evaluate(() => __demo.framePlayer().idle), true);
      await page.keyboard.up("a");
    },
  );
  await check(
    "Omnitrix still pauses and resumes with its ten placeholder slots",
    async () => {
      await reset();
      await page.keyboard.press("r");
      const before = await page.evaluate(() => __demo.time);
      await tick(0.5);
      assert.equal(await page.evaluate(() => __demo.time), before);
      await page.keyboard.press("1");
      assert.equal(await page.evaluate(() => __demo.player.selectedAlien), 0);
      await tick(1.2);
      assert.equal(await page.evaluate(() => __demo.framePlayer().idle), true);
    },
  );
  await check(
    "dash held during running travels farther in all four directions",
    async () => {
      for (const [key, axis, sign] of [
        ["d", "x", 1],
        ["a", "x", -1],
        ["w", "y", -1],
        ["s", "y", 1],
      ]) {
        await reset();
        await page.keyboard.down(key);
        const beforeRun = await page.evaluate(
          (axis) => __demo.player[axis],
          axis,
        );
        await tick(0.4);
        const run =
          sign *
          ((await page.evaluate((axis) => __demo.player[axis], axis)) -
            beforeRun);
        await page.keyboard.up(key);
        await reset();
        await page.keyboard.down(key);
        await tick(0.04);
        await page.keyboard.press("Space");
        const before = await page.evaluate((axis) => __demo.player[axis], axis);
        await tick(0.4);
        const dash =
          sign *
          ((await page.evaluate((axis) => __demo.player[axis], axis)) - before);
        await page.keyboard.up(key);
        assert.ok(
          dash > run * 1.7 && dash < run * 1.9,
          JSON.stringify({ key, run, dash }),
        );
        assert.ok(Math.abs(dash - 176) < 0.2);
      }
    },
  );
  await check(
    "diagonal dash follows movement without gaining extra distance",
    async () => {
      for (const [a, b, sx, sy] of [
        ["d", "s", 1, 1],
        ["a", "s", -1, 1],
        ["d", "w", 1, -1],
        ["a", "w", -1, -1],
      ]) {
        await reset();
        await page.keyboard.down(a);
        await page.keyboard.down(b);
        await page.keyboard.press("Space");
        const start = await page.evaluate(() => [
          __demo.player.x,
          __demo.player.y,
        ]);
        await tick(0.4);
        const end = await page.evaluate(() => [
          __demo.player.x,
          __demo.player.y,
        ]);
        const dx = end[0] - start[0],
          dy = end[1] - start[1];
        assert.ok(Math.abs(Math.hypot(dx, dy) - 176) < 0.2);
        assert.ok(dx * sx > 0 && dy * sy > 0);
        assert.ok(Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.01);
        await page.keyboard.up(a);
        await page.keyboard.up(b);
      }
    },
  );
  await check(
    "dash distance is stable at 30, 60 and 120 simulation steps per second",
    async () => {
      for (const fps of [30, 60, 120]) {
        await reset();
        const distance = await page.evaluate((fps) => {
          __demo.player.dir = "right";
          __demo.player.faceX = 1;
          __demo.player.faceY = 0;
          const x = __demo.player.x;
          __demo.dodge();
          for (let i = 0; i < fps * 0.4; i++) __demo.update(1 / fps);
          return __demo.player.x - x;
        }, fps);
        assert.ok(
          Math.abs(distance - 176) < 0.2,
          JSON.stringify({ fps, distance }),
        );
      }
    },
  );
  await check(
    "dash locks its travel direction and eases out rather than turning mid-roll",
    async () => {
      await reset();
      await page.keyboard.down("d");
      await page.keyboard.press("Space");
      const start = await page.evaluate(() => __demo.player.x);
      await tick(0.1);
      const first = await page.evaluate(() => __demo.player.x);
      await page.keyboard.up("d");
      await page.keyboard.down("a");
      await tick(0.2);
      const beforeLast = await page.evaluate(() => __demo.player.x);
      await tick(0.1);
      const last = await page.evaluate(() => __demo.player.x);
      assert.ok(first - start > last - beforeLast);
      assert.ok(last > beforeLast);
      await page.keyboard.up("a");
    },
  );
  await check(
    "longer dash respects solid props and world boundaries",
    async () => {
      for (const wall of [false, true]) {
        await reset();
        const result = await page.evaluate((wall) => {
          const p = __demo.player;
          p.dir = "left";
          p.faceX = -1;
          p.faceY = 0;
          if (wall) p.x = 170;
          else __demo.props.push({ x: p.x - 95, y: p.y, r: 19, block: true });
          const start = p.x;
          __demo.dodge();
          __demo.tick(0.4);
          return { start, x: p.x };
        }, wall);
        assert.ok(result.x >= 120);
        assert.ok(wall || result.x >= result.start - 57);
      }
    },
  );
  await check(
    "dash cooldown still prevents chaining without a recovery",
    async () => {
      await reset();
      await page.keyboard.press("Space");
      await tick(0.4);
      await page.keyboard.press("Space");
      assert.equal(await page.evaluate(() => __demo.player.mode), "idle");
      await tick(0.31);
      await page.keyboard.press("Space");
      assert.equal(await page.evaluate(() => __demo.player.mode), "dash");
    },
  );
  await check(
    "visible cuffs remain at the hand end of every registered forearm",
    async () => {
      const bad = await page.evaluate(() => {
        const bad = [];
        for (const atlas of [__demo.mainAtlas, __demo.verticalAtlas])
          for (const f of atlas.rows.flat())
            for (const [hand, w] of f.watch.entries()) {
              if (w.hidden) continue;
              const toPalm = Math.hypot(w.x - w.palm.x, w.y - w.palm.y),
                toElbow = Math.hypot(w.x - w.elbow.x, w.y - w.elbow.y);
              if (
                !Number.isFinite(toPalm) ||
                toPalm > w.offset + 0.75 ||
                toPalm > toElbow + 0.5 ||
                w.view < 0 ||
                w.view > 3 ||
                w.turn < 0 ||
                w.turn > 7
              )
                bad.push({ row: f.row, col: f.col, hand, w, toPalm, toElbow });
            }
        return bad;
      });
      assert.deepEqual(bad, []);
    },
  );
  await check(
    "regression poses put the cuff by the hand, clear of the former elbow and face positions",
    async () => {
      const points = await page.evaluate(() =>
        [
          ["main", 7, 3, [31, 32, 35, 36]],
          ["main", 13, 4, [18, 8, 21, 12]],
          ["main", 13, 5, [25, 18, 29, 23]],
          ["main", 6, 1, [24, 22, 28, 26]],
          ["vertical", 2, 6, [4, 26, 8, 30]],
        ].map(([kind, r, col, box]) => {
          const w = (kind === "main" ? __demo.mainAtlas : __demo.verticalAtlas)
            .rows[r][col].watch[0];
          return { kind, r, col, w, box };
        }),
      );
      for (const {
        kind,
        r,
        col,
        w,
        box: [left, top, right, bottom],
      } of points)
        assert.ok(
          w.x >= left && w.x <= right && w.y >= top && w.y <= bottom,
          JSON.stringify({ kind, r, col, w }),
        );
    },
  );
  await check(
    "visible cuff landmarks meet their hand silhouette instead of empty space",
    async () => {
      const bad = await page.evaluate(() => {
        const bad = [];
        for (const atlas of [__demo.mainAtlas, __demo.verticalAtlas])
          for (const f of atlas.rows.flat())
            for (const [hand, w] of f.watch.entries()) {
              if (w.hidden) continue;
              const a = f.canvas
                .getContext("2d")
                .getImageData(0, 0, f.w, f.h).data;
              let touches = false;
              for (
                let y = Math.max(0, w.palm.y - 2);
                y <= Math.min(f.h - 1, w.palm.y + 2);
                y++
              )
                for (
                  let x = Math.max(0, w.palm.x - 2);
                  x <= Math.min(f.w - 1, w.palm.x + 2);
                  x++
                )
                  if (a[(y * f.w + x) * 4 + 3] > 128) touches = true;
              if (!touches) bad.push({ row: f.row, col: f.col, hand, w });
            }
        return bad;
      });
      assert.deepEqual(bad, []);
    },
  );
  await check(
    "all perspective and rotation tiles have complete crisp pixels with no clipped border",
    async () => {
      const bad = await page.evaluate(() => {
        const cv = document.createElement("canvas");
        cv.width = 88;
        cv.height = 44;
        const c = cv.getContext("2d");
        c.drawImage(__demo.watchIcon, 0, 0);
        const bad = [];
        for (let view = 0; view < 4; view++)
          for (let turn = 0; turn < 8; turn++) {
            const a = c.getImageData(turn * 11, view * 11, 11, 11).data;
            let opaque = 0,
              green = 0,
              edge = 0,
              soft = 0;
            for (let y = 0; y < 11; y++)
              for (let x = 0; x < 11; x++) {
                const i = (y * 11 + x) * 4;
                if (a[i + 3]) {
                  opaque++;
                  if (a[i + 3] !== 255) soft++;
                  if (x === 0 || y === 0 || x === 10 || y === 10) edge++;
                  if (
                    a[i + 1] > 150 &&
                    a[i + 1] > a[i] * 1.2 &&
                    a[i + 1] > a[i + 2] * 1.4
                  )
                    green++;
                }
              }
            if (
              opaque < 4 ||
              edge ||
              soft ||
              (view === 3 ? green !== 0 : green < 1)
            )
              bad.push({ view, turn, opaque, edge, soft, green });
          }
        return bad;
      });
      assert.deepEqual(bad, []);
    },
  );
  await check(
    "hidden wrists are occluded while back views show the strap instead of a front dial",
    async () => {
      const result = await page.evaluate(() => {
        let hidden = 0,
          back = 0,
          wrong = 0;
        for (const atlas of [__demo.mainAtlas, __demo.verticalAtlas])
          for (const f of atlas.rows.flat())
            for (const flip of [false, true]) {
              const w = f.watch[flip ? 1 : 0],
                cv = document.createElement("canvas");
              cv.width = cv.height = 200;
              const c = cv.getContext("2d");
              __demo.paintOmnitrix(
                c,
                f,
                { flip, idle: false },
                80 - w.x * 2,
                80 - w.y * 2,
                2,
                0,
                0,
              );
              const a = c.getImageData(0, 0, 200, 200).data;
              let opaque = 0,
                green = 0;
              for (let i = 0; i < a.length; i += 4)
                if (a[i + 3] > 128) {
                  opaque++;
                  if (
                    a[i + 1] > 150 &&
                    a[i + 1] > a[i] * 1.2 &&
                    a[i + 1] > a[i + 2] * 1.4
                  )
                    green++;
                }
              if (w.hidden) {
                hidden++;
                if (opaque) wrong++;
              } else if (w.view === 3) {
                back++;
                if (!opaque || green) wrong++;
              }
            }
        return { hidden, back, wrong };
      });
      assert.ok(result.hidden > 0);
      assert.ok(result.back > 0);
      assert.equal(result.wrong, 0);
    },
  );

  assert.deepEqual(errors, []);
  console.log(`${count} demo checks passed; no page errors.`);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.close();
  });
