# ИГРА 3.0.1 — release evidence

V3-046 release candidate metadata is prepared without modifying production `v3.0.0`.

- Approved source before release evidence: `f7e5104e354f26fe3788adb622d3aa2ab22ea90e`
- APK workflow: https://github.com/JoTalbot/game/actions/runs/33941135101
- Artifact: `igra-3.0.0-rc1`
- Artifact archive SHA-256: `sha256:f97a6723685b380f13cc1df5157bf53639f8db0f56f3f793b9a9fabb8d133f60`

Release safety:
- Existing `v3.0.0` is not overwritten or retagged.
- Final release tag must be created only after clean-install, upgrade-save, process-death and offline acceptance.
- The release workflow itself requires the tag and release signing secrets before publishing an APK.
