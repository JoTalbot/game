# Physical Android release evidence

This file documents the authoritative handoff for physical Android acceptance.

The release workflow must not treat CI, emulator, simulator, or browser evidence as physical acceptance.

## Required handoff

Before a production tag is created, complete `tools/probe/physical-android-evidence.js` against the exact candidate APK and retain the resulting JSON plus supporting screenshots/logs outside CI.

The release authorization secrets must then be bound to the exact candidate source commit and APK SHA-256:

- `IGRA_PHYSICAL_ANDROID_RELEASE_APPROVED=1`
- `IGRA_RELEASE_APPROVED_COMMIT=<exact candidate commit>`
- `IGRA_RELEASE_APPROVED_APK_SHA256=<exact candidate APK SHA-256>`

The authorization values are an approval control, not a substitute for the physical evidence itself. The evidence JSON remains the source record for the 16-scenario acceptance matrix.
