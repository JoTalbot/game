var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.director-events.v1";
  var MAX = 6;
  var COOLDOWN = 75;

  function load() {
    var s = { version: 1, fired: [], last: -999, total: 0 };
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === "object") {
          if (Array.isArray(p.fired)) s.fired = p.fired.slice(-MAX);
          s.last = Number(p.last);
          s.total = Math.max(0, Math.floor(Number(p.total) || 0));
        }
      }
    } catch (e) {}
    if (!isFinite(s.last)) s.last = -999;
    return s;
  }
  function save(s) {
    try { if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function has(s, id) { return s.fired.indexOf(id) >= 0; }
  function fire(s, id, game) {
    if (has(s, id) || !game || !game.world) return false;
    s.fired.push(id);
    if (s.fired.length > MAX) s.fired.shift();
    s.total++;
    s.last = Number(game.time) || 0;
    save(s);
    if (G.Director) {
      G.Director.events = G.Director.events || [];
      G.Director.events.push({ id: id, time: s.last });
      if (G.Director.events.length > MAX) G.Director.events.shift();
    }
    return true;
  }
  function near(p, nodes, radius, predicate) {
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.dead && G.dist(p.x, p.y, n.x, n.y) < radius && (!predicate || predicate(n))) return n;
    }
    return null;
  }

  var Events = {
    resetCache: function () { this._state = null; },
    state: function () { if (!this._state) this._state = load(); return this._state; },
    profile: function () {
      var s = this.state();
      return { version: 1, fired: s.fired.slice(), last: s.last, total: s.total };
    },

    // Событие здесь не «квест». Это короткая перемена состояния мира,
    // вызванная историей конкретного человека. Оно одноразовое для жизни
    // и сохраняется локально, поэтому повторный запуск не превращает берег
    // в автомат с одинаковыми сценками.
    observe: function (dt, game) {
      if (!game || game.state !== "play" || game.sky || !game.world || !game.dna) return;
      var s = this.state();
      var t = Number(game.time) || 0;
      if (t - s.last < COOLDOWN) return;

      var p = game.player;
      var life = G.Life && G.Life.profile ? G.Life.profile() : null;
      var rel = G.Relationships && G.Relationships.profile ? G.Relationships.profile() : null;
      var mem = G.WorldMemory && G.WorldMemory.profile ? G.WorldMemory.profile() : null;
      var act = G.Act && G.Act.profile ? G.Act.profile() : null;
      var beings = game.world.beings || [];
      var nodes = game.world.nodes || [];
      var wounds = game.world.wounds || [];
      var deep = 0, still = Number(p.stillT) || 0;
      for (var i = 0; i < G.TRAITS.length; i++) deep = Math.max(deep, Number(game.dna.get(G.TRAITS[i])) || 0);

      // Возвращение к собственной памяти. Не награда, а физический ответ
      // старого места: память становится чуть живее рядом с человеком.
      if (life && life.behavior && life.behavior.returns >= 4 && mem && mem.memories && mem.memories.length >= 2) {
        var remembered = near(p, nodes, 260, function (n) { return n.memory || n.memoryAnchor; });
        if (remembered && fire(s, "return-echo", game)) {
          remembered.care = Math.max(Number(remembered.care) || 0, 0.92);
          remembered.roots = Math.max(Number(remembered.roots) || 0, 0.72);
          remembered.actTrace = true;
          G.Voice.say("rememberYou", true);
          return;
        }
      }

      // Долгое внимание без движения делает не «награду», а тихую точку
      // мира. Это отличает созерцание от простоя.
      if (still > 70 && deep > 0.45 && !has(s, "quiet-bloom")) {
        var quietNode = near(p, nodes, 180, function (n) { return n.state === "alive" && !n.dead; });
        if (quietNode && fire(s, "quiet-bloom", game)) {
          quietNode.care = Math.max(Number(quietNode.care) || 0, 0.96);
          quietNode.roots = Math.max(Number(quietNode.roots) || 0, 0.78);
          quietNode.quietMemory = true;
          G.Voice.say("idle", true);
          return;
        }
      }

      // Если связь стала значимой, существо может первым изменить дистанцию.
      // Никаких новых меню отношений: действие живёт в самом существе.
      if (rel && rel.trust > 0.58 && beings.length) {
        for (var b = 0; b < beings.length; b++) {
          var being = beings[b];
          if (!being.dead && being.bond > 0.6 && G.dist(p.x, p.y, being.x, being.y) < 240 && fire(s, "being-approach", game)) {
            being.actAffinity = Math.min(1, (Number(being.actAffinity) || 0) + 0.25);
            being.bond = Math.min(1, (Number(being.bond) || 0) + 0.05);
            G.Voice.say("kind", true);
            return;
          }
        }
      }

      // Рана, пережитая и не повторённая, оставляет шрам в земле. Это
      // связывает поведение, отношения и мир без отдельного «ивента» UI.
      if (wounds.length === 0 && rel && rel.debt > 0.35 && act && act.phase >= 2 && fire(s, "scar-memory", game)) {
        game.world.scatter(p.x, p.y, 1, 210);
        var scar = near(p, nodes, 240, function (n) { return n.state === "unformed"; });
        if (scar) { scar.hint = "scar"; scar.actTrace = true; }
        G.Voice.say("combat", true);
        return;
      }

      // Высокая гармония иногда меняет ближайший тон. Не спавним гору
      // контента: одно событие за жизнь, затем музыка снова становится
      // частью тишины.
      if (game.dna.get("harmony") > 0.62 && !has(s, "harmony-weather")) {
        var tone = near(p, nodes, 260, function (n) { return n.kind === "tone" && n.state === "alive"; });
        if (tone && fire(s, "harmony-weather", game)) {
          tone.care = Math.min(1, (Number(tone.care) || 0) + 0.2);
          tone.weather = true;
          G.Voice.say("music", true);
          return;
        }
      }

      // Далёкий фронтир появляется только после того, как человек уже
      // прожил несколько переломов. Он не зовёт «иди к маркеру», а оставляет
      // физический след дальше от текущего места.
      if (act && act.phase >= 3 && (life && life.skins >= 1) && !has(s, "far-shore")) {
        if (fire(s, "far-shore", game)) {
          game.world.scatter(p.x + G.rand(-360, 360), p.y + G.rand(-360, 360), 2, 180);
          G.Voice.say("frontier", true);
        }
      }
    }
  };

  G.DirectorEvents = Events;
  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.DirectorEvents) G.DirectorEvents.observe(dt, game);
    };
  }
})(IGRA);
