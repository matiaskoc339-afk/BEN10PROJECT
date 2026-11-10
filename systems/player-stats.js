/* Shared by the standalone demo and the Node tests. Alien graphics are added
   separately; transform() is the integration point for a future playable form. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Ben10Stats = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const DEFAULTS = Object.freeze({
    maxHealth: 100,
    maxEnergy: 100,
    passiveDrain: 1.5,
    rechargeRate: 8,
    rechargeDelay: 3,
    specialCost: 20,
    comboWindow: 1.35,
    xpBase: 100,
    xpStep: 50,
    targetXP: 40,
  });
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  class PlayerStats {
    constructor(config = {}) {
      this.config = Object.freeze({ ...DEFAULTS, ...config });
      this.reset();
    }
    reset() {
      this.health = this.config.maxHealth;
      this.energy = this.config.maxEnergy;
      this.form = null;
      this.level = 1;
      this.xp = 0;
      this.totalXP = 0;
      this.comboHits = 0;
      this.comboLeft = 0;
      this.specialReservation = null;
      this.rechargeLeft = 0;
      this.events = [];
    }
    get xpNeeded() {
      return this.config.xpBase + (this.level - 1) * this.config.xpStep;
    }
    get transformed() {
      return this.form !== null;
    }
    get specialReady() {
      return (
        this.transformed &&
        this.health > 0 &&
        this.comboHits >= 2 &&
        this.comboLeft > 0 &&
        this.energy >= this.config.specialCost
      );
    }
    setHealth(value) {
      if (Number.isFinite(value))
        this.health = clamp(value, 0, this.config.maxHealth);
      return this.health;
    }
    damage(amount) {
      if (!Number.isFinite(amount) || amount <= 0) return 0;
      const before = this.health;
      this.setHealth(this.health - amount);
      if (before > 0 && this.health === 0) {
        this.clearCombo();
        this.returnToBen("defeat");
        this.events.push({ type: "defeated" });
      }
      return before - this.health;
    }
    transform(form) {
      if (
        !form ||
        typeof form.id !== "string" ||
        !form.id.trim() ||
        form.id === "ben" ||
        this.energy <= 0 ||
        this.health <= 0
      )
        return false;
      this.form = { id: form.id, name: String(form.name || form.id) };
      this.clearCombo();
      this.rechargeLeft = 0;
      this.events.push({ type: "form-started", form: { ...this.form } });
      return true;
    }
    returnToBen(reason = "manual") {
      if (!this.transformed) return false;
      const previous = this.form;
      this.form = null;
      this.clearCombo();
      this.rechargeLeft = this.config.rechargeDelay;
      this.events.push({ type: "form-ended", reason, previous });
      return true;
    }
    clearCombo() {
      this.comboHits = 0;
      this.comboLeft = 0;
      this.specialReservation = null;
    }
    recordLightHit() {
      if (this.health <= 0) return;
      this.comboHits = Math.min(2, this.comboHits + 1);
      this.comboLeft = this.config.comboWindow;
    }
    useComboSpecial() {
      if (!this.specialReady) return false;
      return this._spendComboSpecial();
    }
    reserveComboSpecial() {
      if (!this.specialReady) return null;
      const reservation = Object.freeze({ form: this.form.id });
      this.clearCombo();
      this.specialReservation = reservation;
      return reservation;
    }
    cancelReservedSpecial(reservation) {
      if (reservation === this.specialReservation) this.specialReservation = null;
    }
    useReservedSpecial(reservation) {
      if (!reservation || reservation !== this.specialReservation ||
          this.form?.id !== reservation.form || this.health <= 0 ||
          this.energy < this.config.specialCost) return false;
      return this._spendComboSpecial();
    }
    _spendComboSpecial() {
      const form = { ...this.form },
        cost = this.config.specialCost;
      this.energy = Math.max(0, this.energy - cost);
      this.clearCombo();
      this.events.push({ type: "special-used", form, cost });
      if (this.energy === 0) this.returnToBen("empty");
      return { form, cost };
    }
    awardXP(amount) {
      if (!Number.isFinite(amount) || amount <= 0) return 0;
      const earned = Math.floor(amount);
      this.xp += earned;
      this.totalXP += earned;
      while (this.xp >= this.xpNeeded) {
        this.xp -= this.xpNeeded;
        this.level++;
        this.events.push({ type: "level-up", level: this.level });
      }
      return earned;
    }
    tick(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      this.comboLeft = Math.max(0, this.comboLeft - dt);
      if (this.comboLeft === 0) this.comboHits = 0;
      let remaining = dt;
      if (this.transformed) {
        const active =
          this.config.passiveDrain > 0
            ? Math.min(dt, this.energy / this.config.passiveDrain)
            : dt;
        this.energy = Math.max(
          0,
          this.energy - active * this.config.passiveDrain,
        );
        remaining -= active;
        if (this.energy < 1e-8) {
          this.energy = 0;
          this.returnToBen("empty");
        }
      }
      if (!this.transformed && this.health > 0 && remaining > 0) {
        const waiting = Math.min(remaining, this.rechargeLeft);
        this.rechargeLeft -= waiting;
        remaining -= waiting;
        this.energy = clamp(
          this.energy + remaining * this.config.rechargeRate,
          0,
          this.config.maxEnergy,
        );
      }
    }
    drainEvents() {
      return this.events.splice(0);
    }
    snapshot() {
      return {
        health: this.health,
        maxHealth: this.config.maxHealth,
        energy: this.energy,
        maxEnergy: this.config.maxEnergy,
        form: this.form ? { ...this.form } : null,
        level: this.level,
        xp: this.xp,
        xpNeeded: this.xpNeeded,
        totalXP: this.totalXP,
        comboHits: this.comboHits,
        specialReady: this.specialReady,
      };
    }
  }
  return { PlayerStats, DEFAULTS };
});
