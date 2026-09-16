#!/usr/bin/env node
'use strict';

const raw = process.env.IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON || '';
const expectedCommit = process.env.GITHUB_SHA || '';
const expectedSha = (process.env.IGRA_RELEASE_APPROVED_APK_SHA256 || '').toLowerCase();

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!raw.trim()) fail('IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON is required for a tagged release');

let evidence;
try {
  evidence = JSON.parse(raw);
} catch (error) {
  fail(`IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON is not valid JSON: ${error.message}`);
}

if (evidence.physicalAndroid !== true) fail('physicalAndroid must be true');
if (evidence.physicalAndroidVerified !== true) fail('physicalAndroidVerified must be true');
if (evidence.productionReady !== true) fail('productionReady must be true');
if (evidence.status && evidence.status !== 'PASS') fail(`evidence status is ${evidence.status}, expected PASS`);
if (evidence.commit !== expectedCommit) fail('evidence commit does not match GITHUB_SHA');
if (String(evidence.apkSha256 || '').toLowerCase() !== expectedSha) fail('evidence APK SHA-256 does not match IGRA_RELEASE_APPROVED_APK_SHA256');
if (!/^[0-9a-f]{40}$/.test(String(evidence.commit || ''))) fail('evidence commit must be a 40-hex Git commit');
if (!/^[0-9a-f]{64}$/.test(String(evidence.apkSha256 || '').toLowerCase())) fail('evidence apkSha256 must be a 64-hex SHA-256');

const results = evidence.results;
if (!results || typeof results !== 'object' || Array.isArray(results)) fail('evidence results object is required');

const required = [
  'cleanInstall',
  'bootGameplay',
  'homeResume',
  'saveRestartRecovery',
  'forceStopRecovery',
  'oldSaveUpgrade',
  'offline',
  'releaseNewGamePlus',
  'vibration',
  'audio',
  'fullscreen',
  'crash',
  'anr',
  'performance',
  'criticalVisual',
  'criticalTouch'
];

for (const key of required) {
  const value = results[key];
  if (value !== 'PASS' && value !== 'N/A') fail(`required physical scenario ${key} must be PASS or N/A`);
  if (value === 'N/A') {
    const reason = evidence.naReasons?.[key];
    if (typeof reason !== 'string' || !reason.trim()) fail(`N/A scenario ${key} requires a reason`);
  }
}

if (Object.values(results).includes('FAIL')) fail('physical evidence contains FAIL');
if (!Array.isArray(evidence.evidence) || evidence.evidence.length === 0) fail('at least one physical evidence item is required');
if (!evidence.device || typeof evidence.device !== 'object') fail('physical device metadata is required');

const deviceText = `${evidence.device.manufacturer || ''} ${evidence.device.model || ''} ${evidence.device.profile || ''}`.toLowerCase();
if (/emulator|simulator|goldfish|ranchu|sdk_gphone|generic_x86|virtual/.test(deviceText)) {
  fail('emulator/simulator device metadata is not accepted as physical evidence');
}

console.log('PASS: structured physical Android release evidence is bound to this commit and APK SHA-256');
console.log(`commit=${expectedCommit}`);
console.log(`apkSha256=${expectedSha}`);
console.log(`scenarios=${required.length}`);
