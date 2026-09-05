const fs = require('fs');
const path = require('path');

function read(p) { return fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8'); }
function ok(v, name, detail) {
  if (!v) {
    console.error('FAIL ' + name + (detail ? ': ' + detail : ''));
    process.exitCode = 1;
  } else {
    console.log('OK   ' + name + (detail ? ': ' + detail : ''));
  }
}

const index = read('web/index.html');
const sw = read('web/sw.js');
const guard = read('web/js/v3-performance-guard.js');
const memory = read('web/js/memory.js');
const report = read('web/js/report.js');
const engine = read('web/js/engine.js');

ok(index.includes('js/v3-performance-guard.js'), 'performance guard loaded before game bootstrap');
ok(sw.includes('./js/v3-performance-guard.js'), 'performance guard is offline-cached');
ok(sw.includes('igra-shell-v26'), 'offline cache version bumped');
ok(guard.includes('Math.min(w || 9999, h || 9999) < 460'), 'reported 427px weak device gets early guard');
ok(guard.includes('this.particles = Math.min(this.particles, 120)'), 'weak device particle budget is bounded');
ok(guard.includes('this.fog = Math.min(this.fog, 5)'), 'weak device fog budget is bounded');
ok(guard.includes('this.glow = false') && guard.includes('this.dpr = 1'), 'weak device disables expensive presentation work');

// "сбой" is valid game vocabulary: chaos is an intentional soul-weather season.
ok(memory.includes('chaos: {') && memory.includes('id: "сбой"'), '"сбой" remains an intentional chaos season');
ok(report.includes('game.dna.name() + " · " + G.traitName(game.dna.dominant())'), 'nature report uses DNA identity and dominant trait');
ok(report.includes('G.Memory.climateName()'), 'season report uses memory climate name');

// Zero energy is a legal floor, not a dead-end.
ok(engine.includes('Math.max(0, this.player.energy - 16)'), 'pulse cannot drive energy below zero');
ok(engine.includes('Math.max(0, player.energy'), 'engine has a zero-energy floor');

// Early release is measured honestly, not hidden by changing telemetry thresholds.
ok(engine.includes('this.player.gazeT > 0.15') && engine.includes('gestureTorn("let"'), 'early release telemetry is explicit');
ok(engine.includes('this.player.gazeT < 1.35'), 'birth interaction window remains explicit');

console.log('\nV3-046 telemetry/performance guard probe complete');
process.exitCode = process.exitCode || 0;
