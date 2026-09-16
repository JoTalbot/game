# ИГРА 3.0.1 — release evidence

Этот документ описывает release evidence для V3.0.1. Исторические V3-046 данные ниже сохранены как provenance и не являются текущим production candidate.

## Historical V3-046 evidence

- Historical source before that evidence record: `f7e5104e354f26fe3788adb622d3aa2ab22ea90e`
- Historical APK workflow: https://github.com/JoTalbot/game/actions/runs/33941135101
- Historical artifact: `igra-3.0.0-rc1`
- Historical artifact archive SHA-256: `sha256:f97a6723685b380f13cc1df5157bf53639f8db0f56f3f793b9a9fabb8d133f60`

These values are retained for historical traceability only.

## Current 3.0.1 candidate

- Version: `3.0.1`
- versionCode: `601`
- Source commit: `1ddc7e90780679c802470943aae3b953d40fe817`
- APK workflow: `35141797041` — SUCCESS
- Actions artifact: `igra-3.0.1` (artifact ID `10465244020`)
- APK SHA-256: `7412b523baedac084d559359856fb4ea5ac9eb623dc2692b7b61f739e259e729`
- Artifact ZIP SHA-256: `0b6b826476e801905f2cd25975a43660b3a5671d7d0b708d56f8ac12bac01deb`
- Signing: debug, ordinary main-branch CI

This binary is deterministic and CI-verified, but it is not the release-signed production candidate.

## Release safety

- Existing immutable `v3.0.1-rc1` remains unchanged.
- A separate `workflow_dispatch` of the APK workflow with `release_candidate=true` is required to produce the release-signed candidate for physical Android acceptance.
- Physical acceptance must be performed against that exact release-signed APK and its exact SHA-256.
- Production release authorization must bind the physical evidence to the exact source commit and release-signed APK SHA.
- A `v*` tag may publish only after the release authorization gate and physical evidence validation succeed.
