var IGRA = IGRA || {};
(function (G) {
  "use strict";

  // v3-001: долгий контур жизни. Это не новый экран и не квест-лог.
  // Игра хранит несколько тихих фактов о прожитых жизнях и использует их
  // в следующем берегу. Поэтому смена кожи становится продолжением
  // истории, а не просто очисткой сцены.
  var KEY = "igra.life.v1";

  var DEFAULT = {
    born: false,
    skins: 0,
    awaken: false,
    bond: false,
    shadow: false,
    legacy: false,
    threshold: false,
    traits: [],
    lastTrait: "",
    lastAge: 0,
    lastMeta: 0,
    lastSeen: 0,
    initialized: false
  };

  function cloneDefault() {
    return {
      born: DEFAULT.born,
      skins: DEFAULT.skins,
      awaken: DEFAULT.awaken,
      bond: DEFAULT.bond,
      shadow: DEFAULT.shadow,
      legacy: DEFAULT.legacy,
      threshold: DEFAULT.threshold,
      traits: [],
      lastTrait: DEFAULT.lastTrait,
      lastAge: DEFAULT.lastAge,
      lastMeta: DEFAULT.lastMeta,
      lastSeen: DEFAULT.lastSeen,
      initialized: DEFAULT.initialized
    };
  }

  function load() {
    var a = cloneDefault();
    try {
      var raw = G.Save && G.Save.get ? G.Save.get(KEY) : null;
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          for (var k in a) {
            if (parsed[k] != null) a[k] = parsed[k];
          }
          if (!Array.isArray(a.traits)) a.traits = [];
        }
      }
    } catch (e) {}
    return a;
  }

  function persist(a) {
    try {
      if (G.Save && G.Save.set) G.Save.set(KEY, JSON.stringify(a));
    } catch (e) {}
  }

  function traitLabel(trait) {
    if (!trait) return "";
    return G.traitName ? G.traitName(trait) : trait;
  }

  function speak(ru, en) {
    if (G.Voice && G.Voice.sayText) {
      G.Voice.sayText(G.Lang && G.Lang.id === "en" ? en : ru, true);
    }
  }

  G.Life = {
    _arc: null,
    _lastMilestone: "",
    _ready: false,

    resetCache: function () {
      this._arc = null;
      this._lastMilestone = "";
      this._ready = false;
    },

    arc: function () {
      if (!this._arc) this._arc = load();
      return this._arc;
    },

    persist: function () {
      if (this._arc) persist(this._arc);
    },

    summary: function () {
      var a = this.arc();
      return {
        skins: a.skins || 0,
        traits: a.traits.slice(),
        awaken: !!a.awaken,
        bond: !!a.bond,
        shadow: !!a.shadow,
        legacy: !!a.legacy,
        threshold: !!a.threshold
      };
    },

    // Первый вход нового модуля в старое сохранение только запоминает
    // исходную точку. Нельзя честному игроку внезапно подарить десятки
    // «прожитых жизней» потому, что world.meta уже был большим до v3.
    observe: function (dt, game) {
      var a = this.arc();
      var dna = game && game.dna;
      var w = game && game.world;
      if (!dna || !w) return;

      var age = dna.age || 0;
      var meta = w.meta || 0;
      var currentTrait = dna.dominant ? dna.dominant() : "";
      var dirty = false;

      if (!a.initialized) {
        a.initialized = true;
        a.lastAge = age;
        a.lastMeta = meta;
        a.lastSeen = Date.now();
        if (age > 2) a.born = true;
        persist(a);
        this._ready = true;
        return;
      }

      var newSkin = false;

      if (!a.born && age > 2) {
        a.born = true;
        dirty = true;
      }

      if (meta > a.lastMeta) {
        var crossed = meta - a.lastMeta;
        a.skins = (a.skins || 0) + crossed;
        newSkin = true;
        if (currentTrait) {
          a.lastTrait = currentTrait;
          a.traits.push(currentTrait);
          if (a.traits.length > 12) a.traits.shift();
        }
        a.lastMeta = meta;
        dirty = true;
        speak(
          "новая кожа помнит больше, чем старый берег.",
          "the new skin remembers more than the old shore."
        );
      }

      // Запасной детектор для движка/старого сохранения, где meta мог не
      // измениться между наблюдениями. Срабатывает только на явный сброс
      // возраста, характерный для новой жизни.
      if (!newSkin && a.lastAge > 120 && age + 20 < a.lastAge) {
        a.skins = (a.skins || 0) + 1;
        newSkin = true;
        if (currentTrait) {
          a.lastTrait = currentTrait;
          a.traits.push(currentTrait);
          if (a.traits.length > 12) a.traits.shift();
        }
        dirty = true;
        speak(
          "новая кожа помнит больше, чем старый берег.",
          "the new skin remembers more than the old shore."
        );
      }

      if (!a.awaken && age >= 55) {
        a.awaken = true;
        this._lastMilestone = "awaken";
        speak(
          "ты уже не просто родился. ты начинаешь отвечать миру.",
          "you are no longer only born. you are beginning to answer the world."
        );
        dirty = true;
      }

      var hasBond = false;
      for (var i = 0; i < w.beings.length; i++) {
        var b = w.beings[i];
        if (!b.dead && (b.bond || 0) >= 0.55) {
          hasBond = true;
          break;
        }
      }
      if (!a.bond && hasBond) {
        a.bond = true;
        this._lastMilestone = "bond";
        speak(
          "теперь в твоей истории есть кто-то ещё.",
          "now there is someone else in your story."
        );
        dirty = true;
      }

      if (!a.shadow && ((w.boss && !w.boss.dead) || (w.wounds && w.wounds.length >= 1))) {
        a.shadow = true;
        this._lastMilestone = "shadow";
        speak(
          "брошенное вернулось не как прошлое. оно смотрит на тебя.",
          "what you left did not return as the past. it looks at you."
        );
        dirty = true;
      }

      if (!a.legacy && a.skins >= 2) {
        a.legacy = true;
        this._lastMilestone = "legacy";
        speak(
          "берега уже складываются в одну жизнь.",
          "the shores are beginning to form one life."
        );
        dirty = true;
      }

      if (!a.threshold && a.skins >= 3) {
        a.threshold = true;
        this._lastMilestone = "threshold";
        speak(
          "ты живёшь не в берегах. берега живут в тебе.",
          "you do not live in the shores. the shores live in you."
        );
        dirty = true;
      }

      a.lastAge = age;
      a.lastSeen = Date.now();
      if (dirty) persist(a);
      this._ready = true;

      if (newSkin && a.legacy) this.leaveLegacy(game);
    },

    // След памяти для нового берега. Вызывается после обнаружения новой
    // кожи и создаёт один физический объект, который принадлежит истории.
    // Это важнее одной реплики: прошлое получает место в пространстве.
    leaveLegacy: function (game) {
      var a = this.arc();
      if (!game || !game.world || !a.legacy) return null;
      if (game.__lifeLegacySkin === a.skins) return null;
      game.__lifeLegacySkin = a.skins;

      var n = new G.Node(
        game.player.x + G.rand(-150, 150),
        game.player.y + G.rand(-150, 150),
        "memory"
      );
      n.state = "alive";
      n.growth = 1;
      n.care = 0.9;
      n.roots = 0.5;
      n.memory = true;
      n.verse = G.Lang && G.Lang.id === "en"
        ? "a shore you already crossed"
        : "берег, который ты уже пересёк";
      n.name = a.lastTrait ? traitLabel(a.lastTrait) : "memory";
      game.world.nodes.push(n);
      return n;
    }
  };

  // life.js грузится после Director. Оборачиваем только наблюдение, не
  // меняя его внутреннюю логику и не превращая Director в зависимость от
  // v3-модуля. Старые сейвы и старые жизни продолжают работать.
  if (G.Director && G.Director.observe) {
    var originalObserve = G.Director.observe;
    G.Director.observe = function (dt, game) {
      originalObserve.call(this, dt, game);
      if (G.Life) G.Life.observe(dt, game);
    };
  }
})(IGRA);
