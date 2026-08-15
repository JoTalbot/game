var IGRA = IGRA || {};
(function (G) {
  "use strict";

  function envGain(ctx, start, peak, attack, release) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);
    return g;
  }

  // Web Audio не убирает за собой. Остановленный осциллятор молчит, но
  // и он, и гейн, через который он шёл, остаются подключены к выходу и
  // продолжают участвовать в сведении. Игра сыплет по ноте на каждый
  // взгляд — за десять минут в графе скапливалось 1700 живых узлов, и
  // человек слышал это как гул, который тем гуще, чем дольше играешь.
  // Отключаем цепочку, как только нота отзвучала.
  function reap(osc, chain) {
    if (!osc) return;
    osc.onended = function () {
      try { osc.disconnect(); } catch (e) {}
      for (var i = 0; i < chain.length; i++) {
        try { chain[i].disconnect(); } catch (e) {}
      }
    };
  }

  G.Audio = {
    ctx: null,
    master: null,
    music: null,
    ready: false,
    muted: false,
    drones: [],
    heart: null,
    noise: null,
    mode: "void",
    dnaFilter: null,
    _lastPluck: 0,

    unlock: function () {
      try {
        this._unlock();
      } catch (e) {}
    },

    _unlock: function () {
      if (this.ready) {
        if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
        return;
      }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(ctx.destination);

      this.music = ctx.createGain();
      this.music.gain.value = 0.7;
      this.music.connect(this.master);

      this.dnaFilter = ctx.createBiquadFilter();
      this.dnaFilter.type = "lowpass";
      this.dnaFilter.frequency.value = 900;
      this.dnaFilter.Q.value = 0.7;
      this.dnaFilter.connect(this.music);

      this._buildDrones();
      this._buildNoise();
      this._buildGarden();
      this._buildHeart();
      this.ready = true;
      if (ctx.state === "suspended") ctx.resume();
    },

    _osc: function (type, freq, dest) {
      var o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      var g = this.ctx.createGain();
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(dest);
      o.start();
      return { o: o, g: g };
    },

    _buildDrones: function () {
      var dest = this.dnaFilter;
      this.drones = [
        this._osc("sine", 55, dest),
        this._osc("sine", 82.4, dest),
        this._osc("triangle", 110, dest),
        this._osc("sine", 164.8, dest)
      ];
      this.drones[0].g.gain.value = 0.12;
      this.drones[1].g.gain.value = 0.07;
      this.drones[2].g.gain.value = 0.03;
      this.drones[3].g.gain.value = 0.02;
    },

    _buildNoise: function () {
      var ctx = this.ctx;
      var buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      // Полоса должна быть УЗКОЙ. При Q 0.4 полоса такая широкая, что
      // на выходе почти белый шум — ровное сипение поверх тишины, и
      // слышно его тем лучше, чем тише всё остальное. Погода — это
      // далёкий прибой, а не помеха в эфире.
      var filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 300;
      filter.Q.value = 1.6;
      var g = ctx.createGain();
      g.gain.value = 0.004;
      src.connect(filter);
      filter.connect(g);
      g.connect(this.music);
      src.start();
      this.noise = { src: src, filter: filter, g: g };
    },

    // Второй слой фона: дыхание сада. Шум — это погода, он не знает,
    // сколько ты вырастил; замер показал, что за десять минут берег
    // растёт с одного узла до полусотни, а звучит ровно одинаково
    // (шум 0.011 от начала до конца). Этот слой — медленная волна,
    // которая тем полнее, чем больше живого вокруг: не мелодия, а
    // ощущение населённости. Пустой берег молчит.
    _buildGarden: function () {
      var ctx = this.ctx;
      var g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.music);
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      lp.Q.value = 0.5;
      lp.connect(g);
      // две расстроенные квинты: живое всегда чуть не в унисон
      var a = this._osc("sine", 196, lp);
      var b = this._osc("sine", 294.3, lp);
      a.g.gain.value = 0.5;
      b.g.gain.value = 0.32;
      // Медленное дыхание: период около двадцати секунд.
      // Размах ОБЯЗАН быть долей уровня, а не числом. Стояло 0.45 при
      // уровне слоя 0.04 — LFO был вдесятеро громче того, что качал, и
      // сад не дышал, а ровно гудел поверх всей игры: человек услышал
      // это как «шум на фоне». Настоящий размах задаётся в update.
      var lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.05;
      var lfoAmt = ctx.createGain();
      lfoAmt.gain.value = 0;
      lfo.connect(lfoAmt);
      lfoAmt.connect(g.gain);
      lfo.start();
      this.garden = { g: g, lp: lp, a: a, b: b, lfo: lfo, amt: lfoAmt, level: 0 };
    },

    _buildHeart: function () {
      var ctx = this.ctx;
      var g = ctx.createGain();
      g.gain.value = 0;
      g.connect(this.master);
      this.heart = { g: g, t: 0, bpm: 58 };
    },

    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.55;
    },

    toggleMute: function () {
      this.setMuted(!this.muted);
      return this.muted;
    },

    beat: function (now) {
      if (!this.ready || !this.heart) return;
      var ctx = this.ctx;
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = 52;
      var g = envGain(ctx, now, 0.18, 0.01, 0.18);
      o.connect(g);
      g.connect(this.heart.g);
      o.start(now);
      o.stop(now + 0.22);
      reap(o, [g]);
      var o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.setValueAtTime(70, now + 0.16);
      var g2 = envGain(ctx, now + 0.16, 0.12, 0.01, 0.2);
      o2.connect(g2);
      g2.connect(this.heart.g);
      o2.start(now + 0.16);
      o2.stop(now + 0.4);
      reap(o2, [g2]);
    },

    setHeart: function (on, bpm) {
      if (!this.heart) return;
      this.heart.on = on;
      if (bpm) this.heart.bpm = bpm;
      var ctx = this.ctx;
      if (!ctx) return;
      this.heart.g.gain.cancelScheduledValues(ctx.currentTime);
      this.heart.g.gain.linearRampToValueAtTime(on ? 1 : 0, ctx.currentTime + 0.4);
    },

    update: function (dt, dna, state, tide, world) {
      if (!this.ready) return;
      var ctx = this.ctx;
      if (ctx.state === "suspended") return;
      var t = ctx.currentTime;
      var c = dna ? dna.blendRgb() : [140, 180, 220];
      var warmth = (c[0] - c[2]) / 255;
      var base = 48 + (dna ? dna.get("harmony") * 18 + dna.get("curiosity") * 10 : 0);
      if (this.drones[0]) {
        this.drones[0].o.frequency.setTargetAtTime(base, t, 0.8);
        this.drones[1].o.frequency.setTargetAtTime(base * 1.5 + warmth * 4, t, 0.8);
        this.drones[2].o.frequency.setTargetAtTime(base * 2 + (dna ? dna.get("chaos") * 7 : 0), t, 0.6);
        this.drones[3].o.frequency.setTargetAtTime(
          base * 3 + (dna ? dna.get("contemplation") * -8 : 0),
          t,
          0.9
        );
      }
      var lp = 700;
      if (dna) {
        lp = 620 + dna.get("curiosity") * 900 + dna.get("chaos") * 700 - dna.get("contemplation") * 280;
      }
      if (state === "title" || state === "birth") lp *= 0.55;
      this.dnaFilter.frequency.setTargetAtTime(G.clamp(lp, 280, 2800), t, 0.6);

      // пока действует закон, берег звучит слегка не собой: гул уходит
      // на четверть тона и возвращается, когда закон отпускает.
      // Это не эффект, а вторая пара глаз: слышно, что мир ещё чужой.
      var bend = this.lawBend || 0;
      if (bend > 0 && this.drones[0]) {
        for (var di = 0; di < this.drones.length; di++) {
          var f = this.drones[di].o.frequency;
          f.setTargetAtTime(f.value * (1 + bend * 0.014 * (di % 2 ? -1 : 1)), t, 1.2);
        }
      }

      // В покое шума почти нет: тишина должна быть тишиной. Всё, что
      // выше пола, означает событие — идёт прилив, буянит хаос, висит
      // закон. Тогда шум слышен как смысл, а не как фон.
      var noise = 0.004;
      if (tide > 0) noise = 0.004 + tide * 0.05;
      if (dna) noise += dna.get("chaos") * 0.008;
      noise += bend * 0.012;
      this.noise.g.gain.setTargetAtTime(noise, t, 0.4);
      this.noise.filter.frequency.setTargetAtTime(320 + (tide || 0) * 800, t, 0.5);

      // Сад дышит громче, когда он полон. Считаем не все узлы, а живые:
      // небо из отпущенного не звучит, звучит то, что растёт сейчас.
      // Укоренённое весит больше — привычка слышнее случайного.
      if (this.garden) {
        var lvl = 0;
        if (world && world.nodes) {
          var alive = 0, rooted = 0;
          for (var ni = 0; ni < world.nodes.length; ni++) {
            var nd = world.nodes[ni];
            if (nd.dead || nd.state !== "alive") continue;
            alive++;
            if (nd.roots >= 0.6) rooted++;
          }
          // Насыщение подобрано по замеру: живой берег держится на
          // 25–55 узлах, поэтому потолок на тридцати делал слой плоским
          // уже к третьей минуте. Пятьдесят — разница между «посадил» и
          // «вырастил» слышна до конца сессии.
          lvl = G.clamp(alive / 50, 0, 1) * 0.055 + G.clamp(rooted / 8, 0, 1) * 0.03;
        }
        if (state === "title" || state === "birth") lvl *= 0.3;
        this.garden.level = lvl;
        this.garden.g.gain.setTargetAtTime(lvl, t, 2.5);
        // дыхание — треть уровня: слышно, что слой живой, но пустой
        // берег молчит по-настоящему, а полный не гудит
        if (this.garden.amt) {
          this.garden.amt.gain.setTargetAtTime(lvl * 0.34, t, 2.5);
        }
        // с приливом сад глохнет: слышно, что мир накрывает
        this.garden.lp.frequency.setTargetAtTime(520 - (tide || 0) * 260, t, 1.0);
      }

      if (this.heart && this.heart.on) {
        this.heart.t += dt;
        var interval = 60 / (this.heart.bpm || 58);
        if (this.heart.t >= interval) {
          this.heart.t -= interval;
          this.beat(t);
        }
      }
    },

    // 0 — берег свой; 1 — над миром висит закон
    setLaw: function (v) {
      this.lawBend = G.clamp(v || 0, 0, 1);
    },

    tone: function (freq, dur, vol, type) {
      if (!this.ready) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.7), t + dur);
      var g = envGain(ctx, t, vol || 0.08, 0.01, dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.05);
      reap(o, [g]);
    },

    chord: function (freqs, dur, vol) {
      for (var i = 0; i < freqs.length; i++) {
        this.tone(freqs[i], dur, (vol || 0.05) * (1 - i * 0.15), i ? "triangle" : "sine");
      }
    },

    pluck: function (freq) {
      if (!this.ready) return;
      var t = this.ctx.currentTime;
      if (t - this._lastPluck < 0.04) return;
      this._lastPluck = t;
      this.tone(freq, 0.35, 0.07, "triangle");
      this.tone(freq * 2.01, 0.18, 0.025, "sine");
    },

    gazeTick: function (p, trait) {
      if (!this.ready) return;
      var f = G.TRAIT_NOTE[trait] || 440;
      this.tone(f * (0.5 + p), 0.12, 0.02 + p * 0.03, "sine");
    },

    crystallize: function (trait) {
      var f = G.TRAIT_NOTE[trait] || 440;
      this.chord([f, f * 1.25, f * 1.5], 1.1, 0.07);
    },

    pulse: function (trait) {
      var f = G.TRAIT_NOTE[trait] || 220;
      this.tone(f * 0.5, 0.4, 0.12, "sine");
      this.tone(f, 0.25, 0.06, "triangle");
    },

    wound: function () {
      this.tone(90, 0.5, 0.1, "sawtooth");
      this.tone(70, 0.7, 0.06, "sine");
    },

    tide: function () {
      if (!this.ready) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(40, t);
      o.frequency.linearRampToValueAtTime(28, t + 2.4);
      var g = envGain(ctx, t, 0.14, 0.4, 2.2);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 2.8);
      reap(o, [g]);
    },

    // Узел утонул. Самое тихое место игры: до 0.4.41 сад уходил в небо
    // совершенно беззвучно — за сессию так исчезало под сорок узлов, и
    // человек не слышал ни одного. Это не удар, а обратная
    // кристаллизация: та же нота породы, но падающая и глухая, будто
    // её накрыли водой.
    forget: function (trait) {
      if (!this.ready) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var f = G.TRAIT_NOTE[trait] || 330;
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f * 0.75, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, f * 0.32), t + 1.1);
      var g = envGain(ctx, t, 0.055, 0.06, 1.0);
      // приглушённо: забвение слышно, но не спорит с приливом
      var lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(900, t);
      lp.frequency.exponentialRampToValueAtTime(220, t + 1.1);
      o.connect(g);
      g.connect(lp);
      lp.connect(this.master);
      o.start(t);
      o.stop(t + 1.3);
      reap(o, [g, lp]);
    },

    // Узел начал держаться сам. Награда за возвращение должна звучать
    // иначе, чем рождение: не вспышка, а опора — низкая нота снизу
    // вверх, короткая квинта, как будто что-то встало на ноги.
    rooted: function (trait) {
      if (!this.ready) return;
      var ctx = this.ctx;
      var t = ctx.currentTime;
      var f = G.TRAIT_NOTE[trait] || 330;
      var o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(f * 0.5, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.75, t + 0.5);
      var g = envGain(ctx, t, 0.075, 0.08, 0.7);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.9);
      reap(o, [g]);
      this.tone(f * 1.5, 0.5, 0.035, "sine");
    },

    metamorphosis: function (dna) {
      var f = dna ? G.TRAIT_NOTE[dna.dominant()] : 440;
      this.chord([f * 0.5, f, f * 1.5, f * 2], 2.4, 0.08);
    },

    ui: function () {
      this.tone(620, 0.12, 0.03, "sine");
    },

    speak: function () {
      if (!this.ready) return;
      var f = 180 + Math.random() * 80;
      this.tone(f, 0.07, 0.025, "sine");
    }
  };
})(IGRA);
