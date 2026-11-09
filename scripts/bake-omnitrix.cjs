/* Compile the approved classic design into native-size equipment views.
   The standalone demo embeds the result and needs no external asset requests. */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "assets/omnitrix-classic-source.png");
const atlasPath = path.join(projectRoot, "assets/omnitrix-classic-atlas.png");
const demoPath = path.join(projectRoot, "index.html");

// Source rectangles retain the face, gray side armor and green side button.
// The long strap tips are omitted where the fitted cuff meets Ben's wrist.
const views = [
  { crop: [141, 183, 350, 343], size: [7, 7] },
  { crop: [727, 125, 435, 420], size: [7, 7] },
  { crop: [201, 825, 224, 230], size: [4, 5] },
  { crop: [743, 745, 342, 390], size: [4, 5] },
];

(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (fs.existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const base64 = await page.evaluate(
      async ({ image, views }) => {
        const source = new Image();
        source.src = "data:image/png;base64," + image;
        await source.decode();
        const atlas = document.createElement("canvas");
        atlas.width = 88;
        atlas.height = 44;
        const ctx = atlas.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        for (const [
          view,
          {
            crop,
            size: [w, h],
          },
        ] of views.entries()) {
          const icon = document.createElement("canvas");
          icon.width = w;
          icon.height = h;
          const c = icon.getContext("2d");
          c.imageSmoothingEnabled = false;
          c.drawImage(source, ...crop, 0, 0, w, h);
          for (let turn = 0; turn < 8; turn++) {
            ctx.save();
            ctx.translate(turn * 11 + 5.5, view * 11 + 5.5);
            ctx.rotate((turn * Math.PI) / 4);
            ctx.drawImage(icon, -w / 2, -h / 2);
            ctx.restore();
          }
        }
        const pixels = ctx.getImageData(0, 0, 88, 44);
        for (let i = 3; i < pixels.data.length; i += 4) {
          pixels.data[i] = pixels.data[i] > 120 ? 255 : 0;
        }
        ctx.putImageData(pixels, 0, 0);
        return atlas.toDataURL("image/png").split(",")[1];
      },
      { image: fs.readFileSync(source).toString("base64"), views },
    );

    fs.writeFileSync(atlasPath, Buffer.from(base64, "base64"));
    const html = fs.readFileSync(demoPath, "utf8");
    const pattern =
      /const watchSheet=new Image\(\);watchSheet\.src='data:image\/png;base64,[A-Za-z0-9+/=]+';/g;
    if ([...html.matchAll(pattern)].length !== 1) {
      throw new Error("Expected exactly one embedded Omnitrix atlas");
    }
    fs.writeFileSync(
      demoPath,
      html.replace(
        pattern,
        "const watchSheet=new Image();watchSheet.src='data:image/png;base64," +
          base64 +
          "';",
      ),
    );
    console.log(
      "Classic Omnitrix compiled and embedded:",
      fs.statSync(atlasPath).size,
      "bytes",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
