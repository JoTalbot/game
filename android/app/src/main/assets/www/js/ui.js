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
      if (mouth) {
        mouth.value = G.Mouth.get();
        mouth.addEventListener("change", function () {
          G.Mouth.set(mouth.value);
          G.UI.hint(mouth.value ? "рот открыт. Игра сможет говорить чужим языком." : "рот закрыт. говорю сама.");
          setTimeout(function () {
            G.UI.hint("");
          }, 2800);
        });
      }
      if (bornBtn) bornBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        G.Audio.unlock();
        if (game.state === "title") game.startBirth();
      });
      if (continueBtn) {
        if (G.Save.exists()) continueBtn.classList.add("show");
        continueBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          G.Audio.unlock();
          if (game.load()) {
            game.state = "play";
            document.getElementById("title-screen").style.display = "none";
            G.UI.hint("я помню тебя, " + game.dna.name());
            G.UI.paintSeason();
            setTimeout(function () {
              G.UI.hint("");
            }, 5000);
          }
        });
      }
      if (forgetBtn) forgetBtn.addEventListener("click", function () {
        if (confirm("Игра забудет тебя. Берег исчезнет. Это тоже жест.")) {
          game.forgetSelf();
        }
      });

      var title = document.getElementById("title-screen");
      if (title) {
        title.addEventListener("click", function (e) {
          if (e.target.closest("button")) return;
          G.Audio.unlock();
          if (game.state === "title") game.startBirth();
        });
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
      if (b) b.textContent = muted ? "звук" : "тишина";
    },

    toggleSigil: function (game, force) {
      var scr = document.getElementById("sigil-screen");
      if (!scr) return;
      var on = force == null ? !scr.classList.contains("on") : force;
      scr.classList.toggle("on", on);
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
        ctx.fillStyle = G.rgb(c[0], c[1], c[2], 0.7);
        ctx.font = "500 11px Manrope, sans-serif";
        ctx.textAlign = "center";
        var ang = -Math.PI / 2 + j * (Math.PI / 3);
        ctx.fillText(G.TRAIT_RU[p.k], cx + Math.cos(ang) * 128, cy + Math.sin(ang) * 128 + 3);
      }

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, G.TAU);
      ctx.fill();

      var name = document.getElementById("sigil-name");
      var sub = document.getElementById("sigil-sub");
      var stats = document.getElementById("sigil-stats");
      if (name) name.textContent = dna.name();
      if (sub) sub.textContent = G.TRAIT_HINT[dna.dominant()];
      if (stats) {
        stats.innerHTML =
          "<span>берегов " +
          game.world.meta +
          "</span><span>выращено " +
          game.world.discovered +
          "</span><span>отпущено " +
          game.world.lost +
          "</span><span>удержано " +
          game.world.saved +
          "</span><span>существ " +
          game.world.beings.length +
          "</span>";
      }
      var verses = document.getElementById("sigil-verses");
      if (verses) {
        var last = (game.world.verses || []).slice(-3);
        verses.innerHTML = last.join("<br>");
      }
      var seasonEl = document.getElementById("sigil-season");
      if (seasonEl) {
        seasonEl.textContent =
          "сезон «" + G.Memory.climate().id + "». день " + G.Memory.days + ". " + G.Memory.climate().hint;
      }
      this.paintSeason();
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
      el.textContent = G.Memory.climate().id;
    },

    shareSigil: function (game) {
      var canvas = document.getElementById("sigil-canvas");
      if (!canvas) return;
      try {
        var a = document.createElement("a");
        a.download = "igra-sigil.png";
        a.href = canvas.toDataURL("image/png");
        a.click();
        G.Voice.sayText("унеси. это единственное доказательство, что ты был.", true);
      } catch (e) {
        G.UI.hint("берег не отдал картинку");
      }
    }
  };

  G.onBack = function () {
    if (!G.app) return;
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
