var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.metamorphosis.v1";
  var MAX = 8;
  var TRAITS = ["curiosity", "aggression", "contemplation", "empathy", "chaos", "harmony"];
  var KIND = { curiosity: "relic", aggression: "thorn", contemplation: "still", empathy: "echo", chaos: "shard", harmony: "tone" };

  function fresh() { return { version: 1, lives: 0, mutations: [], last: "", depth: 0 }; }
  function load() {
    var s = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          s.lives = Math.max(0, Math.floor(Number(p.lives) || 0));
          s.mutations = Array.isArray(p.mutations) ? p.mutations.slice(-MAX) : [];
          s.last = p.last || "";
          s.depth = Math.max(0, Math.min(3, Number(p.depth) || 0));
        }
      }
    } catch (e) {}
    return s;
  }
  function save(s) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {} }
  function dominant(dna) {
    var best = TRAITS[0], value = -1;
    for (var i = 0; i < TRAITS.length; i++) { var v = dna && dna.get ? dna.get(TRAITS[i]) : 0; if (v > value) { value = v; best = TRAITS[i]; } }
    return best;
  }
  function second(dna, first) {
    var best = "", value = -1;
    for (var i = 0; i < TRAITS.length; i++) { var k = TRAITS[i]; if (k === first) continue; var v = dna && dna.get ? dna.get(k) : 0; if (v > value) { value = v; best = k; } }
    return best;
  }

  var M = {
    resetCache: function () { this._state = null; this._wrapped = false; },
    state: function () { if (!this._state) this._state = load(); return this._state; },
    profile: function () { var s = this.state(); return { version: 1, lives: s.lives, mutations: s.mutations.slice(), last: s.last, depth: s.depth }; },
    observe: function (game, dna) {
      if (!game || !dna) return;
      var s = this.state(), trait = dominant(dna), sec = second(dna, trait);
      var id = String(game.world && game.world.meta || 0) + ":" + trait + ":" + sec;
      if (s.last === id) return;
      s.lives = Math.max(s.lives, Number(game.world && game.world.meta) || 0);
      s.last = id;
      s.depth = Math.min(3, Math.floor(s.lives / 2));
      var kinds = [KIND[trait]];
      if (sec && s.depth >= 1) kinds.push(KIND[sec]);
      if (s.depth >= 2 && G.Life && G.Life.profile && G.Life.profile().lastTrait) {
        var old = G.Life.profile().lastTrait;
        if (KIND[old] && kinds.indexOf(KIND[old]) < 0) kinds.push(KIND[old]);
      }
      var mutation = { life: s.lives, traits: [trait, sec], kinds: kinds.slice(0, 3) };
      s.mutations.push(mutation);
      if (s.mutations.length > MAX) s.mutations.shift();
      save(s);
    },
    install: function () {
      if (this._wrapped || !G.World || !G.World.prototype || !G.World.prototype.crystallize) return;
      this._wrapped = true;
      var self = this, original = G.World.prototype.crystallize;
      G.World.prototype.crystallize = function (node, gest, dna) {
        var result = original.call(this, node, gest, dna);
        var s = self.state(), meta = Number(this.meta) || 0;
        if (result && meta > 0 && node && !node._metamorphosisMarked) {
          var trait = dominant(dna), sec = second(dna, trait), score = dna && dna.get ? dna.get(trait) : 0;
          // Старый мир остаётся узнаваемым, но новая кожа может вырастить
          // редкий след прошлого. Это не выбор из меню: природа узла
          // всё ещё определяется жестом/ДНК, наследуется лишь акцент.
          if (score > 0.38 && meta >= 1) {
            node.metamorphosis = true;
            node.metamorphosisLife = meta;
            node.metamorphosisTrait = trait;
            node.r = Math.min(30, (node.r || 18) + 2 + Math.min(2, meta));
            if (meta >= 2 && sec && G.KIND_TRAIT && G.KIND_TRAIT[result] === trait) node.metamorphosisEcho = sec;
          }
          node._metamorphosisMarked = true;
        }
        return result;
      };
    }
  };

  G.Metamorphosis = M;
  M.install();
  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.Metamorphosis) G.Metamorphosis.observe(game, game && game.dna);
    };
  }
})(IGRA);
