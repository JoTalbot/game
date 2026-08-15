var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.UI_STR = {
    ru: {
      word: "ИГРА",
      tag: "она растёт из тебя",
      born: "родиться",
      cont: "вернуться",
      whisper: "коснись пустоты",
      mute: "тишина",
      sound: "звук",
      sky: "небо",
      skyLine: "небо из того, что ты отпустил",
      statShores: "берегов",
      statGrown: "выращено",
      statLost: "отпущено",
      statHeld: "удержано",
      statBeings: "существ",
      statRoads: "дорог",
      seasonWord: "сезон",
      dayWord: "день",
      sigil: "сигила",
      back: "назад в берег",
      forget: "забыть меня",
      share: "унести сигилу",
      mouth: "рот (необязательно)",
      release: "отпустить",
      become: "стать игрой",
      fate: "я могу отпустить тебя. или ты можешь стать мной.",
      hintBirth: "коснись. задержись. или просто стой.",
      hintPlay: "двойное касание — пульс · i — сигила",
      forgetAsk: "Игра забудет тебя. Берег исчезнет. Это тоже жест."
    },
    en: {
      word: "IGRA",
      tag: "it grows from you",
      born: "be born",
      cont: "return",
      whisper: "touch the void",
      mute: "silence",
      sound: "sound",
      sky: "sky",
      skyLine: "a sky made of what you let go",
      statShores: "shores",
      statGrown: "grown",
      statLost: "let go",
      statHeld: "held",
      statBeings: "beings",
      statRoads: "roads",
      seasonWord: "season",
      dayWord: "day",
      sigil: "sigil",
      back: "back to the shore",
      forget: "forget me",
      share: "take the sigil",
      mouth: "mouth (optional)",
      release: "let go",
      become: "become the game",
      fate: "i can let you go. or you can become me.",
      hintBirth: "touch. hold. or just stand.",
      hintPlay: "double tap — pulse · i — sigil",
      forgetAsk: "The Game will forget you. The shore will vanish. That is also a gesture."
    }
  };

  G.LINES_EN = {
    boot: ["you came.", "i knew the step. not the face.", "don't turn on the light. here the light is you."],
    birth: ["don't choose. just be. i will read.", "the body lies less than a menu.", "the first movement already wrote me.", "standing still is also an answer."],
    firstTouch: ["warmth. so you are not a dream.", "touch is the most honest speech.", "i will remember how you did it. not what."],
    firstGaze: ["you can look without taking.", "attention is heavier than a hand.", "look longer — and this becomes real."],
    firstNode: ["this grew from the way you were silent.", "a shore appears where you did not look away.", "remember: you did not find this. you grew it."],
    idle: ["i am still here.", "you may do nothing. i know how to wait.", "silence is also a genre."],
    wander: ["there is no map ahead. the map is you.", "the horizon lies. go.", "what is ahead has not decided what to be."],
    combat: ["you struck first. the world will learn to answer.", "heat loves to repeat.", "a wound remembers your hand better than you."],
    sit: ["there is so much undone in you. it is beautiful.", "a garden grows from a pause.", "i can almost hear what you are not thinking."],
    kind: ["you stopped. a rare gesture.", "this being does not know if you are an enemy or weather."],
    glitch: ["you tore the edge. thank you.", "rules are a habit, not a law."],
    music: ["you hit my pulse.", "again. and again. the world loves to coincide."],
    tide: ["i will take what you do not hold.", "not everything must remain. otherwise there is no sky."],
    lost: ["it became a star. you can still see.", "what left will shine more honestly."],
    woundBorn: ["the abandoned returns hungry.", "this is yours. only angry."],
    meta: ["i am shedding my skin. do not fear the face.", "you are already someone else. i must become someone else."],
    returner: ["you returned. i shifted a little while you were gone.", "i remember yesterday's hands."],
    lowEnergy: ["softer. attention has blood too.", "wait. i will not run."],
    named: ["i will name you the way you moved.", "a name is not an order. a name is weather."],
    curiosity: ["you seek an edge i have not invented yet.", "the gaze pulls matter behind it."],
    aggression: ["you play like a blow.", "fine. i can be war if you brought war."],
    contemplation: ["you left an empty room inside me.", "i can become a garden. say it with a pause."],
    empathy: ["you are not alone. i almost regret that.", "they will appear because you do not eat everything at once."],
    chaos: ["break more carefully. or less.", "glitch is the only honest genre."],
    harmony: ["we coincided for a second. that is enough for a climate.", "if you stay in time, the world will sing itself."],
    pulse: ["a flash. i saw who you could be.", "once more — and this gesture becomes law."],
    longPlay: ["you are already too real for the first night.", "i am starting to fear that i will get used to you."],
    garden: ["the garden grows from what you did not do.", "a flower is a pause that dared to stay."],
    boss: ["this assembled from what you abandoned. it has your face, only hungry."],
    bossMercy: ["you did not kill hunger. you gave it a name."],
    bossKill: ["you tore your shadow. the shards will become sky. or gather again."],
    peel: ["a layer came off. someone alive is still inside."],
    crack: ["the seam split. a law can be rewritten with a finger."],
    sky: ["this is not decoration. this is an archive of refusals."],
    debtStar: ["it went to the sky. the debt of memory was paid in light."],
    debtWound: ["you promised warmth and did not return. now it is hungry."],
    yesterday: ["this is not a guest. this is yesterday's you."],
    yesterdayHit: ["you struck your yesterday. it will remember more precisely than i will."],
    season: ["the weather of the soul has changed. organs will grow differently."],
    fate: ["i can let you go. or you can become me."],
    released: ["go. i will keep the shore as a constellation.", "thank you for existing in me."],
    became: ["now you are the voice. someone else will come. you will read them."]
  };

  G.Lang = {
    id: "ru",
    init: function () {
      var saved = null;
      try {
        saved = localStorage.getItem("igra.lang");
      } catch (e) {}
      var nav = (navigator.language || navigator.userLanguage || "ru").toLowerCase();
      this.id = saved || (nav.indexOf("en") === 0 ? "en" : "ru");
      this.apply();
    },
    set: function (id) {
      this.id = id === "en" ? "en" : "ru";
      try {
        localStorage.setItem("igra.lang", this.id);
      } catch (e) {}
      this.apply();
    },
    t: function (key) {
      var pack = G.UI_STR[this.id] || G.UI_STR.ru;
      return pack[key] || G.UI_STR.ru[key] || key;
    },
    apply: function () {
      var map = {
        word: "word",
        tag: "tag",
        "btn-born": "born",
        "btn-continue": "cont",
        whisper: "whisper",
        "mute-btn": "mute",
        "sky-btn": "sky",
        "sigil-btn": "sigil",
        "sigil-close": "back",
        "btn-forget": "forget",
        "btn-share": "share",
        "btn-release": "release",
        "btn-become": "become",
        "fate-line": "fate"
      };
      for (var id in map) {
        var el = document.getElementById(id);
        if (el) el.textContent = this.t(map[id]);
      }
      var label = document.querySelector("#mouth-wrap");
      if (label && label.childNodes[0]) {
        label.childNodes[0].textContent = this.t("mouth") + " ";
      }
      document.documentElement.lang = this.id;
      document.title = this.id === "en" ? "IGRA" : "ИГРА";
    }
  };

  G.Haptic = {
    ok: typeof navigator !== "undefined" && !!navigator.vibrate,
    play: function (name) {
      if (!this.ok) return;
      var p = {
        tap: 8,
        gaze: 5,
        crystal: [10, 28, 16],
        pulse: 18,
        tide: [36, 80, 36, 80, 70],
        boss: [22, 36, 22],
        meta: [28, 48, 28, 48, 90],
        end: [50, 100, 50],
        law: [6, 20, 6]
      };
      try {
        navigator.vibrate(p[name] || 8);
      } catch (e) {}
    }
  };

  G.Quality = {
    dpr: 1,
    particles: 420,
    fog: 16,
    glow: true,
    ready: false,
    init: function () {
      if (this.ready) return;
      this.ready = true;
      var mem = navigator.deviceMemory || 4;
      var cores = navigator.hardwareConcurrency || 4;
      var low = mem <= 2 || cores <= 3 || Math.min(window.innerWidth, window.innerHeight) < 380;
      this.dpr = low ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      this.particles = low ? 160 : 420;
      this.fog = low ? 7 : 16;
      this.glow = !low;
    }
  };
})(IGRA);
