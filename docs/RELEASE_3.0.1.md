# ИГРА 3.0.1 — release checklist

## Scope

V3-046 промотирует RC build metadata с `3.0.0-rc1` на `3.0.1` без изменения production `v3.0.0`.

## Release evidence

- Source commit: `f7e5104e354f26fe3788adb622d3aa2ab22ea90e`
- APK workflow: `33941135101`
- APK workflow URL: https://github.com/JoTalbot/game/actions/runs/33941135101
- Artifact name: `igra-3.0.0-rc1`
- Artifact checksum (archive): `sha256:f97a6723685b380f13cc1df5157bf53639f8db0f56f3f793b9a9fabb8d133f60`

## Release safety

- Existing `v3.0.0` remains immutable.
- Release branch is `release/3.0.1`.
- Do not overwrite or retag `v3.0.0`.
- Final release tag must point at the exact approved release commit after all release-gate checks are green.

## Manual acceptance still required

1. Clean install on Android.
2. Boot → birth → play → save → restart.
3. Upgrade from the existing `3.0.0` save and continue.
4. Process death preserves native save.
5. Offline shell and core loop work.
6. Weak-device run confirms performance guard is effective without breaking touch interaction.
7. Human acceptance of final APK before Play submission.
