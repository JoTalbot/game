#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function expectedEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string" || !value.trim()) fail(`${name} is required`);
  return value.trim();
}

function fail(message) {
  console.error(`PHYSICAL ANDROID EVIDENCE FAIL: ${message}`);
  process.exit(1);
}

const expectedCommit = expectedEnv("IGRA_EXPECTED_APK_COMMIT");
const expectedApkSha256 = expectedEnv("IGRA_EXPECTED_APK_SHA256").toLowerCase();
if (!/^[0-9a-f]{40}$/.test(expectedCommit)) fail("IGRA_EXPECTED_APK_COMMIT must be a 40-character Git commit SHA");
if (!/^[0-9a-f]{64}$/.test(expectedApkSha256)) fail("IGRA_EXPECTED_APK_SHA256 must be a 64-character SHA-256 digest");

const EXPECTED = Object.freeze({
  version: "3.0.1",
  versionCode: 601,
  commit: expectedCommit,
  apkSha256: expectedApkSha256
});

const REQUIRED = [
  "Clean install",
  "Boot / birth / gameplay",
  "Home → resume",
  "Save → restart → recovery",
  "Force-stop → recovery",
  "Old save → upgrade",
  "Offline",
  "Release / Become / NG+",
  "Vibration",
  "Audio",
  "Fullscreen",
  "Crash",
  "ANR",
  "Heavy-frame / performance blocker",
  "Critical visual blocker",
  "Critical touch blocker"
];

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} is missing`);
  return value.trim();
}

function requireUtc(value, label) {
  const text = requireString(value, label);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(text)) {
    fail(`${label} must be an ISO-8601 UTC timestamp ending in Z`);
  }
  if (Number.isNaN(Date.parse(text))) fail(`${label} is not a valid timestamp`);
  return text;
}

const file = process.argv[2] || path.resolve(process.cwd(), "physical-android-evidence.json");
if (!fs.existsSync(file)) fail(`evidence file not found: ${file}`);

let evidence;
try {
  evidence = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (error) {
  fail(`invalid JSON: ${error.message}`);
}

if (evidence.schema !== 1) fail(`unsupported schema: expected 1, got ${evidence.schema}`);

const artifact = evidence.artifact;
if (!artifact || typeof artifact !== "object") fail("artifact section is missing");
if (artifact.version !== EXPECTED.version) fail(`artifact.version mismatch: ${artifact.version}`);
if (artifact.versionCode !== EXPECTED.versionCode) fail(`artifact.versionCode mismatch: ${artifact.versionCode}`);
if (artifact.commit !== EXPECTED.commit) fail("artifact.commit does not match the accepted source commit");
if (typeof artifact.apkSha256 !== "string" || artifact.apkSha256.toLowerCase() !== EXPECTED.apkSha256) fail("artifact.apkSha256 does not match the accepted APK");

const device = evidence.device;
if (!device || typeof device !== "object") fail("device section is missing");
for (const field of ["manufacturer", "model", "androidVersion", "resolution", "density", "ram", "profile"]) {
  requireString(device[field], `device.${field}`);
}
if ([device.manufacturer, device.model, device.profile].some(v => /emulator|simulator/i.test(v))) {
  fail("emulator/simulator evidence is not accepted as physical Android evidence");
}

const started = requireUtc(evidence.test && evidence.test.startedAtUtc, "test.startedAtUtc");
const ended = requireUtc(evidence.test && evidence.test.endedAtUtc, "test.endedAtUtc");
if (Date.parse(ended) < Date.parse(started)) fail("test.endedAtUtc precedes test.startedAtUtc");

if (!Array.isArray(evidence.results)) fail("results must be an array");
const byName = new Map();
for (const result of evidence.results) {
  if (!result || typeof result !== "object") fail("every result must be an object");
  const name = requireString(result.name, "result.name");
  if (byName.has(name)) fail(`duplicate result: ${name}`);
  if (!REQUIRED.includes(name)) fail(`unknown result: ${name}`);
  if (!["PASS", "FAIL", "N/A"].includes(result.status)) fail(`${name}: status must be PASS, FAIL or N/A`);
  requireString(result.description, `${name}.description`);
  if (result.status === "N/A") requireString(result.reason, `${name}.reason`);
  if (result.status === "FAIL") fail(`${name}: FAIL blocks physical acceptance`);
  byName.set(name, result);
}
for (const name of REQUIRED) {
  const result = byName.get(name);
  if (!result) fail(`missing acceptance result: ${name}`);
  if (result.status !== "PASS" && result.status !== "N/A") fail(`${name}: not accepted`);
}

if (!Array.isArray(evidence.evidence) || evidence.evidence.length === 0) {
  fail("at least one evidence item is required");
}
for (const item of evidence.evidence) {
  if (!item || typeof item !== "object") fail("every evidence item must be an object");
  requireString(item.type, "evidence.type");
  requireString(item.path, "evidence.path");
}

if (evidence.physicalAndroid !== true) fail("physicalAndroid must be explicitly true only after the completed physical run");
if (evidence.IGRA_PHYSICAL_ANDROID !== true) fail("IGRA_PHYSICAL_ANDROID must be explicitly true in accepted evidence");

console.log(JSON.stringify({
  schema: 1,
  valid: true,
  physicalAndroid: true,
  productionArtifact: EXPECTED,
  device: { manufacturer: device.manufacturer, model: device.model, androidVersion: device.androidVersion },
  startedAtUtc: started,
  endedAtUtc: ended,
  results: REQUIRED.length,
  evidenceItems: evidence.evidence.length
}, null, 2));
console.log("PHYSICAL ANDROID EVIDENCE VALID");
