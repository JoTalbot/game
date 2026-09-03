# RC1 Touch Evidence

Date: 2026-09-03

## Physical session 2

Device: Android, 427×948, @1.0, weak profile
Play time: 14 min
World time: 20.2 min
FPS: 59
Touches: 314
Successful gaze: 253
Grown: 188
Gesture torn: 27

### Tear reasons

- explicit release: 20
- finger left: 5
- node died: 1
- system cancellation: 1

### Finger displacement

- current hard cancellation threshold: 126 px
- median displacement: 132 px
- maximum displacement: 174 px
- finger-left events: 5

This is the second independent physical session confirming that some natural finger movement crosses the 126 px threshold. The first session recorded 3 finger-left events with median 128 px and maximum 139 px. Combined evidence: 8 finger-left events across two sessions.

## Decision

Implement `IMP-RC1-TOUCH` as hysteresis/grace handling rather than simply raising the global cancellation threshold.

Target behavior:

- 0–126 px: normal hold
- 126–140 px: grace zone; preserve hold while the finger returns inward
- sustained movement beyond 140 px: cancel as `slip`
- explicit `touchend`: remains an intentional release
- `touchcancel`: remains a system cancellation and must not become `slip`

The 140 px outer boundary is a conservative candidate derived from observed physical movement, not a permanent balance constant. It must be validated on-device for accidental neighboring-node capture.

## Acceptance

- deterministic probe for 126–140 px followed by recovery
- deterministic probe for sustained >140 px cancellation
- explicit release unchanged
- system `touchcancel` remains distinct
- existing gesture probes remain green
- physical smoke on weak Android confirms improved hold stability without neighboring-node capture

## Product interpretation

The second session does not justify changing color discoverability: 2 colors were encountered, so the earlier zero-color observation was insufficient evidence for a product change.

Production release remains blocked until the RC1 physical gate is fully evidenced and the touch change, if implemented, passes regression checks.
