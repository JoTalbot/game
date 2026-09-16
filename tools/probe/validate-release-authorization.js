#!/usr/bin/env node
'use strict';

const raw = process.env.IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON || '';
const expectedCommit = (process.env.GITHUB_SHA || '').toLowerCase();
const expectedSha = (process.env.IGRA_RELEASE_APPROVED_APK_SHA256 || '').toLowerCase();

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

if (!raw.trim()) fail('IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON is required for a tagged release');
if (process.env.IGRA_PHYSICAL_ANDROID !== '1') fail('IGRA_PHYSICAL_ANDROID=1 is required for release evidence validation');
if (!/^[0-9a-f]{40}$/.test(expectedCommit)) fail('GITHUB_SHA must be a 40-hex Git commit');
if (!/^[0-9a-f]{64}$/.test(expectedSha)) fail('IGRA_RELEASE_APPROVED_APK_SHA256 must be a 64-hex SHA-256');

let evidence;
try {
  evidence = JSON.parse(raw);
} catch (error) {
  fail(`IGRA_PHYSICAL_ANDROID_EVIDENCE_JSON is not valid JSON: ${error.message}`);
}

if (evidence.schema !== 1) fail(`unsupported evidence schema: expected 1, got ${evidence.schema}`);
if (evidence.physicalAndroid !== true) fail('physicalAndroid must be true');
if (evidence.IGRA_PHYSICAL_ANDROID !== true) fail('IGRA_PHYSICAL_ANDROID must be true');

const artifact = evidence.artifact;
if (!artifact || typeof artifact !== 'object') fail('evidence artifact section is required');
const artifactCommit = String(artifact.commit || '').toLowerCase();
const artifactSha = String(artifact.apkSha256 || '').toLowerCase();
if (!/^[0-9a-f]{40}$/.test(artifactCommit)) fail('artifact.commit must be a 40-hex Git commit');
if (!/^[0-9a-f]{64}$/.test(artifactSha)) fail('artifact.apkSha256 must be a 64-hex SHA-256');
if (artifactCommit !== expectedCommit) fail('artifact.commit does not match GITHUB_SHA');
if (artifactSha !== expectedSha) fail('artifact.apkSha256 does not match IGRA_RELEASE_APPROVED_APK_SHA256');

const device = evidence.device;
if (!device || typeof device !== 'object') fail('physical device metadata is required');
for (const field of ['manufacturer', 'model', 'androidVersion', 'resolution', 'density', 'ram', 'profile']) {
  if (typeof device[field] !== 'string' || !device[field].trim()) fail(`device.${field} is required`);
}
const deviceText = [device.manufacturer, device.model, device.profile].join(' ').toLowerCase();
if (/emulator|simulator|goldfish|ranchu|sdk_gphone|generic_x86|virtual/.test(deviceText)) {
  fail('emulator/simulator device metadata is not accepted as physical evidence');
}

const test = evidence.test;
if (!test || typeof test !== 'object') fail('test timing metadata is required');
for (const field of ['startedAtUtc', 'endedAtUtc']) {
  const value = test[field];
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
    fail(`test.${field} must be a valid ISO-8601 UTC timestamp`);
  }
}
if (Date.parse(test.endedAtUtc) < Date.parse(test.startedAtUtc)) fail('test.endedAtUtc precedes test.startedAtUtc');

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

if (!Array.isArray(evidence.results)) fail('evidence results must be an array');
const byName = new Map();
for (const result of evidence.results) {
  if (!result || typeof result !== 'object') fail('every result must be an object');
  if (typeof result.name !== 'string' || !result.name.trim()) fail('result.name is required');
  if (byName.has(result.name)) fail(`duplicate result: ${result.name}`);
  if (!required.includes(result.name)) fail(`unknown result: ${result.name}`);
  if (!['PASS', 'FAIL', 'N/A'].includes(result.status)) fail(`${result.name}: invalid status`);
  if (typeof result.description !== 'string' || !result.description.trim()) fail(`${result.name}: description is required`);
  if (result.status === 'N/A' && (typeof result.reason !== 'string' || !result.reason.trim())) fail(`${result.name}: N/A requires a reason`);
  if (result.status === 'FAIL') fail(`${result.name}: FAIL blocks release authorization`);
  byName.set(result.name, result);
}
for (const name of required) {
  if (!byName.has(name)) fail(`missing acceptance result: ${name}`);
}

if (!Array.isArray(evidence.evidence) || evidence.evidence.length === 0) fail('at least one physical evidence item is required');
for (const item of evidence.evidence) {
  if (!item || typeof item !== 'object') fail('every evidence item must be an object');
  if (typeof item.type !== 'string' || !item.type.trim()) fail('evidence.type is required');
  if (typeof item.path !== 'string' || !item.path.trim()) fail('evidence.path is required');
}

console.log('PASS: canonical physical Android evidence is bound to this commit and APK SHA-256');
console.log(`commit=${artifactCommit}`);
console.log(`apkSha256=${artifactSha}`);
console.log(`scenarios=${required.length}`);
