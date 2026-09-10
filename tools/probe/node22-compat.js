"use strict";

// Node 22 exposes globalThis.navigator as a runtime getter.
// The legacy probe harness assigns global.navigator directly, so install
// a configurable probe implementation before the harness boots.
const probeNavigator = {
  vibrate: function () {},
  deviceMemory: 4,
  hardwareConcurrency: 4,
  language: "ru",
  userAgent: "probe"
};

try {
  Object.defineProperty(globalThis, "navigator", {
    value: probeNavigator,
    configurable: true,
    enumerable: true,
    writable: true
  });
} catch (error) {
  // Older runtimes may already provide a writable navigator. Leave it alone.
}
