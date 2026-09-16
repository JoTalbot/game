#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const validator = path.join(__dirname, "physical-android-evidence.js");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "igra-physical-evidence-"));

const base = {
  schema: 1,
  artifact: {
    version: "3.0.1",
    versionCode: 601,
    commit: "909203f203fc1e695e4d481aeaf34c81b135aff0",
    apkSha256: "b1785e9e69f806464e4d446507bfc2ab6e528de2298ee048072901274a0ef03f"
  },
  device: {
    manufacturer: "Test",
    model: "Physical Device",
    androidVersion: "14",
    resolution: "1080x2400",
    density: "420",
    ram: "8GB",
    profile: "weak-device"
  },
  test: {
    startedAtUtc: "2026-09-16T12:00:00Z",
    endedAtUtc: "2026-09-16T12:30:00Z"
  },
  results: [
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
  ].map(name => ({ name, status: "PASS", description: "test evidence" })),
  evidence: [{ type: "screenshot", path: "evidence/test.png" }],
  physicalAndroid: true,
  IGRA_PHYSICAL_ANDROID: true
};

function run(name, mutate, expected) {
  const file = path.join(tmp, `${name}.json`);
  const data = JSON.parse(JSON.stringify(base));
  mutate(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  const result = spawnSync(process.execPath, [validator, file], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const passed = result.status === 0;
  if (passed !== expected) {
    console.error(`PHYSICAL EVIDENCE SELF-TEST FAIL: ${name}`);
    console.error(result.stderr || result.stdout || "no output");
    process.exit(1);
  }
  console.log(`PASS ${name}: validator ${expected ? "accepted" : "rejected"} fixture`);
}

try {
  run("valid-shape", () => {}, true);
  run("pending-result", data => {
    data.results[0].status = "PENDING";
  }, false);
  run("wrong-apk-sha", data => {
    data.artifact.apkSha256 = "0000000000000000000000000000000000000000000000000000000000000000";
  }, false);
  run("emulator-model", data => {
    data.device.model = "Android Emulator";
  }, false);
  run("missing-evidence", data => {
    data.evidence = [];
  }, false);
  run("missing-na-reason", data => {
    data.results[5].status = "N/A";
  }, false);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("PHYSICAL ANDROID EVIDENCE SELF-TEST VALID");
