#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const workflowPath = path.join(ROOT, '.github/workflows/apk.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function requireText(name, text) {
  if (!workflow.includes(text)) {
    console.error(`RELEASE WORKFLOW CONTRACT FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

requireText('manual release candidate input', 'release_candidate:');
requireText('release build env includes workflow_dispatch candidate', "github.event_name == 'workflow_dispatch' && inputs.release_candidate == true");
requireText('release signing is enabled for candidate', '"${IGRA_RELEASE_BUILD:-false}" == "true"');
requireText('release candidate requires release keystore', 'release candidate/release requires IGRA_KEYSTORE_B64 and IGRA_KEYSTORE_PASSWORD');
requireText('physical evidence validator exists in workflow', 'node tools/probe/validate-release-authorization.js');
requireText('physical evidence validator is tag-only', 'if: startsWith(github.ref, \'refs/tags/v\')');
requireText('release publication remains tag-only', 'uses: softprops/action-gh-release@v2');

const signingIndex = workflow.indexOf('name: Ключ подписи');
const evidenceIndex = workflow.indexOf('name: Проверить физическое Android evidence');
const releaseIndex = workflow.indexOf('name: Прицепить к релизу');
if (signingIndex < 0 || evidenceIndex < 0 || releaseIndex < 0 || signingIndex >= evidenceIndex || evidenceIndex >= releaseIndex) {
  console.error('RELEASE WORKFLOW CONTRACT FAIL: signing/evidence/publication order is invalid');
  process.exit(1);
}
console.log('PASS signing → physical evidence → publication order');

const releaseBlockEnd = workflow.indexOf('\n      - name:', releaseIndex + 1);
const releaseBlock = workflow.slice(releaseIndex, releaseBlockEnd < 0 ? workflow.length : releaseBlockEnd);
if (!releaseBlock.includes("if: startsWith(github.ref, 'refs/tags/v')") || !releaseBlock.includes('uses: softprops/action-gh-release@v2')) {
  console.error('RELEASE WORKFLOW CONTRACT FAIL: publication must remain tag-only');
  process.exit(1);
}
console.log('PASS release publication is tag-only');
console.log('RELEASE WORKFLOW CONTRACT SELF-TEST VALID');
