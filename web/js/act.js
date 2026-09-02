var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.act.v1";
  function fresh() {
    return { version: 1, phase: 0, turns: 0, seen: [], last: "", complete: false };
  }
  function load() {
    var a = fresh();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          for (var k in a) if (p[k] != null) a[k] = p[k];
          if (!Array.isArray(a.seen)) a.seen = [];
          a.phase = Math.max(0, Math.min(5, Math.floor(Number(a.phase) || 0)));
          a.turns = Math.max(0, Math.floor(Number(a.turns) || 0));
        }
      }
    } catch (e) {}
    return a;
  }
  function save(a) { try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(a)); } catch (e) {} }
  function addSeen(a, key) {
    if (a.seen.indexOf(key) < 0) { a.seen.push(key); if (a.seen.length > 16) a.seen.shift(); return true; }
    return false;
  }

  G.Act = {
    _state: null,
    resetCache: function () { this._state = null; },
    state: function () { if (!this._state) this._state = load(); return this._state; },
    profile: function () {
      var a = this.state();
      return { version: 1, phase: a.phase, turns: a.turns, seen: a.seen.slice(), last: a.last, complete: !!a.complete };
    },
    reset: function () { this._state = fresh(); save(this._state); },

    // Первый акт не выдаёт список заданий. Он меняет плотность мира по мере
    // того, как человек уже играет: родился -> заметил -> привязался ->
    // вернулся -> унес историю дальше. Так длительность появляется из
    // последствий, а не из искусственного таймера.
    observe: function (dt, game) {
      if (!game || !game.world || !game.dna) return;
      var a = this.state();
      a.turns++;
      var life = G.Life && G.Life.profile ? G.Life.profile() : null;
      var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : null;
      var mem = G.WorldMemory && G.WorldMemory.profile ? G.WorldMemory.profile() : null;
      var tr = G.Trajectory && G.Trajectory.profile ? G.Trajectory.profile() : null;
      var beings = game.world.beings || [], anchors = game.world.anchors || [], nodes = game.world.nodes || [];
      var bonded = false, living = 0, memories = 0, dead = 0;
      for (var i = 0; i < beings.length; i++) {
        if (!beings[i].dead) living++;
        if (!beings[i].dead && (beings[i].bond || 0) >= 0.55) bonded = true;
      }
      for (var n = 0; n < nodes.length; n++) {
        if (nodes[n].dead) { dead++; continue; }
        if (nodes[n].memory || nodes[n].memoryAnchor) memories++;
      }
      if (mem && mem.memories) memories = Math.max(memories, mem.memories.length);

      var pulse = Number(game.dna.pulses) || 0;
      var behavior = life && life.behavior ? life.behavior : {};
      var returns = Number(behavior.returns) || 0;
      var born = Number(behavior.born) || 0;
      var skins = life ? Number(life.skins) || 0 : 0;
      var trust = rel ? Number(rel.trust) || 0 : 0;
      var trajectory = tr && tr.path ? tr.path : "";
      var next = a.phase;
      if (next < 1 && (game.dna.age || 0) >= 55) next = 1;
      if (next < 2 && (bonded || trust >= 0.35 || anchors.length >= 2)) next = 2;
      if (next < 3 && (returns >= 3 || memories >= 2 || pulse >= 4)) next = 3;
      if (next < 4 && (skins >= 2 || trajectory)) next = 4;
      if (next < 5 && (skins >= 3 && (returns >= 7 || memories >= 4 || dead >= 2))) next = 5;
      if (next === a.phase) return;

      a.phase = next;
      var key = "p" + next;
      if (!addSeen(a, key)) return;
      var lines = {
        1: ["ты начал отвечать миру.", "you have begun to answer the world."],
        2: ["теперь мир знает не только тебя.", "now the world knows more than only you."],
        3: ["возвращение стало частью тебя.", "returning has become part of you."],
        4: ["твоя жизнь уже оставляет форму следующей.", "your life is already shaping the next one."],
        5: ["первый круг замкнулся. но берег не закончился.", "the first circle is complete. the shore is not."]
      };
      var line = lines[next];
      a.last = line ? line[0] : "";
      a.complete = next >= 5;
      save(a);
      if (G.Voice && G.Voice.sayText && line) G.Voice.sayText(G.Lang && G.Lang.id === "en" ? line[1] : line[0], true);

      // Каждый перелом меняет один физический параметр. Никаких квестовых
      // маркеров: след остаётся в самом берегу и переживает продолжение.
      if (next === 2) game.world.scatter(game.player.x, game.player.y, 1, 300);
      if (next === 3) {
        var r = game.world.nearestNode ? game.world.nearestNode(game.player.x, game.player.y, 240) : null;
        if (r && !r.dead) { r.memory = true; r.care = Math.max(r.care || 0, 0.8); r.actTrace = true; }
      }
      if (next === 4) game.world.scatter(game.player.x, game.player.y, 2, 520);
      if (next === 5) game.world.bounds += 180;
    }
  };

  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.Act) G.Act.observe(dt, game);
    };
  }
})(IGRA);
