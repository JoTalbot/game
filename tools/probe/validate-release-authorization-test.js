#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const validator = path.join(__dirname, 'validate-release-authorization.js');
const commit = '1111111111111111111111111111111111111111';
const sha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const required = [
  'Clean install',
  'Boot / birth / gameplay',
  'Home → resume',
  'Save → restart → recovery',
  'Force-stop → recovery',
  'Old save → upgrade',
  'Offline',
  'Release / Become / NG+',
  'Vibration',
  'Audio',
  'Fullscreen',
  'Crash',
  'ANR',
  'Heavy-frame / performance blocker',
  'Critical visual blocker',
  'Critical touch blocker'
];

function baseEvidence() {
  return {
    schema: 1,
    physicalAndroid: true,
    IGRA_PHYSICAL_ANDROID: true,
    artifact: { commit, apkSha256: sha },
    device: {
      manufacturer: 'Test',
      model: 'Physical Device',
      androidVersion: '15',
      resolution: '1080x2400',
      density: '420',
      ram: '4096 MB',
      profile: 'weak-device'
    },
    test: {
      startedAtUtc: '2026-09-16T10:00:00Z',
      endedAtUtc: '2026-09-16T10:05:00Z'
    },
    results: required.map(name => ({
      name,
      status: 'PASS',
      description: `Validated: ${name}`
    })),
    evidence: [{ type: 'screenshot', path: 'evidence/device.png' }]
  };
}

function run(name, mutate, expected, envOverrides = {}) {
  const evidence = baseEvidence();
  mutate(evidence);
  const result = spawnSync(process.execPath, [validator], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_SHA: commit,
      IGRA_PHYSICAL_ANDROID: '1',
      IGRA_RELEASE_APPROVED_APK_SHA256: sha,
      IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON: JSON.stringify(evidence),
      ...envOverrides
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
run('fail-scenario', data => { data.results.find(r => r.name === 'ANR').status = 'FAIL'; }, false);
run('pending-scenario', data => { data.results.find(r => r.name === 'ANR').status = 'PENDING'; }, false);
run('wrong-commit', data => { data.artifact.commit = '2222222222222222222222222222222222222222'; }, false);
run('wrong-apk-sha', data => { data.artifact.apkSha256 = '0000000000000000000000000000000000000000000000000000000000000000'; }, false);
run('emulator', data => { data.device.model = 'Android Emulator'; }, false);
run('not-physical', data => { data.physicalAndroid = false; }, false);
run('missing-physical-evidence-flag', data => { data.IGRA_PHYSICAL_ANDROID = false; }, false);
run('missing-runtime-physical-flag', () => {}, false, { IGRA_PHYSICAL_ANDROID: '' });
run('missing-secret', () => {}, false, { IGRA_RELEASE_APPROVED_APK_SHA256: '' });

console.log('VALIDATE RELEASE AUTH SELF-TEST VALID');
