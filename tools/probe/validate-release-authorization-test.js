#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const validator = path.join(__dirname, 'validate-release-authorization.js');
const commit = '1111111111111111111111111111111111111111';
const sha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const required = [
  'cleanInstall', 'bootGameplay', 'homeResume', 'saveRestartRecovery',
  'forceStopRecovery', 'oldSaveUpgrade', 'offline', 'releaseNewGamePlus',
  'vibration', 'audio', 'fullscreen', 'crash', 'anr', 'performance',
  'criticalVisual', 'criticalTouch'
];

function baseEvidence() {
  return {
    schema: 1,
    status: 'PASS',
    commit,
    apkSha256: sha,
    physicalAndroid: true,
    physicalAndroidVerified: true,
    productionReady: true,
    results: Object.fromEntries(required.map(key => [key, 'PASS'])),
    evidence: [{ type: 'screenshot', path: 'evidence/device.png' }],
    device: { manufacturer: 'Test', model: 'Physical Device', profile: 'weak-device' }
  };
}

function run(name, mutate, expected) {
  const evidence = baseEvidence();
  mutate(evidence);
  const result = spawnSync(process.execPath, [validator], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_SHA: commit,
      IGRA_RELEASE_APPROVED_APK_SHA256: sha,
      IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON: JSON.stringify(evidence)
    }
  });
  const passed = result.status === 0;
  if (passed !== expected) {
    console.error(`VALIDATE RELEASE AUTH SELF-TEST FAIL: ${name}`);
    console.error(result.stderr || result.stdout || 'no output');
    process.exit(1);
  }
  console.log(`PASS ${name}: ${expected ? 'accepted' : 'rejected'}`);
}

run('valid', () => {}, true);
run('missing-evidence', data => { data.evidence = []; }, false);
run('fail-scenario', data => { data.results.anr = 'FAIL'; }, false);
run('pending-scenario', data => { data.results.anr = 'PENDING'; }, false);
run('wrong-commit', data => { data.commit = '2222222222222222222222222222222222222222'; }, false);
run('wrong-apk-sha', data => { data.apkSha256 = '0000000000000000000000000000000000000000000000000000000000000000'; }, false);
run('emulator', data => { data.device.model = 'Android Emulator'; }, false);
run('not-physical', data => { data.physicalAndroid = false; }, false);
run('not-production-ready', data => { data.productionReady = false; }, false);
run('missing-secret', () => {}, false);

const missingSecret = baseEvidence();
const result = spawnSync(process.execPath, [validator], {
  cwd: ROOT,
  encoding: 'utf8',
  env: { ...process.env, GITHUB_SHA: commit, IGRA_RELEASE_APPROVED_APK_SHA256: '', IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON: JSON.stringify(missingSecret) }
});
if (result.status === 0) {
  console.error('VALIDATE RELEASE AUTH SELF-TEST FAIL: missing-secret accepted');
  process.exit(1);
}

console.log('VALIDATE RELEASE AUTH SELF-TEST VALID');
