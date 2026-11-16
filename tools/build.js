/**
 * Build frontend KRP Pro dari src/ → frontend/js/app.js (publik + akun pendaftar) & frontend/js/admin.js (panitia, dimuat saat perlu).
 * Daftar aksi tulis (API_TULIS) diambil langsung dari ROUTES backend agar klien tahu mana yang boleh digabung (batch).
 * Pakai: node tools/build.js
 */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..'), SRC = ROOT + '/src/', OUT = ROOT + '/frontend/';
// Ambil ROUTES dari backend tanpa layanan Google (stub minimal)
const stub = new Proxy({}, { get: () => stub, apply: () => stub });
const ctx = { PropertiesService: { getScriptProperties: () => ({}) }, console, Utilities: {}, ContentService: {}, SpreadsheetApp: {}, CacheService: {}, LockService: {}, DriveApp: {}, MailApp: {}, ScriptApp: {}, Session: {} };
vm.createContext(ctx);
vm.runInContext(['Kode', 'Kurasi', 'Operasional', 'Event', 'Api', 'Migrasi'].map(f => fs.readFileSync(ROOT + '/backend/' + f + '.gs', 'utf8')).join('\n') + '\n;this.__R=ROUTES;this.__V=APP_VERSION;', ctx);
const tulis = Object.keys(ctx.__R).filter(k => ctx.__R[k].write).sort();
const ver = ctx.__V;
const baca = f => fs.readFileSync(SRC + f, 'utf8');
const app = ['a_core.js', 'b_public.js', 'b2_info.js', 'c_member.js', 'z_boot.js'].map(baca).join('\n').replace('__API_TULIS__', JSON.stringify(tulis));
const admin = ['d1_admin.js', 'd3_kurasi.js', 'd4_operasional.js', 'e_event.js', 'f_susun.js', 'd2_admin.js', 'g_sistem.js'].map(baca).join('\n');
const head = n => `/* KRP Pro v${ver} — ${n}. Dibuat otomatis oleh tools/build.js dari folder src/. Jangan diedit langsung. */\n`;
fs.writeFileSync(OUT + 'js/app.js', head('modul publik & akun pendaftar') + app);
fs.writeFileSync(OUT + 'js/admin.js', head('modul panitia (dimuat saat dibutuhkan)') + admin);
// CSS dari src/style.css
fs.writeFileSync(OUT + 'css/style.css', head('gaya tampilan').replace('/*', '/*') + fs.readFileSync(SRC + 'style.css', 'utf8'));
// Versi aset di index.html & sw.js
for (const f of ['index.html', 'sw.js']) { const p = OUT + f; if (fs.existsSync(p)) fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/v=[0-9.]+(-[a-z0-9]+)?/g, 'v=' + ver).replace(/const VERSI = '[^']*'/, `const VERSI = '${ver}'`)); }
const cp = require('child_process');
for (const f of ['js/app.js', 'js/admin.js']) { const r = cp.spawnSync('node', ['--check', OUT + f], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); } }
console.log('✅ Build v' + ver + ': app.js ' + (app.length / 1024).toFixed(0) + ' KB, admin.js ' + (admin.length / 1024).toFixed(0) + ' KB, ' + tulis.length + ' aksi tulis');
