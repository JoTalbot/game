var IGRA = IGRA || {};
(function (G) {
  "use strict";

  G.UI = {
    game: null,

    bind: function (game) {
      this.game = game;
      var self = this;
      var sigilBtn = document.getElementById("sigil-btn");
      var continueBtn = document.getElementById("btn-continue");
      var bornBtn = document.getElementById("btn-born");
      var forgetBtn = document.getElementById("btn-forget");
      var closeSigil = document.getElementById("sigil-close");
      var muteBtn = document.getElementById("mute-btn");
      var skyBtn = document.getElementById("sky-btn");
      var shareBtn = document.getElementById("btn-share");
      var mouth = document.getElementById("mouth-url");
      var langBtn = document.getElementById("lang-btn");
      var relBtn = document.getElementById("btn-release");
      var becBtn = document.getElementById("btn-become");

      if (sigilBtn) sigilBtn.addEventListener("click", function () {
        G.Audio.unlock();
        self.toggleSigil(game);
      });
      if (closeSigil) closeSigil.addEventListener("click", function () {
        self.toggleSigil(game, false);
      });
      if (muteBtn) muteBtn.addEventListener("click", function () {
        G.Audio.unlock();
        self.setMute(G.Audio.toggleMute());
      });
      if (skyBtn) skyBtn.addEventListener("click", function () {
        G.Audio.unlock();
        G.Organs.toggleSky(game);
      });
      if (shareBtn) shareBtn.addEventListener("click", function () {
        self.shareSigil(game);
      });
      if (langBtn) {
        langBtn.textContent = G.Lang.id === "en" ? "RU" : "EN";
        langBtn.addEventListener("click", function () {
          G.Lang.set(G.Lang.id === "en" ? "ru" : "en");
          if (G.Report) G.Report.act("lang");
          langBtn.textContent = G.Lang.id === "en" ? "RU" : "EN";
          G.Audio.ui();
        });
      }
      var reportBtn = document.getElementById("btn-report");
      var reportClose = document.getElementById("report-close");
      var reportCopy = document.getElementById("report-copy");
      if (reportBtn) reportBtn.addEventListener("click", function () {
        self.toggleSigil(game, false);
        self.openReport(game);
      });
      if (reportClose) reportClose.addEventListener("click", function () {
        self.closeReport();
      });
      if (reportCopy) reportCopy.addEventListener("click", function () {
        self.copyReport(game);
      });

      if (relBtn) relBtn.addEventListener("click", function () {
        G.Fate.release(game);
      });
      if (becBtn) becBtn.addEventListener("click", function () {
        G.Fate.become(game);
      });
      if (mouth) {
        mouth.value = G.Mouth.get();
        mouth.addEventListener("change", function () {
          G.Mouth.set(mouth.value);
          G.UI.hint(G.Lang.t(mouth.value ? "mouthOn" : "mouthOff"));
          setTimeout(function () {
            G.UI.hint("");
          }, 2800);
        });
      }
      function birthNow(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        try {
          G.Audio.unlock();
        } catch (err) {}
        if (game.state === "title") game.startBirth();
      }
      if (bornBtn) {
        bornBtn.addEventListener("click", birthNow);
        bornBtn.addEventListener("touchend", birthNow, { passive: false });
        bornBtn.addEventListener("pointerup", birthNow);
      }
      if (continueBtn) {
        if (G.Save.exists()) continueBtn.classList.add("show");
        function goBack(e) {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          try {
            G.Audio.unlock();
          } catch (err) {}
          if (game.load()) {
            game.state = "play";
            document.body.classList.remove("title-mode");
            document.getElementById("title-screen").style.display = "none";
            G.UI.hint(G.Lang.t("rememberYou") + " " + game.dna.name());
            G.UI.paintSeason();
            setTimeout(function () {
              G.UI.hint("");
            }, 5000);
          }
        }
        continueBtn.addEventListener("click", goBack);
        continueBtn.addEventListener("touchend", goBack, { passive: false });
      }
      if (forgetBtn) forgetBtn.addEventListener("click", function () {
        if (confirm(G.Lang.t("forgetAsk"))) {
          game.forgetSelf();
        }
      });

      var title = document.getElementById("title-screen");
      if (title) {
        function tapTitle(e) {
          if (e.target && e.target.closest && e.target.closest("button")) return;
          // Тап в пустоту титула рождает только того, кто ещё не жил —
          // иначе случайное касание стирает прошлую жизнь (см. engine.onDown).
          if (!G.Save.exists()) birthNow(e);
        }
        title.addEventListener("click", tapTitle);
        title.addEventListener("touchend", tapTitle, { passive: false });
        title.addEventListener("pointerup", tapTitle);
      }

      // Тестовый «быстрый конец»: пять быстрых касаний по логотипу «ИГРА»
      // включают отладку, развилка судьбы придёт почти сразу. Для проверки
      // обеих концовок на устройстве; обычному игроку незаметно.
      var wordEl = document.getElementById("word");
      if (wordEl) {
        var tapCount = 0, tapLast = 0;
        function countTap(e) {
          if (e && e.stopPropagation) e.stopPropagation();
          var now = Date.now();
          tapCount = (now - tapLast < 600) ? tapCount + 1 : 1;
          tapLast = now;
          if (tapCount >= 5) {
            tapCount = 0;
            G.DEBUG = G.DEBUG || {};
            G.DEBUG.fast = true;
            try { G.Save.set("igra.debug.fast", "1"); } catch (err) {}
            G.UI.hint("тест: конец близко");
            setTimeout(function () { G.UI.hint(""); }, 3000);
          }
        }
        wordEl.addEventListener("click", countTap);
        wordEl.addEventListener("touchend", countTap, { passive: false });
      }
    },

    hint: function (text) {
      var el = document.getElementById("hint");
      if (!el) return;
      el.textContent = text || "";
      el.classList.toggle("on", !!text);
    },

    setMute: function (muted) {
      var b = document.getElementById("mute-btn");
      if (b) b.textContent = muted ? G.Lang.t("sound") : G.Lang.t("mute");
    },

    toggleSigil: function (game, force) {
      var scr = document.getElementById("sigil-screen");
      if (!scr) return;
      var on = force == null ? !scr.classList.contains("on") : force;
      scr.classList.toggle("on", on);
      // Считаем ОТКРЫТИЕ, а не переключение: закрыть — не поступок.
      if (on && G.Report) G.Report.act("sigil");
      if (on) this.drawSigil(game);
      G.Audio.ui();
    },

    drawSigil: function (game) {
      var canvas = document.getElementById("sigil-canvas");
      if (!canvas) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var size = 280;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      var ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      var cx = size / 2;
      var cy = size / 2;
      var dna = game.dna;
      var col = dna.blendRgb();

      var bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
      bg.addColorStop(0, G.rgb(col[0], col[1], col[2], 0.18));
      bg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      var pts = dna.points(cx, cy, 108);
      ctx.beginPath();
      for (var i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = G.rgb(col[0], col[1], col[2], 0.12);
      ctx.fill();
      ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.75);
      ctx.lineWidth = 1.4;
      ctx.stroke();

      for (var j = 0; j < pts.length; j++) {
        var p = pts[j];
        var c = G.TRAIT_COLOR[p.k];
        ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.9);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + p.n * 5, 0, G.TAU);
        ctx.fill();
        ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.95);
        ctx.font = "600 13px Manrope, sans-serif";
        ctx.textAlign = "center";
        var ang = -Math.PI / 2 + j * (Math.PI / 3);
        ctx.fillText(G.traitName(p.k), cx + Math.cos(ang) * 128, cy + Math.sin(ang) * 128 + 3);
      }

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, G.TAU);
      ctx.fill();

      // Сигила — отпечаток, а не просто портрет ДНК. Двое с одной ДНК, но
      // разной историей, обязаны дать разный знак — иначе «нельзя
      // подделать» пустые слова, а не обещание. Поступки оставляют след
      // на форме: каждый прожитый берег — тонкое кольцо наружу (чем дальше,
      // тем тусклее — история, а не счёт), каждое удержанное — засечка на
      // внешнем кольце, как якорь на карте. Цифры рядом (статистика) говорят
      // сколько, а форма — что это уже не подделать.
      var meta = Math.max(0, game.world.meta || 0);
      for (var sh = 0; sh < Math.min(meta, 12); sh++) {
        ctx.beginPath();
        ctx.strokeStyle = G.rgb(col[0], col[1], col[2], 0.12 + sh * 0.015);
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, 116 + sh * 3.4, 0, G.TAU);
        ctx.stroke();
      }
      var held = Math.max(0, game.world.saved || 0);
      if (held > 0) {
        var outer = 122 + Math.min(meta, 12) * 3.4;
        var cap = Math.min(held, 24);
        for (var hk = 0; hk < cap; hk++) {
          var ha2 = -Math.PI / 2 + hk * (G.TAU / cap);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ha2) * outer, cy + Math.sin(ha2) * outer, 1.3, 0, G.TAU);
          ctx.fill();
        }
      }

      var name = document.getElementById("sigil-name");
      var sub = document.getElementById("sigil-sub");
      var stats = document.getElementById("sigil-stats");
      if (name) name.textContent = dna.name();
      if (sub) sub.textContent = G.traitHint(dna.dominant());
      if (stats) {
        // сигила — лицо игры, она обязана говорить на языке человека
        var T = function (k) {
          return G.Lang ? G.Lang.t(k) : k;
        };
        stats.innerHTML =
          "<span>" + T("statShores") + " " +
          game.world.meta +
          "</span><span>" + T("statGrown") + " " +
          game.world.discovered +
          "</span><span>" + T("statLost") + " " +
          game.world.lost +
          "</span><span>" + T("statHeld") + " " +
          game.world.saved +
          "</span><span>" + T("statBeings") + " " +
          game.world.beings.length +
          "</span><span>" + T("statRoads") + " " +
          (game.world.arrived || 0) +
          "</span>";
      }
      var verses = document.getElementById("sigil-verses");
      if (verses) {
        var last = (game.world.verses || []).slice(-3).map(function (v) {
          return G.verseText(v);
        });
        verses.innerHTML = last.join("<br>");
      }
      var seasonEl = document.getElementById("sigil-season");
      if (seasonEl) {
        var Ts = function (k) {
          return G.Lang ? G.Lang.t(k) : k;
        };
        seasonEl.textContent =
          Ts("seasonWord") + " «" + G.Memory.climateName() + "». " +
          Ts("dayWord") + " " + G.Memory.days + ". " + G.Memory.climateHint();
      }
      this.paintSeason();
    },

    // Экран отчёта. Игра спрашивает — человек отвечает касанием, текст
    // собирается сам и уходит в буфер одной кнопкой. Печатать на телефоне
    // после часа игры никто не станет, поэтому поле «своими словами»
    // необязательное и стоит последним.
    openReport: function (game) {
      var scr = document.getElementById("report-screen");
      if (!scr) return;
      var R = G.Report;
      var self = this;

      var title = document.getElementById("report-title");
      var sub = document.getElementById("report-sub");
      var en = G.Lang && G.Lang.id === "en";
      if (title) title.textContent = en ? "tell the shore" : "что скажешь берегу";
      if (sub) {
        sub.textContent = en
          ? "i remember what i did. i cannot know how it felt."
          : "я помню, что делала. я не знаю, каково это было.";
      }
      var note = document.getElementById("report-note");
      if (note) note.placeholder = en ? "in your own words (optional)" : "своими словами (необязательно)";
      var copyBtn = document.getElementById("report-copy");
      if (copyBtn) copyBtn.textContent = en ? "copy" : "скопировать";
      var closeBtn = document.getElementById("report-close");
      if (closeBtn) closeBtn.textContent = G.Lang.t("back");

      var asks = document.getElementById("report-asks");
      if (asks) {
        asks.innerHTML = "";
        for (var i = 0; i < R.ASKS.length; i++) {
          (function (a) {
            var row = document.createElement("div");
            row.className = "ask";
            var q = document.createElement("span");
            q.className = "ask-q";
            q.textContent = R.askText(a);
            row.appendChild(q);
            var opts = R.optText(a);
            for (var j = 0; j < opts.length; j++) {
              (function (label) {
                var b = document.createElement("button");
                b.type = "button";
                b.textContent = label;
                if (R.answers[a.id] === label) b.className = "on";
                b.addEventListener("click", function () {
                  // второе касание по тому же — снять ответ: человек
                  // не должен застревать в случайно нажатом
                  R.answers[a.id] = R.answers[a.id] === label ? "" : label;
                  G.Audio.ui();
                  self.openReport(game);
                });
                row.appendChild(b);
              })(opts[j]);
            }
            asks.appendChild(row);
          })(R.ASKS[i]);
        }
      }
      this.paintReport(game);
      scr.classList.add("on");
    },

    paintReport: function (game) {
      var pre = document.getElementById("report-text");
      if (pre) pre.textContent = G.Report.text(game);
    },

    // Кто-то мог поставить продолжение на закрытие отчёта: «стать игрой»
    // ждёт рассказа, прежде чем стереть берег и перезапустить мир.
    afterReport: null,

    closeReport: function () {
      var scr = document.getElementById("report-screen");
      if (scr) scr.classList.remove("on");
      var next = this.afterReport;
      this.afterReport = null;
      if (next) setTimeout(next, 400);
    },

    copyReport: function (game) {
      this.paintReport(game);
      var text = G.Report.text(game);
      var btn = document.getElementById("report-copy");
      var en = G.Lang && G.Lang.id === "en";
      function done(okFlag) {
        if (!btn) return;
        btn.textContent = okFlag ? (en ? "copied" : "скопировано")
                                 : (en ? "select and copy" : "выдели и скопируй");
        setTimeout(function () {
          btn.textContent = en ? "copy" : "скопировать";
        }, 2400);
      }
      // WebView без https не всегда даёт clipboard — запасной путь
      // обязателен, иначе кнопка молча ничего не делает.
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { done(true); },
                                                   function () { done(fallback(text)); });
          return;
        }
      } catch (e) {}
      done(fallback(text));

      function fallback(t) {
        try {
          var ta = document.createElement("textarea");
          ta.value = t;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          var okc = document.execCommand && document.execCommand("copy");
          document.body.removeChild(ta);
          return !!okc;
        } catch (err) { return false; }
      }
    },

    law: function (text) {
      var el = document.getElementById("law");
      if (!el) return;
      el.textContent = text || "";
      el.classList.add("on");
      clearTimeout(this._lawT);
      this._lawT = setTimeout(function () {
        el.classList.remove("on");
      }, 4200);
    },

    paintSeason: function () {
      var el = document.getElementById("season");
      if (!el) return;
      el.textContent = G.Memory.climateName();
    },

    shareSigil: function (game) {
      var canvas = document.getElementById("sigil-canvas");
      if (!canvas) return;
      var title = game.dna.name();
      var text = G.Lang.id === "en" ? title + " — IGRA" : title + " — ИГРА";
      try {
        if (canvas.toBlob && navigator.share && navigator.canShare) {
          canvas.toBlob(function (blob) {
            if (!blob) return;
            var file = new File([blob], "igra-sigil.png", { type: "image/png" });
            var data = { title: title, text: text, files: [file] };
            if (navigator.canShare(data)) navigator.share(data).catch(function () {});
            else {
              var a = document.createElement("a");
              a.download = "igra-sigil.png";
              a.href = URL.createObjectURL(blob);
              a.click();
            }
          });
        } else {
          var a = document.createElement("a");
          a.download = "igra-sigil.png";
          a.href = canvas.toDataURL("image/png");
          a.click();
        }
        G.Voice.sayText(G.Lang.t("takeSigil"), true);
      } catch (e) {
        G.UI.hint(G.Lang.t("pictureKept"));
      }
    }
  };

  G.onBack = function () {
    if (!G.app) return;
    var fate = document.getElementById("fate-screen");
    if (fate && fate.classList.contains("on")) {
      fate.classList.remove("on");
      return;
    }
    if (G.app.sky) {
      G.Organs.toggleSky(G.app, false);
      return;
    }
    var scr = document.getElementById("sigil-screen");
    if (scr && scr.classList.contains("on")) {
      G.UI.toggleSigil(G.app, false);
      return;
    }
    G.UI.toggleSigil(G.app, true);
  };
  G.pause = function () {
    if (G.app) G.app.save();
    if (G.Audio.ctx && G.Audio.ctx.state === "running") G.Audio.ctx.suspend();
  };
  G.resume = function () {
    if (G.Audio.ctx && G.Audio.ctx.state === "suspended") G.Audio.ctx.resume();
  };
})(IGRA);
