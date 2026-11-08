"use strict";
(function (B) {
  const $ = (id) => document.getElementById(id);
  B.$ = $;
  class UI {
    constructor(g) {
      this.g = g;
      this.dialogue = null;
      this.history = [];
      this.toastTime = 0;
      this.comboLabel = null;
      this.wheelIndex = 0;
      this.panelReturn = "menu";
      this.bind();
    }
    bind() {
      const g = this.g;
      $("new-game").onclick = () => {
        g.audio.init();
        if (g.hasSave()) {
          this.panel("new");
        } else g.newGame();
      };
      $("continue").onclick = () => {
        g.audio.init();
        g.continueGame();
      };
      document.querySelectorAll("[data-panel]").forEach(
        (b) =>
          (b.onclick = () => {
            g.audio.init();
            this.panel(b.dataset.panel);
          }),
      );
      $("close-panel").onclick = () => this.closePanel();
      $("pause-button").onclick = () => this.panel("pause");
      $("advance").onclick = () => this.advance();
      $("skip-scene").onclick = () => this.skip();
      $("sound").onclick = () => {
        g.audio.init();
        g.audio.muted = !g.audio.muted;
        g.settings.muted = g.audio.muted;
        $("sound").textContent = g.audio.muted ? "♪̸" : "♪";
        g.storeSettings();
      };
      document.querySelector(".brand").onclick = (e) => {
        e.preventDefault();
        if (g.mode === "menu") return;
        this.panel("pause");
      };
      $("end-menu").onclick = () => g.toMenu();
      $("explore").onclick = () => {
        g.mode = "play";
        $("end-screen").hidden = true;
        $("hud").hidden = false;
        B.loadZone(g, "city", false);
        this.toast(
          "Capítulo completado · explora y busca las mejoras restantes",
        );
      };
    }
    menu() {
      const g = this.g;
      $("menu").hidden = false;
      $("masthead").hidden = false;
      $("hud").hidden = true;
      $("dialogue").hidden = true;
      $("wheel").hidden = true;
      $("panel").hidden = true;
      $("end-screen").hidden = true;
      $("unlock-banner").hidden = true;
      $("continue").disabled = !g.hasSave();
    }
    play() {
      $("menu").hidden = true;
      $("masthead").hidden = true;
      $("hud").classList.remove("cinematic");
      $("hud").hidden = false;
      $("panel").hidden = true;
      $("end-screen").hidden = true;
      this.refreshFavorites();
    }
    toast(text) {
      $("toast").textContent = text;
      $("toast").classList.add("show");
      this.toastTime = 3.8;
    }
    hint(text) {
      $("interaction").textContent = text;
      $("interaction").style.opacity = text ? "1" : "0";
    }
    portrait(id, who, expression = "") {
      const name = who === "Ben" ? "ben" : who;
      const king = this.g.world.enemies.find((e) => e.type === "king");
      B.drawCharacterPortrait($(id), name, {
        time: this.g.clock,
        expression,
        scene: this.g.world.zone,
        armor: king?.armor || 0,
      });
    }
    scene(id, done = () => {}) {
      const scene = B.scenes[id];
      if (!scene) {
        done();
        return;
      }
      this.g.input.clear();
      this.g.mode = "dialogue";
      this.g.sceneAge = 0;
      this.dialogue = {
        id,
        scene,
        index: 0,
        chars: 0,
        done,
        actions: new Set(),
      };
      $("dialogue").classList.remove("leaving");
      $("dialogue").hidden = false;
      $("hud").classList.add("cinematic");
      $("scene-title").textContent = scene.title;
      this.line();
    }
    line() {
      const d = this.dialogue;
      if (!d) return;
      const l = d.scene.lines[d.index];
      d.chars = this.g.settings.typewriter ? 0 : l.text.length;
      $("speaker").textContent = l.who.toUpperCase();
      $("expression").textContent = l.expression;
      this.portrait("portrait", l.who, l.expression);
      this.history.push({ who: l.who, text: l.text });
      if (this.history.length > 160) this.history.shift();
      $("dialogue-text").textContent = l.text.slice(0, Math.floor(d.chars));
      if (l.action && !d.actions.has(d.index)) {
        d.actions.add(d.index);
        this.g.cineAction(l.action);
      }
      this.g.audio.play("talk");
    }
    advance() {
      const d = this.dialogue;
      if (!d) return;
      const l = d.scene.lines[d.index];
      if (d.chars < l.text.length) {
        d.chars = l.text.length;
        $("dialogue-text").textContent = l.text;
        return;
      }
      d.index++;
      if (d.index >= d.scene.lines.length) this.endScene();
      else this.line();
    }
    skip() {
      const d = this.dialogue;
      if (!d) return;
      for (let i = d.index; i < d.scene.lines.length; i++) {
        const l = d.scene.lines[i];
        if (l.action && !d.actions.has(i)) {
          d.actions.add(i);
          this.g.cineAction(l.action);
        }
      }
      this.endScene();
    }
    endScene() {
      const d = this.dialogue;
      if (!d) return;
      this.dialogue = null;
      this.g.mode = "play";
      this.g.input.clear();
      d.done();
      if (!this.dialogue) {
        $("dialogue").classList.add("leaving");
        $("hud").classList.remove("cinematic");
        setTimeout(() => {
          if (!this.dialogue) $("dialogue").hidden = true;
        }, 180);
      }
    }
    openWheel() {
      const g = this.g;
      g.mode = "wheel";
      $("wheel").hidden = false;
      this.wheelIndex = Math.max(
        0,
        B.forms.findIndex((f) => f.id === (g.player.queued || g.player.form)),
      );
      this.buildWheel();
    }
    buildWheel() {
      const ring = $("wheel-ring");
      ring.replaceChildren();
      B.forms.forEach((f, i) => {
        const slot = document.createElement("div");
        slot.className =
          "wheel-slot" + (this.g.save.unlocked.includes(f.id) ? "" : " locked");
        const a = (i / 10) * B.TAU - Math.PI / 2;
        slot.style.left = 225 + Math.cos(a) * 210 + "px";
        slot.style.top = 225 + Math.sin(a) * 210 + "px";
        const cv = document.createElement("canvas");
        cv.width = cv.height = 90;
        const c = cv.getContext("2d");
        if (!this.g.save.unlocked.includes(f.id)) {
          c.globalAlpha = 0.25;
          c.filter = "brightness(.4) saturate(0)";
        }
        B.drawActor(c, f.id, 45, 87, 0.68, { time: 0, shadow: false });
        slot.append(cv);
        if (!this.g.save.unlocked.includes(f.id)) {
          const lock = document.createElement("span");
          lock.className = "lock";
          lock.textContent = "BLOQUEADO";
          slot.append(lock);
        }
        ring.append(slot);
      });
      this.wheelHighlight();
    }
    wheelMove(x, y) {
      const g = this.g;
      const a =
        Math.atan2(y - g.view.h * 0.47, x - g.view.w * 0.5) + Math.PI / 2;
      this.wheelIndex = (Math.round((a / B.TAU) * 10) + 10) % 10;
      this.wheelHighlight();
    }
    wheelHighlight() {
      const f = B.forms[this.wheelIndex];
      Array.from($("wheel-ring").children).forEach((e, i) =>
        e.classList.toggle("selected", i === this.wheelIndex),
      );
      $("wheel-name").textContent = f.name.toUpperCase();
      $("wheel-info").textContent = this.g.save.unlocked.includes(f.id)
        ? f.role
        : "ADN BLOQUEADO · " + f.role.split("·")[1];
    }
    closeWheel(confirm = true) {
      if (this.g.mode !== "wheel") return;
      $("wheel").hidden = true;
      this.g.mode = "play";
      if (confirm) B.transform(this.g, B.forms[this.wheelIndex].id);
    }
    refreshFavorites() {
      const g = this.g,
        root = $("favorites");
      root.replaceChildren();
      g.save.favorites.forEach((id, i) => {
        const b = document.createElement("button");
        b.className = "favorite" + (g.player.form === id ? " active" : "");
        b.title =
          i +
          1 +
          " · " +
          (id ? B.form(id).name : "Configura tus favoritos en pausa");
        b.setAttribute("aria-label", b.title);
        const k = document.createElement("kbd");
        k.textContent = i + 1;
        b.append(k);
        if (id) {
          const cv = document.createElement("canvas");
          cv.width = cv.height = 90;
          B.drawActor(cv.getContext("2d"), id, 45, 88, 0.68, { shadow: false });
          b.append(cv);
        } else {
          const s = document.createElement("span");
          s.textContent = "VACÍO";
          b.append(s);
        }
        b.onclick = () => {
          if (g.mode !== "play") return;
          if (id) B.transform(g, id);
          else this.panel("favorites");
        };
        root.append(b);
      });
      this.portrait("avatar", g.player.form);
    }
    panel(type, formId) {
      const g = this.g;
      if (g.mode !== "panel") {
        this.panelReturn = g.mode;
        g.input.clear();
        if (g.mode === "wheel") {
          this.closeWheel(false);
          this.panelReturn = "play";
        }
      }
      g.mode = "panel";
      $("panel").hidden = false;
      const body = $("panel-body");
      body.replaceChildren();
      this.panelType = type;
      const title = {
        pause: "TIEMPO FUERA",
        settings: "CONFIGURACIÓN",
        controls: "TUS CONTROLES",
        skills: "EVOLUCIÓN ALIENÍGENA",
        favorites: "TRES FAVORITOS",
        progress: "ARCHIVO DE MISIÓN",
        history: "HISTORIAL DE DIÁLOGOS",
        new: "NUEVA AVENTURA",
        death: "HÉROE FUERA DE COMBATE",
      }[type];
      $("panel-title").textContent = title;
      const action = (text, fn) => {
        const b = document.createElement("button");
        b.className = "panel-action";
        b.textContent = text;
        b.onclick = () => {
          g.audio.play("ui");
          fn();
        };
        body.append(b);
        return b;
      };
      const paragraph = (text) => {
        const p = document.createElement("p");
        p.textContent = text;
        body.append(p);
      };
      if (type === "pause") {
        action("↗  CONTINUAR", () => this.closePanel());
        action("EVOLUCIÓN · Árboles de habilidades", () =>
          this.panel("skills"),
        );
        action("OMNITRIX · Configurar favoritos", () =>
          this.panel("favorites"),
        );
        action("MISIÓN · Progreso del capítulo", () => this.panel("progress"));
        action("REGISTRO · Historial de diálogos", () => this.panel("history"));
        action("CONFIGURACIÓN", () => this.panel("settings"));
        action("CONTROLES", () => this.panel("controls"));
        action("GUARDAR Y VOLVER AL MENÚ", () => {
          g.persist();
          g.toMenu();
        });
      } else if (type === "new") {
        paragraph(
          "Hay una partida guardada. Empezar una nueva aventura reemplazará ese progreso.",
        );
        action("COMENZAR NUEVA PARTIDA", () => {
          this.closePanel();
          g.newGame();
        });
        action("CONSERVAR PARTIDA", () => this.closePanel());
      } else if (type === "death") {
        paragraph(
          "El Omnitrix sigue contigo. Vuelve al último punto de control con vida y energía restauradas.",
        );
        action("↗  REINTENTAR DESDE EL PUNTO DE CONTROL", () => {
          this.closePanel();
          g.continueGame(false);
        });
        action("VOLVER AL MENÚ", () => g.toMenu());
      } else if (type === "settings") {
        paragraph("Los ajustes se guardan automáticamente en este navegador.");
        const row = (text, input) => {
          const l = document.createElement("label");
          l.className = "setting-row";
          l.append(document.createTextNode(text), input);
          body.append(l);
        };
        const vol = document.createElement("input");
        vol.type = "range";
        vol.min = 0;
        vol.max = 100;
        vol.value = g.settings.volume * 100;
        vol.setAttribute("aria-label", "Volumen");
        vol.oninput = () => {
          g.settings.volume = +vol.value / 100;
          g.audio.volume = g.settings.volume;
          g.audio.init();
          g.audio.play("ui");
          g.storeSettings();
        };
        row("Volumen de efectos", vol);
        for (const [key, text] of [
          ["typewriter", "Texto progresivo en diálogos"],
          ["shake", "Sacudidas de cámara"],
        ]) {
          const v = document.createElement("input");
          v.type = "checkbox";
          v.checked = g.settings[key];
          v.onchange = () => {
            g.settings[key] = v.checked;
            g.storeSettings();
          };
          row(text, v);
        }
        const diff = document.createElement("select");
        for (const [v, text] of [
          ["story", "Historia · daño recibido reducido"],
          ["normal", "Normal · desafío equilibrado"],
        ]) {
          const o = document.createElement("option");
          o.value = v;
          o.textContent = text;
          diff.append(o);
        }
        diff.value = g.settings.difficulty;
        diff.onchange = () => {
          g.settings.difficulty = diff.value;
          g.storeSettings();
        };
        row("Dificultad", diff);
      } else if (type === "controls") {
        paragraph(
          "Apunta con el mouse. También puedes atacar con los botones izquierdo y derecho. Haz clic en una tecla para reasignarla. Los favoritos usan 1, 2 y 3.",
        );
        const grid = document.createElement("div");
        grid.className = "control-grid";
        body.append(grid);
        for (const [key, text] of Object.entries(B.controlNames)) {
          const r = document.createElement("div");
          r.className = "control-row";
          const span = document.createElement("span");
          span.textContent = text;
          const b = document.createElement("button");
          b.textContent = g.keyLabel(key);
          b.onclick = () => {
            b.textContent = "PULSA UNA TECLA";
            g.rebinding = { key, button: b };
          };
          r.append(span, b);
          grid.append(r);
        }
        action("RESTAURAR CONTROLES", () => {
          g.bindings = { ...B.defaults };
          g.settings.bindings = g.bindings;
          g.storeSettings();
          this.panel("controls");
        });
      } else if (type === "favorites") {
        paragraph(
          "Selecciona con 1, 2 y 3. Antes del Control Maestro debes volver a Ben con X para cambiar de alienígena.",
        );
        g.save.favorites.forEach((current, i) => {
          const row = document.createElement("label");
          row.className = "setting-row";
          row.textContent = "FAVORITO " + (i + 1);
          const s = document.createElement("select");
          for (const id of [null, ...g.save.unlocked]) {
            const o = document.createElement("option");
            o.value = id || "";
            o.textContent = id ? B.form(id).name : "Vacío";
            s.append(o);
          }
          s.value = current || "";
          s.onchange = () => {
            g.save.favorites[i] = s.value || null;
            this.refreshFavorites();
            g.persist();
          };
          row.append(s);
          body.append(row);
        });
      } else if (type === "skills") {
        const ids = g.save.unlocked,
          selected = ids.includes(formId) ? formId : ids[0],
          f = B.form(selected);
        const tabs = document.createElement("div");
        tabs.className = "tab-row";
        body.append(tabs);
        for (const id of ids) {
          const b = document.createElement("button");
          b.textContent = B.form(id).name;
          b.className = selected === id ? "active" : "";
          b.onclick = () => this.panel("skills", id);
          tabs.append(b);
        }
        paragraph(
          "PUNTOS DISPONIBLES: " +
            g.save.points +
            "   /   XP: " +
            g.save.xp +
            "   ·   Cada 100 XP otorgan un punto.",
        );
        const cols = document.createElement("div");
        cols.className = "skill-columns";
        body.append(cols);
        f.branches.forEach((branch, i) => {
          const col = document.createElement("div");
          col.className = "skill-column";
          const h = document.createElement("h3");
          h.textContent = branch;
          col.append(h);
          const specs = [
            f.skills[i],
            [
              ["Maestría ofensiva", "Daño de todos tus ataques +20 %."],
              ["Maestría defensiva", "Reduce otro 20 % el daño recibido."],
              [
                "Sincronía del ADN",
                "La habilidad especial se recupera un 30 % más rápido.",
              ],
            ][i],
          ];
          specs.forEach((spec, tier) => {
            const index = i + tier * 3,
              owned = g.has(selected, index),
              req = tier === 0 || g.has(selected, i);
            const b = document.createElement("button");
            b.className = "skill-node" + (owned ? " owned" : "");
            b.disabled = owned || !req || g.save.points < 1;
            const strong = document.createElement("strong");
            strong.textContent = spec[0];
            const span = document.createElement("span");
            span.textContent = spec[1];
            const small = document.createElement("small");
            small.textContent = owned
              ? "✓ DESBLOQUEADA"
              : !req
                ? "REQUIERE LA TÉCNICA ANTERIOR"
                : "1 PUNTO DE HABILIDAD";
            b.append(strong, span, small);
            b.onclick = () => {
              if (g.save.points < 1 || g.has(selected, index)) return;
              g.save.skills[selected].push(index);
              g.save.points--;
              g.save.spent++;
              g.persist();
              g.audio.play("unlock");
              this.panel("skills", selected);
            };
            col.append(b);
          });
          cols.append(col);
        });
      } else if (type === "progress") {
        for (const [ok, text] of [
          [true, "Escapar del extractor de Vilgax"],
          [g.save.flags.gate, "Reabrir las calles de Bellwood"],
          [g.save.flags.executor, "Derrotar al Ejecutor Eterno"],
          [g.save.flags.supports, "Desactivar los conductos cristalinos"],
          [g.save.flags.king, "Vencer al Rey Eterno"],
          [g.save.unlocked.includes("diamond"), "Recuperar el ADN de Diamante"],
          [g.save.completed, "Escapar y reunirse con Gwen y Max"],
        ]) {
          const p = document.createElement("div");
          p.className = "progress-line";
          const b = document.createElement("b");
          b.textContent = ok ? "✓" : "○";
          p.append(b, document.createTextNode(text));
          body.append(p);
        }
        paragraph(
          "Alienígenas: " +
            g.save.unlocked.length +
            "/10 · Enemigos derrotados: " +
            g.save.kills +
            " · Secretos: " +
            g.save.items.length +
            "/5. Los capítulos posteriores y el Control Maestro aún no forman parte de esta entrega.",
        );
      } else if (type === "history") {
        if (!this.history.length)
          paragraph("Las conversaciones aparecerán aquí durante la aventura.");
        for (const item of this.history) {
          const d = document.createElement("div");
          d.className = "history-item";
          const b = document.createElement("b");
          b.textContent = item.who;
          const p = document.createElement("p");
          p.textContent = item.text;
          d.append(b, p);
          body.append(d);
        }
      }
    }
    closePanel() {
      if (this.panelType === "death") return;
      this.g.rebinding = null;
      $("panel").hidden = true;
      this.g.mode = this.panelReturn;
      this.g.input.clear();
    }
    update(dt) {
      const g = this.g,
        p = g.player;
      if (this.unlockTime > 0) {
        this.unlockTime -= dt;
        if (this.unlockTime <= 0) B.$("unlock-banner").hidden = true;
      }
      if (this.toastTime > 0) {
        this.toastTime -= dt;
        if (this.toastTime <= 0) $("toast").classList.remove("show");
      }
      if (this.dialogue && g.mode === "dialogue") {
        const d = this.dialogue,
          l = d.scene.lines[d.index],
          old = Math.floor(d.chars);
        d.chars = this.g.settings.typewriter
          ? Math.min(l.text.length, d.chars + dt * 47)
          : l.text.length;
        $("dialogue-text").textContent = l.text.slice(0, Math.floor(d.chars));
        if (Math.floor(d.chars) > old && old % 5 === 0) g.audio.play("talk");
        $("advance").style.opacity = d.chars >= l.text.length ? 1 : 0.5;
      }
      if (this.comboLabel) {
        this.comboLabel.time -= dt;
        if (this.comboLabel.time <= 0) this.comboLabel = null;
      }
      if (g.mode === "menu") return;
      $("form-name").textContent = B.form(p.form).name.toUpperCase();
      $("health-number").textContent =
        Math.ceil(Math.max(0, p.hp)) + " / " + p.maxHp;
      $("health-fill").style.width =
        B.clamp((p.hp / p.maxHp) * 100, 0, 100) + "%";
      $("energy-fill").style.width = (p.energy / p.maxEnergy) * 100 + "%";
      $("energy-fill").style.background = p.locked ? "#e87f69" : "#a6f34f";
      $("energy-number").textContent =
        Math.ceil(p.energy) + " / " + p.maxEnergy;
      $("watch-status").textContent = p.locked
        ? "RECUPERACIÓN"
        : p.form === "ben"
          ? "OMNITRIX DISPONIBLE"
          : "ADN ACTIVO · ENERGÍA EN USO";
      $("zone-name").textContent = B.zoneNames[g.world.zone] || "PRÓLOGO";
      $("objective-text").textContent = g.save.completed
        ? "Explora Bellwood y encuentra los secretos"
        : B.objectives[g.world.zone] || "Escapa de la máquina de Vilgax";
      $("special-status").textContent =
        p.specialCD > 0
          ? "ESPECIAL · " + p.specialCD.toFixed(1) + " s"
          : p.form === "ben"
            ? "TRANSFORMA PARA USAR PODERES"
            : "ESPECIAL LISTO · F";
      const combo = $("combo");
      combo.replaceChildren();
      if (p.hitTimer > 0 || this.comboLabel) {
        combo.append(
          document.createTextNode(p.hitTimer > 0 ? p.hitCount + " HITS" : ""),
        );
        const small = document.createElement("small");
        small.textContent = this.comboLabel?.text || "MANTÉN EL RITMO";
        combo.append(small);
      }
      const boss = g.world.enemies.find(
        (e) =>
          !e.dead &&
          (e.type === "king" || e.type === "executor") &&
          B.dist(e, p) < 1000,
      );
      $("boss-hud").hidden = !boss;
      if (boss) {
        $("boss-name").textContent =
          boss.type === "executor"
            ? "EL EJECUTOR ETERNO · " + (boss.phase === 1 ? "EL MURO" : "FURIA")
            : "EL REY ETERNO · FASE " + boss.phase;
        $("boss-fill").style.width =
          Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";
        $("boss-tip").textContent =
          boss.type === "executor"
            ? "Esquiva la preparación. Castiga su recuperación."
            : boss.phase === 1
              ? boss.heat >= 100
                ? "Armadura frágil: Cuatro Brazos + K × 2"
                : "Fuego: calienta el cristal · Placas restantes: " + boss.armor
              : boss.phase === 2
                ? "Espada desenvainada · esquiva las embestidas"
                : "Retirada · corta la distancia y limita sus refuerzos";
      }
    }
  }
  B.UI = UI;
})(window.B10);
