var IGRA = IGRA || {};
(function (G) {
  "use strict";

  var KEY = "igra.save.v1";

  G.Save = {
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },
    write: function (data) {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
        return true;
      } catch (e) {
        return false;
      }
    },
    clear: function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
    },
    exists: function () {
      try {
        return !!localStorage.getItem(KEY);
      } catch (e) {
        return false;
      }
    }
  };
})(IGRA);
