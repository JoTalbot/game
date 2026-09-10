#!/usr/bin/env node
'use strict';

// CI-level guard for the active Life Arc workflow configuration.
// It validates the checked-in gate so a broken trigger/job definition cannot
// silently turn the required Life Arc gate into jobs=0 or probe a deleted file.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', '..');
const file = path.join(root, '.github', 'workflows', 'life-arc.yml');
const text = fs.readFileSync(file, 'utf8');

function ok(condition, message) {
  if (!condition) throw new Error(`Life workflow guard: ${message}`);
}

ok(/^name:\s*Life Arc Gate\s*$/m.test(text), 'active workflow name is present');
ok(/(^|\n)on:\s*\n(?:[ \t]+.*\n)*[ \t]+push:\s*\n[ \t]+branches:\s*\[main\]/m.test(text), 'push/main trigger is present');
ok(/(^|\n)[ \t]+workflow_dispatch:\s*$/m.test(text), 'manual dispatch trigger is present');
ok(/(^|\n)jobs:\s*\n[ \t]+life:\s*\n/m.test(text), 'life job is present');
ok(/runs-on:\s*ubuntu-latest/.test(text), 'life job has a runner');
ok(/actions\/checkout@v4/.test(text), 'checkout step is present');
ok(/actions\/setup-node@v5/.test(text), 'Node setup is present');
ok(/node-version:\s*22/.test(text), 'Life Arc uses Node 22');
ok(/node tools\/probe\/life-workflow\.js/.test(text), 'workflow guard is executed');
ok(/v23-v25-release-gates\.js/.test(text), 'V23-V25 release gate probe is present in the probe list');
ok(/for probe in \"\$\{probes\[@\]\}\"; do/.test(text), 'probe list is executed');
ok(!fs.existsSync(path.join(root, '.github', 'workflows', 'life.yml')), 'obsolete life.yml is deleted');

console.log('Life workflow guard: PASS');
