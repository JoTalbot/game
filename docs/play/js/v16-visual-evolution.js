var IGRA = IGRA || {};
(function (G) {
  "use strict";
  function ensure(world) { if (!world.visualV16) world.visualV16 = { season: 0, weather: 0, scars: [], detail: "full" }; return world.visualV16; }
  function profile(width, height, fps) { if ((width || 0) <= 480 || (fps || 60) < 45) return "low"; return "full"; }
  function mark(world, x, y, kind) { var s = ensure(world); s.scars.push({ x: Number(x) || 0, y: Number(y) || 0, kind: String(kind || "trace") }); if (s.scars.length > 64) s.scars.shift(); return s.scars[s.scars.length - 1]; }
  G.V16Visual = { ensure: ensure, profile: profile, mark: mark };
})(IGRA);
