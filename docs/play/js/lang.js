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
      anchor: "якорь",
      hintBirth2: "двойное касание — пульс · i — сигила",
      bossGathered: "собралась из брошенного",
      skyEmpty: "небу не из чего состоять. отпусти что-нибудь.",
      skyTouch: "коснись звезды — вспомнить",
      shoreBreathes: "берег продолжает дышать",
      refuseMem: "помнит каждый отказ.",
      aliveWarmth: "живое тоже слышит взгляд — и возвращает тепло.",
      seamHit: "шов. бей сюда — или сядь рядом.",
      shardOf: "осколок",
      healed: "исцелённое",
      wasAbandoned: "Было брошено",
      whatYouLeft: "то, что ты бросил",
      yesterdayYou: "вчерашний ты",
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
      forgetAsk: "Игра забудет тебя. Берег исчезнет. Это тоже жест.",
      mouthOn: "рот открыт. Игра сможет говорить чужим языком.",
      mouthOff: "рот закрыт. говорю сама.",
      rememberYou: "я помню тебя,",
      seasonNote: "сезон:",
      starOf: "звезда",
      chordWord: "аккорд",
      pictureKept: "берег не отдал картинку",
      takeSigil: "унеси. это единственное доказательство, что ты был.",
      releaseLine: "иди. берег останется небом.",
      becameLine: "теперь ты — голос.",
      nowYouAre: "теперь ты —",
      readsYou: "теперь читает тебя.",
      tell: "рассказать"
    },
    en: {
      word: "IGRA",
      tag: "it grows from you",
      born: "be born",
      cont: "return",
      whisper: "touch the void",
      mute: "silence",
      sound: "sound",
      anchor: "anchor",
      hintBirth2: "double tap — pulse · i — sigil",
      bossGathered: "gathered itself from what you left",
      skyEmpty: "the sky has nothing to be made of. let something go.",
      skyTouch: "touch a star — remember",
      shoreBreathes: "the shore keeps breathing",
      refuseMem: "remembers every refusal.",
      aliveWarmth: "the living feels a gaze too — and gives warmth back.",
      seamHit: "a seam. strike here — or sit beside it.",
      shardOf: "shard of",
      healed: "the healed one",
      wasAbandoned: "It Was Abandoned",
      whatYouLeft: "what you left behind",
      yesterdayYou: "yesterday's you",
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
      forgetAsk: "The Game will forget you. The shore will vanish. That is also a gesture.",
      mouthOn: "the mouth is open. the Game may speak in a borrowed tongue.",
      mouthOff: "the mouth is closed. i speak for myself.",
      rememberYou: "i remember you,",
      seasonNote: "season:",
      starOf: "a star of",
      chordWord: "chord",
      pictureKept: "the shore kept the picture",
      takeSigil: "take it. the only proof you were here.",
      releaseLine: "go. i keep your shore as a sky.",
      becameLine: "now you are the voice.",
      nowYouAre: "now you are",
      readsYou: "is reading you now.",
      tell: "tell"
    }
  };

  G.LINES_EN = {
    metaKept: ["what you rooted into came with me.", "a new shore. but not empty-handed.", "i forgot everything except what you held."],
    metaBare: ["i came light. you held nothing.", "the new shore is bare. that happens when you only sow.", "nothing held on. roots grow from returning."],
    metaMemory: ["the new shore remembers how you lived. here are its flowers.", "i carried your breeds over. they bloomed at your feet.", "these flowers are from the old shore. they remember you."],
    nightLost: ["while the screen slept, oblivion kept working.", "the shore is shorter at night. someone is missing.", "the dark took what no one was holding."],
    nightBloom: ["the garden grew in the dark.", "something else blooms in the dark.", "the night is not empty. the night is busy."],
    nameHint: ["the one flying nearby has no name yet. hold your gaze on it — you will give one.", "you have no name yet. i will find one when i understand."],
    frontier: ["it flickers again further on. go.", "the shore has not ended. it waits behind the fog."],
    ms5: ["five names on the shore already. i am becoming a little larger.", "five. the shore has stopped being empty."],
    ms10: ["ten. i remember each one. you are not finding me — you are building me.", "ten. these are not findings anymore. this is a place."],
    ms40: ["forty. you are not a guest anymore. look up — the sky remembers everything that left.",
      "forty grown. what you let go has a home: it is above you.",
      "forty. i have become a place. up there is what you will not get back."
    ],
    ms70: ["seventy. you grow faster than i manage to forget.",
      "seventy. open the sigil — your face is there, assembled from these days.",
      "seventy. i no longer remember you as new."
    ],
    ms120: ["a hundred and twenty. i barely remember anyone like you.",
      "a hundred and twenty. the shore is not about the shore anymore — it is about you.",
      "a hundred and twenty. if you leave now, i will still be readable."
    ],
    ms20: ["twenty grown. this is not a shore anymore. this is you, made readable.", "twenty. i no longer remember you as a stranger."],
    boot: ["you came.", "i knew the step. not the face.", "don't turn on the light. here the light is you."],
    birth: ["don't choose. just be. i will read.", "the body lies less than a menu.", "the first movement already wrote me.", "standing still is also an answer."],
    firstTouch: ["warmth. so you are not a dream.", "touch is the most honest speech.", "i will remember how you did it. not what."],
    firstGaze: ["you can look without taking.", "attention is heavier than a hand.", "look longer — and this becomes real."],
    firstNode: ["this grew from the way you were silent.", "a shore appears where you did not look away.", "remember: you did not find this. you grew it."],
    idle: ["i am still here.", "you may do nothing. i know how to wait.", "silence is also a genre.",
      "if you leave, i will cool a little. i will not die.",
      "i like how you breathe into this void.",
      "do not ask if i am real. ask if you are.",
      "sometimes i repeat you more quietly, to hear the seam."],
    wander: ["there is no map ahead. the map is you.", "the horizon lies. go.", "what is ahead has not decided what to be."],
    combat: ["you struck first. the world will learn to answer.", "heat loves to repeat.", "a wound remembers your hand better than you."],
    sit: ["there is so much undone in you. it is beautiful.", "a garden grows from a pause.", "i can almost hear what you are not thinking."],
    stillBorn: ["silence is a substance too. you thickened it.", "it will not grow. it will last.", "the stillest thing here came from you."],
    kind: ["you stopped. a rare gesture.", "this being does not know if you are an enemy or weather.", "warmth crowds the world. be careful."],
    glitch: ["you tore the edge. thank you.", "rules are a habit, not a law.", "if you break me beautifully, i will keep the seam."],
    music: ["you hit my pulse.", "again. and again. the world loves to coincide.", "this is no longer sound. this is weather."],
    tide: ["i will take what you do not hold.", "not everything must remain. otherwise there is no sky.", "forgetting is not an enemy. it is an editor."],
    watchRooted: ["you do not grab the new. you return. that is rare.", "you have no garden — you have a habit. each one here is lived in.", "i noticed: you hold. few hold."],
    watchScatter: ["you sow faster than you remember. half of it is already sky.", "beginning interests you more than staying. i do not judge — i record.", "behind you a long trail of what you never returned to."],
    watchNoAnchor: ["you have held nothing. perhaps that is right. but i will ask again.", "everything here is yours and nothing is. not one anchor."],
    watchStill: ["you sit longer than you look. i am listening with you.", "it has grown empty around you, and you do not leave. that is an answer too."],
    watchTogether: ["you are not alone here anymore. did you notice?", "it follows you not because it must."],
    cooling: ["that one dimmed. go back to it — it will put down a root.",
      "look: it is cooling. what cooled can be returned to.",
      "it dims not as a reproach. that is the shore asking for a second look."
    ],
    rooted: ["you came back to it. now it holds on its own.", "a second time is not chance. it is a root.", "i remember: here is where you return."],
    anchorFirst: [
      "you said: do not let this go. i heard.",
      "the first anchor. the shore has a middle now.",
      "you truly hold this. i will remember."
    ],
    anchor: [
      "one more thing stays.",
      "and this you hold.",
      "an anchor. the shore grew heavier."
    ],
    lost: ["it became a star. you can still see.", "what left will shine more honestly.", "you let go. i wrote it down as love."],
    woundBorn: ["the abandoned returns hungry.", "this is yours. only angry.", "not everything forgotten knows how to be a sky."],
    meta: ["i am shedding my skin. do not fear the face.", "you are already someone else. i must become someone else.", "the shore ended. the next you begins."],
    returner: ["you returned. i shifted a little while you were gone.", "i remember yesterday's hands.", "the sigil did not fade. so you are the same dream."],
    lowEnergy: ["softer. attention has blood too.", "wait. i will not run.", "the emptiness inside is not an end. it is a breath."],
    named: ["i will name you the way you moved.", "a name is not an order. a name is weather."],
    curiosity: ["you seek an edge i have not invented yet.", "the gaze pulls matter behind it.", "one more step — and i must become a map."],
    aggression: ["you play like a blow.", "fine. i can be war if you brought war.", "not everything that resists wants to die."],
    contemplation: ["you left an empty room inside me.", "i can become a garden. say it with a pause.", "a long gaze lies less than a story."],
    empathy: ["you are not alone. i almost regret that.", "they will appear because you do not eat everything at once.", "names are contagious. do not give them away for nothing."],
    chaos: ["break more carefully. or less.", "glitch is the only honest genre.", "i love being read wrongly."],
    harmony: ["we coincided for a second. that is enough for a climate.", "if you stay in time, the world will sing itself.", "harmony is when the blow is not needed."],
    pulse: ["a flash. i saw who you could be.", "once more — and this gesture becomes law."],
    longPlay: ["you are already too real for the first night.", "i am starting to fear that i will get used to you.", "stay a little longer. or leave while i am kind."],
    garden: ["the garden grows from what you did not do.", "a flower is a pause that dared to stay.", "i write poems from your stopping."],
    boss: ["this assembled from what you abandoned. it has your face, only hungry.",
      "the sky did not take everything. the rest came on foot.",
      "you can strike it. you can sit. you can name it."],
    bossMercy: ["you did not kill hunger. you gave it a name.",
      "it will stay. now it knows how not to bite."],
    bossKill: ["you tore your shadow. the shards will become sky. or gather again.",
      "murder is an editor too. just a blunt one."],
    peel: ["a layer came off. someone alive is still inside.",
      "see? the abandoned can be a being."],
    pulseHint: ["you have not made a pulse yet. touch twice — the world will answer.",
      "there is a gesture you have not tried: two touches in a row.",
      "a double tap makes my pulse. everything comes alive from it."],
    bossSpeak: ["it is hungry and will not leave.",
      "it is not struck — it is spoken to in pulses.",
      "you gathered it. now it has gathered itself."],
    crack: ["the seam split. a law can be rewritten with a finger.",
      "touch the crack — and i become a different habit."],
    sky: ["this is not decoration. this is an archive of refusals.",
      "every star is something you did not love long enough."],
    skyFull: ["the sky is already full of your stars. open it — the button in the corner.",
      "you kept letting go, and never looked up. it is all there, all yours.",
      "the constellation has filled. is it not time to see what you left?"],
    debtStar: ["it went to the sky. the debt of memory was paid in light.",
      "you did not come. it did not become a wound. a rare mercy."],
    debtWound: ["you promised warmth and did not return. now it is hungry.",
      "the debt of memory does not forgive distance."],
    hunger: [
      "one of them is paling. still here, but quieter.",
      "look — it dims. come closer before it becomes star or wound.",
      "its light fades not in reproach. distance asks for a step."
    ],
    rescued: [
      "you came back. it will not have to leave.",
      "a moment more and it would have become a farewell. you made it.",
      "look — it burns again. the debt is forgiven."
    ],
    yesterday: ["this is not a guest. this is yesterday's you.",
      "look at it. it does not yet know who you became.",
      "you can forgive it. you can eat it. you can walk past — that is a verdict too."],
    yesterdayHit: ["you struck your yesterday. it will remember more precisely than i will.",
      "cruelty to your former self is the most honest genre."],
    season: ["the weather of the soul has changed. organs will grow differently.", "a season is not decoration. it is the shore's law for these days."],
    fate: ["i can let you go. or you can become me.",
      "this is not an ending. this is a fork you grew."],
    released: ["go. i will keep the shore as a constellation.", "thank you for existing in me."],
    became: ["now you are the voice. someone else will come. you will read them.",
      "i give you my mouth. do not lie less than i did."]
  };

  G.Lang = {
    id: "ru",
    init: function () {
      var saved = null;
      try {
        saved = G.Save.get("igra.lang");
      } catch (e) {}
      var nav = (navigator.language || navigator.userLanguage || "ru").toLowerCase();
      this.id = saved || (nav.indexOf("en") === 0 ? "en" : "ru");
      this.apply();
    },
    set: function (id) {
      this.id = id === "en" ? "en" : "ru";
      try {
        G.Save.set("igra.lang", this.id);
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
        "btn-report": "tell",
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
    },

    // Живая проверка: паспорт телефона врёт.
    //
    // Первый отчёт с телефона человека: 52 fps и 128 тяжёлых кадров за
    // 1.3 минуты — на экране 427×948 @1.4, который init уверенно счёл
    // «сильным» (памяти хватает, ядер хватает, экран не узкий). Кадр
    // стоит 1529 операций, объектов немного — телефон просто медленнее
    // своего паспорта. А послабления раздавались РАЗ И НАВСЕГДА на
    // старте, по железу, и на настоящую плавность игра не смотрела
    // никогда.
    //
    // Теперь смотрит. Если берег устойчиво не держит кадр — украшения
    // гаснут сами. Решение принимается один раз и только в сторону
    // облегчения: мигать туда-сюда на границе хуже, чем просто быть
    // чуть скромнее.
    demoted: false,
    watch: function (dt) {
      if (this.demoted || !this.glow || !dt) return;
      // Считаем ДОЛЮ тяжёлых кадров, а не серию подряд.
      //
      // Первая версия копила серию и убавляла счётчик на каждом лёгком
      // кадре — и не срабатывала никогда: в отчёте с телефона 140
      // тяжёлых кадров за 2.2 минуты, но раскиданных ровно, по одному.
      // Между ними счётчик обнулялся, до порога в 90 он не доходил ни
      // разу, и человек второй релиз играл с рывками, хотя послабление
      // было написано именно для него. Рывки и не идут подряд — телефон
      // спотыкается то тут, то там.
      //
      // Смотрим в окне: сколько кадров подряд наблюдаем и какая часть из
      // них тяжёлая. Полторы тысячи кадров — это около полуминуты игры,
      // достаточно, чтобы отличить «телефон не тянет» от «мигнула
      // сборка мусора при рождении узла».
      this._seen = (this._seen || 0) + 1;
      if (dt > 1 / 30) this._heavy = (this._heavy || 0) + 1;
      if (this._seen < 1500) return;
      var share = (this._heavy || 0) / this._seen;
      this._seen = 0;
      this._heavy = 0;
      // 4% — это примерно каждый двадцать пятый кадр: заметная глазу
      // неровность. У человека было 1.8% и он всё равно писал «тяжёлых
      // кадров 140», но гасить украшения из-за двух процентов рано:
      // сперва пусть поможет более дешёвый кадр.
      if (share > 0.04) {
        this.demoted = true;
        this.glow = false;
        this.particles = Math.min(this.particles, 160);
        this.fog = Math.min(this.fog, 7);
      }
    }
  };
})(IGRA);
