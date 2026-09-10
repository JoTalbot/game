#!/usr/bin/env node
'use strict';

// CI-level guard for the Life Arc workflow configuration.
// It validates the active workflow as text so a broken trigger/job definition
// cannot silently turn the required gate into jobs=0 or keep probing a deleted file.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', '.github', 'workflows', 'life-arc.yml');
const text = fs.readFileSync(file, 'utf8');

function ok(condition, message) {
  if (!condition) {
    throw new Error(`Life workflow guard: ${message}`);
  }
}

ok(/^name:\s*Life Arc Gate\s*$/m.test(text), 'active workflow name is present');
ok(/(^|\n)on:\s*\n(?:[ \t]+.*\n)*[ \t]+push:\s*\n[ \t]+branches:\s*\[main\]/m.test(text), 'push/main trigger is present');
ok(/(^|\n)[ \t]+workflow_dispatch:\s*$/m.test(text), 'manual dispatch trigger is present');
ok(/(^|\n)jobs:\s*\n[ \t]+life:\s*\n/m.test(text), 'life job is present');
ok(/runs-on:\s*ubuntu-latest/.test(text), 'life job has a runner');
ok(/actions\/checkout@v4/.test(text), 'checkout step is present');
ok(/actions\/setup-node@v5/.test(text), 'Node setup is present');
ok(/node-version:\s*22/.test(text), 'Life Arc uses Node 22');
ok(/find web\/js .*node --check/.test(text), 'JS syntax gate is present');
ok(/node tools\/probe\/life\.js/.test(text), 'Life Arc probe is present');
ok(/node tools\/probe\/v23-v25-release-gates\.js/.test(text), 'V23-V25 release gate probe is present');
ok(!fs.existsSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'life.yml')), 'obsolete life.yml is deleted');

console.log('Life workflow guard: PASS');
