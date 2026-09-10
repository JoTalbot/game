# V9 → V25 execution protocol

## Batch policy

The V9–V25 program is one approved development batch, but implementation is executed as dependency-ordered slices. A slice is merged only after code, probes, CI and required physical checks pass. This prevents a large feature batch from becoming an undebuggable pile of optimism.

## Order

1. V9 world simulation foundation
2. V10 personality/behavior
3. V11 social graph
4. V12 lineage 2.0
5. V13 knowledge meta-layer
6. V14 Director 2.0
7. V15 final causality
8. V16 presentation evolution
9. V17 adaptive audio
10. V18 experimentation
11. V19 deep simulation
12. V20 production hardening
13. V21 large playtest
14. V22 optimization
15. V23 RC2
16. V24 limited release
17. V25 production gate

## Per-slice loop

For every slice:

- inspect existing architecture before modifying it;
- define state schema and migration impact;
- implement the smallest coherent vertical slice;
- add deterministic probe;
- add regression coverage;
- run full relevant probe suite;
- run APK/CI gate;
- perform physical Android validation for user-facing changes;
- update documentation/status;
- merge to main only when green.

## Hard invariants

- `v3.0.1-rc1` tag is immutable and must never move;
- existing save migration remains supported;
- offline core loop remains functional;
- no uncontrolled network dependency;
- no monetization pressure is introduced;
- no visual text spam regression;
- no renderer collection corruption;
- no uncontrolled persistence growth;
- deterministic test seeds remain available;
- weak-device performance remains a release gate;
- README is not used as a CI heartbeat mechanism.

## Release gates

### V20
Production hardening baseline complete.

### V21
Human playtest evidence collected and triaged.

### V22
Performance and memory budgets meet targets with no functional regression.

### V23
New immutable RC passes all automated and physical gates.

### V24
Limited release produces no critical/blocker findings and save/migration remain reliable.

### V25
Production decision is allowed only after every previous gate is green and store/privacy materials match the shipped artifact.

## User involvement

The user should only be asked for actions that require access unavailable to the agent, especially physical-device tests, Google Play Console operations, secrets, and account-level permissions. Everything else should be automated or prepared in the repository where safely possible.
