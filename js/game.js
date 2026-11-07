"use strict";
(function (B) {
  const SAVE_KEY = "b10-fracturado-v1",
    SETTINGS_KEY = "b10-fracturado-settings";
  B.Save = {
    read() {
      try {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (
          !s ||
          s.version !== 1 ||
          !["city", "market", "fort", "throne", "escape"].includes(s.zone)
        )
          return null;
        const clean = B.fresh();
        for (const k of [
          "xp",
          "points",
          "spent",
          "hpBonus",
          "energyBonus",
          "kills",
          "playTime",
        ])
          if (Number.isFinite(s[k]) && s[k] >= 0)
            clean[k] = Math.min(s[k], 1000000);
        clean.history = Array.isArray(s.history)
          ? s.history
              .filter(
                (l) => typeof l.who === "string" && typeof l.text === "string",
              )
              .slice(-100)
          : [];
        clean.zone = s.zone;
        clean.checkpoint = s.zone;
        clean.completed = !!s.completed;
        clean.unlocked = [
          "heat",
          "four",
          ...(Array.isArray(s.unlocked) && s.unlocked.includes("diamond")
            ? ["diamond"]
            : []),
        ];
        clean.flags =
          s.flags && typeof s.flags === "object" && !Array.isArray(s.flags)
            ? s.flags
            : {};
        clean.items = Array.isArray(s.items)
          ? s.items.filter((x) => typeof x === "string")
          : [];
        for (const id of clean.unlocked)
          clean.skills[id] = Array.isArray(s.skills?.[id])
            ? [
                ...new Set(
                  s.skills[id].filter(
                    (n) => Number.isInteger(n) && n >= 0 && n < 6,
                  ),
                ),
              ]
            : [];
        if (Array.isArray(s.favorites) && s.favorites.length === 3)
          clean.favorites = s.favorites.map((id) =>
            clean.unlocked.includes(id) ? id : null,
          );
        return clean;
      } catch {
        return null;
      }
    },
    write(save) {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
        return true;
      } catch {
        return false;
      }
    },
  };
  class Input {
    constructor(g) {
      this.g = g;
      this.keys = new Set();
      this.mouse = { x: window.innerWidth * 0.65, y: window.innerHeight * 0.5 };
      window.addEventListener("keydown", (e) => {
        if (g.rebinding) {
          e.preventDefault();
          if (["Digit1", "Digit2", "Digit3"].includes(e.code)) {
            g.ui.toast("1, 2 y 3 están reservadas para favoritos");
            return;
          }
          const key = g.rebinding.key,
            other = Object.keys(g.bindings).find(
              (k) => k !== key && g.bindings[k] === e.code,
            );
          if (other) g.bindings[other] = g.bindings[key];
          g.bindings[key] = e.code;
          g.settings.bindings = { ...g.bindings };
          g.storeSettings();
          g.rebinding = null;
          g.ui.panel("controls");
          return;
        }
        if (
          Object.values(g.bindings).includes(e.code) ||
          ["Digit1", "Digit2", "Digit3", "Enter"].includes(e.code)
        )
          e.preventDefault();
        this.keys.add(e.code);
        if (e.repeat) return;
        const action = Object.keys(g.bindings).find(
          (k) => g.bindings[k] === e.code,
        );
        g.action(action, e.code);
      });
      window.addEventListener("keyup", (e) => {
        this.keys.delete(e.code);
        if (e.code === g.bindings.wheel) g.ui.closeWheel();
      });
      window.addEventListener("mousemove", (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (g.mode === "wheel") g.ui.wheelMove(e.clientX, e.clientY);
      });
      g.canvas.addEventListener("mousedown", (e) => {
        g.audio.init();
        if (g.mode === "play") B.attack(g, e.button === 2 ? "K" : "J");
      });
      g.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      window.addEventListener("blur", () => {
        this.clear();
        if (g.mode === "play" || g.mode === "wheel") {
          g.ui.closeWheel(false);
          g.ui.panel("pause");
        }
      });
    }
    held(action) {
      return this.keys.has(this.g.bindings[action]);
    }
    clear() {
      this.keys.clear();
    }
  }
  class Game {
    constructor() {
      this.canvas = B.$("game");
      this.view = { w: innerWidth, h: innerHeight, dpr: 1 };
      this.settings = {
        volume: 0.3,
        muted: false,
        typewriter: true,
        shake: true,
        difficulty: "normal",
      };
      try {
        Object.assign(
          this.settings,
          JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {},
        );
      } catch {}
      this.bindings = { ...B.defaults };
      if (
        this.settings.bindings &&
        Object.keys(B.defaults).every(
          (k) => typeof this.settings.bindings[k] === "string",
        )
      )
        this.bindings = { ...this.settings.bindings };
      this.audio = new B.AudioSystem();
      this.audio.volume = B.clamp(Number(this.settings.volume) || 0, 0, 1);
      this.audio.muted = !!this.settings.muted;
      this.save = B.fresh();
      this.player = B.makePlayer();
      this.world = B.createWorld("city", this.save);
      this.camera = { x: 300, y: 550, zoom: 1 };
      this.mode = "menu";
      this.clock = 0;
      this.sceneAge = 0;
      this.shake = 0;
      this.flash = 0;
      this.hitstop = 0;
      this.transition = 0;
      this.particles = [];
      this.texts = [];
      this.cine = {};
      this.buffer = null;
      this.defer = 0;
      this.pending = null;
      this.ui = new B.UI(this);
      this.input = new Input(this);
      this.renderer = new B.Renderer(this);
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.ui.menu();
      B.$("sound").textContent = this.audio.muted ? "♪̸" : "♪";
      this.last = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
    resize() {
      this.view = {
        w: innerWidth,
        h: innerHeight,
        dpr: Math.min(devicePixelRatio || 1, 2),
      };
      this.canvas.width = Math.floor(this.view.w * this.view.dpr);
      this.canvas.height = Math.floor(this.view.h * this.view.dpr);
      this.camera.zoom = Math.min(1.15, Math.max(0.7, this.view.w / 1400));
    }
    keyLabel(action) {
      const key = this.bindings[action] || "";
      return (
        {
          Space: "ESPACIO",
          ShiftLeft: "SHIFT",
          ShiftRight: "SHIFT",
          Escape: "ESC",
          Tab: "TAB",
          ArrowUp: "↑",
          ArrowDown: "↓",
          ArrowLeft: "←",
          ArrowRight: "→",
        }[key] || key.replace("Key", "").replace("Digit", "")
      );
    }
    hasSave() {
      return !!B.Save.read();
    }
    has(id, index) {
      return this.save.skills[id]?.includes(index) || false;
    }
    storeSettings() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch {
        this.ui.toast("El navegador no permite guardar los ajustes");
      }
    }
    persist() {
      if (this.world.zone === "intro") return;
      this.save.zone = this.world.zone;
      this.save.checkpoint = this.world.zone;
      this.save.history = this.ui.history.slice(-100);
      if (!B.Save.write(this.save))
        this.ui.toast(
          "Almacenamiento no disponible · la partida solo se conserva en esta sesión",
        );
    }
    newGame() {
      this.save = B.fresh();
      this.player = B.makePlayer();
      this.ui.history = [];
      this.cine = {};
      this.particles = [];
      this.texts = [];
      this.pending = null;
      this.world = B.createWorld("intro", this.save);
      this.camera.x = 710;
      this.camera.y = 470;
      this.player.x = 695;
      this.player.y = 500;
      this.ui.play();
      this.ui.scene("intro", () => {
        B.loadZone(this, "city", false);
        this.ui.scene("arrival");
      });
    }
    continueGame(showToast = true) {
      const data = B.Save.read();
      if (!data) {
        this.newGame();
        return;
      }
      this.save = data;
      this.ui.history = data.history || [];
      this.player = B.makePlayer();
      this.player.maxHp = 120 + data.hpBonus;
      this.player.maxEnergy = 100 + data.energyBonus;
      this.particles = [];
      this.texts = [];
      this.pending = null;
      this.defer = 0;
      this.ui.dialogue = null;
      B.$("dialogue").hidden = true;
      this.mode = "play";
      this.ui.play();
      B.loadZone(this, data.zone, false);
      this.ui.refreshFavorites();
      if (showToast)
        this.ui.toast("Partida recuperada · " + B.zoneNames[data.zone]);
      if (data.zone === "throne" && data.flags.king) {
        if (!data.unlocked.includes("diamond")) this.cineAction("unlock");
        B.loadZone(this, "escape", false);
      }
    }
    toMenu() {
      this.mode = "menu";
      this.input.clear();
      this.ui.dialogue = null;
      this.ui.menu();
    }
    action(action, code) {
      this.audio.init();
      if (this.mode === "dialogue") {
        if (action === "interact" || code === "Enter" || action === "light")
          this.ui.advance();
        else if (action === "pause") this.ui.panel("pause");
        return;
      }
      if (this.mode === "panel") {
        if (action === "pause" && this.ui.panelType !== "death")
          this.ui.closePanel();
        return;
      }
      if (this.mode === "menu" || this.mode === "complete") return;
      if (action === "pause") {
        this.ui.panel("pause");
        return;
      }
      if (this.mode === "wheel") return;
      if (action === "wheel") {
        this.ui.openWheel();
        return;
      }
      if (action === "skills") {
        this.ui.panel("skills", this.player.form);
        return;
      }
      if (action === "light") B.attack(this, "J");
      if (action === "heavy") B.attack(this, "K");
      if (action === "dodge") B.dodge(this);
      if (action === "special") B.special(this);
      if (action === "cancel") B.revert(this);
      if (action === "interact") B.interact(this);
      if (/^Digit[123]$/.test(code)) {
        const id = this.save.favorites[+code.slice(-1) - 1];
        if (id) B.transform(this, id);
        else this.ui.toast("Favorito vacío · configúralo en el menú de pausa");
      }
    }
    cineAction(action) {
      const p = this.player;
      if (action === "extract") {
        this.cine.extract = true;
        this.audio.play("boss");
      }
      if (action === "fracture") {
        this.cine.fractured = true;
        this.flash = 1;
        this.shake = 17;
        this.burst(695, 465, "#baff82", 80);
        this.audio.play("empty");
      }
      if (action === "brawl") this.cine.brawl = true;
      if (action === "escape") this.cine.escaped = true;
      if (action === "four") {
        B.transform(this, "four");
        this.persist();
      }
      if (action === "dna") {
        this.burst(p.x, p.y, "#b1ff82", 70);
        this.flash = 0.8;
        this.audio.play("dna");
      }
      if (action === "unlock") {
        if (!this.save.unlocked.includes("diamond")) {
          this.save.unlocked.push("diamond");
          this.save.favorites[2] = "diamond";
          this.save.points += 2;
          this.ui.refreshFavorites();
          this.persist();
        }
        this.ui.unlockTime = 6;
        B.$("unlock-banner").hidden = false;
        this.audio.play("unlock");
        this.ui.toast("DIAMANTE DESBLOQUEADO · ADN RESTAURADO · +2 PUNTOS");
        this.burst(p.x, p.y, "#a7f3d8", 65);
      }
    }
    addXP(amount) {
      const old = Math.floor(this.save.xp / 100);
      this.save.xp += amount;
      const gain = Math.floor(this.save.xp / 100) - old;
      if (gain > 0) {
        this.save.points += gain;
        this.ui.toast("EVOLUCIÓN · +" + gain + " punto de habilidad · TAB");
      }
    }
    shoot(x, y, angle, speed, damage, kind, team, r, life) {
      this.world.shots.push({
        x: x + Math.cos(angle) * 25,
        y: y + Math.sin(angle) * 25,
        angle,
        speed,
        damage,
        kind,
        team,
        r,
        life,
        touched: new Set(),
      });
    }
    field(x, y, r, life, kind, damage) {
      this.world.fields.push({
        x,
        y,
        r,
        life,
        max: life,
        kind,
        damage,
        tick: 0.1,
      });
    }
    burst(x, y, color, n) {
      for (let j = 0; j < n; j++) {
        const a = Math.random() * B.TAU,
          s = 30 + Math.random() * 130;
        const life = 0.25 + Math.random() * 0.55;
        this.particles.push({
          x,
          y: y - 20,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          color,
          life,
          max: life,
          size: 1 + Math.random() * 3,
        });
      }
      if (this.particles.length > 700)
        this.particles.splice(0, this.particles.length - 700);
    }
    floatText(x, y, text, color) {
      this.texts.push({ x, y, text, color, life: 0.8 });
    }
    screenToWorld(x, y) {
      return {
        x: (x - this.view.w / 2) / this.camera.zoom + this.camera.x,
        y: (y - this.view.h / 2) / this.camera.zoom + this.camera.y,
      };
    }
    defeat() {
      this.audio.play("empty");
      this.ui.panel("death");
    }
    complete() {
      this.save.completed = true;
      this.persist();
      this.mode = "complete";
      B.$("hud").hidden = true;
      B.$("end-screen").hidden = false;
      B.$("end-stats").textContent =
        this.save.kills +
        " ENEMIGOS · " +
        this.save.items.length +
        " SECRETOS · " +
        Math.floor(this.save.playTime / 60) +
        " MIN DE AVENTURA";
      this.audio.play("unlock");
    }
    update(dt) {
      this.clock += dt;
      this.ui.update(dt);
      this.sceneAge += dt;
      this.flash = Math.max(0, this.flash - dt * 1.6);
      this.transition = Math.max(0, this.transition - dt * 1.4);
      this.shake = this.settings.shake ? Math.max(0, this.shake - dt * 28) : 0;
      if (
        this.mode === "menu" ||
        this.mode === "panel" ||
        this.mode === "complete"
      )
        return;
      if (this.mode === "dialogue") {
        for (const a of this.particles) {
          a.life -= dt;
          a.x += a.vx * dt;
          a.y += a.vy * dt;
        }
        this.particles = this.particles.filter((a) => a.life > 0);
        const target =
          this.world.zone === "intro"
            ? {
                x: this.cine.escaped ? 570 : 710,
                y: this.cine.escaped ? 550 : 470,
              }
            : this.player;
        const mx = Math.min(
            this.world.w / 2,
            this.view.w / this.camera.zoom / 2,
          ),
          my = Math.min(this.world.h / 2, this.view.h / this.camera.zoom / 2);
        this.camera.x +=
          (B.clamp(target.x, mx, this.world.w - mx) - this.camera.x) *
          Math.min(1, dt * 1.2);
        this.camera.y +=
          (B.clamp(target.y, my, this.world.h - my) - this.camera.y) *
          Math.min(1, dt * 1.2);
        return;
      }
      const slow = this.mode === "wheel" ? 0.06 : 1;
      dt *= slow;
      this.save.playTime += dt;
      if (this.hitstop > 0) {
        this.hitstop -= dt;
        return;
      }
      if (this.defer > 0) {
        this.defer -= dt;
        if (this.defer <= 0 && this.pending) {
          const fn = this.pending;
          this.pending = null;
          fn();
          return;
        }
      }
      B.updatePlayer(this, dt);
      if (this.mode === "panel") return;
      B.updateEnemies(this, dt);
      if (this.mode === "panel") return;
      B.updateEffects(this, dt);
      if (this.mode === "panel") return;
      B.updateWorld(this, dt);
      const p = this.player;
      const marginX = Math.min(
          this.world.w / 2,
          this.view.w / this.camera.zoom / 2,
        ),
        marginY = Math.min(
          this.world.h / 2,
          this.view.h / this.camera.zoom / 2,
        );
      const tx = B.clamp(p.x, marginX, this.world.w - marginX),
        ty = B.clamp(p.y, marginY, this.world.h - marginY);
      this.camera.x += (tx - this.camera.x) * Math.min(1, dt * 7);
      this.camera.y += (ty - this.camera.y) * Math.min(1, dt * 7);
    }
    frame(t) {
      const dt = Math.min(0.04, Math.max(0, (t - this.last) / 1000));
      this.last = t;
      this.update(dt);
      this.renderer.draw();
      requestAnimationFrame((t) => this.frame(t));
    }
  }
  B.Game = Game;
  window.game = new Game();
})(window.B10);
