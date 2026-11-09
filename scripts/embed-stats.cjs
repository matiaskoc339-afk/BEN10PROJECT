const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const file = path.join(root, "index.html");
const begin = "<!-- PLAYER_STATS_START -->";
const end = "<!-- PLAYER_STATS_END -->";
const source = fs.readFileSync(
  path.join(root, "systems/player-stats.js"),
  "utf8",
);
const embedded = begin + "\n<script>\n" + source + "\n</script>\n" + end;
const html = fs.readFileSync(file, "utf8");
const pattern = /<!-- PLAYER_STATS_START -->[\s\S]*?<!-- PLAYER_STATS_END -->/;
if (!pattern.test(html)) throw new Error("Missing stats embedding markers");
fs.writeFileSync(
  file,
  html.replace(pattern, () => embedded),
);
console.log("Player stats embedded in the standalone demo.");
