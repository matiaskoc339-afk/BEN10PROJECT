"use strict";
(function (B) {
  class AudioSystem {
    constructor() {
      this.ctx = null;
      this.volume = 0.3;
      this.muted = false;
    }
    init() {
      try {
        this.ctx ??= new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      } catch {}
    }
    footstep(surface) {
      if (!this.ctx || this.muted || !this.volume) return;
      const c = this.ctx,
        t = c.currentTime,
        buffer = c.createBuffer(
          1,
          Math.floor(c.sampleRate * 0.045),
          c.sampleRate,
        ),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const source = c.createBufferSource(),
        filter = c.createBiquadFilter(),
        gain = c.createGain();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.value = surface === "grass" ? 650 : 1250;
      gain.gain.setValueAtTime(this.volume * 0.075, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      source.start(t);
    }
    play(type) {
      if (!this.ctx || this.muted || !this.volume) return;
      const c = this.ctx,
        t = c.currentTime;
      const settings = {
        light: [160, 0.08, "triangle"],
        heavy: [65, 0.2, "sawtooth"],
        hit: [100, 0.08, "triangle"],
        fire: [340, 0.15, "sawtooth"],
        dodge: [430, 0.09, "sine"],
        block: [720, 0.1, "triangle"],
        transform: [390, 0.5, "square"],
        empty: [100, 0.5, "triangle"],
        dna: [550, 0.7, "sine"],
        unlock: [660, 0.8, "triangle"],
        boss: [85, 0.8, "sawtooth"],
        talk: [270, 0.025, "sine"],
        puzzle: [480, 0.3, "sine"],
        hurt: [120, 0.15, "sawtooth"],
        ui: [530, 0.06, "sine"],
      };
      const [f, d, w] = settings[type] || settings.ui;
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = w;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(
        type === "transform" || type === "dna" || type === "unlock"
          ? f * 2.5
          : f * 0.4,
        t + d,
      );
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(
        this.volume * (type === "talk" ? 0.045 : 0.15),
        t + 0.008,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g);
      g.connect(c.destination);
      o.start(t);
      o.stop(t + d + 0.02);
    }
  }
  B.AudioSystem = AudioSystem;
})(window.B10);
