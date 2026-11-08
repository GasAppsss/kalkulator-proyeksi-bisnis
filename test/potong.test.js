/* uji kecil untuk potongNol: ambil fungsinya dari charts.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '../src/charts.js'), 'utf8');
const i0 = src.indexOf('function potongNol'), i1 = src.indexOf('function buatKas');
const potongNol = new Function(src.slice(i0, i1) + '; return potongNol;')();
const y0 = 100;
// 1) negatif lalu positif: satu titik silang
let r = potongNol([[0, 150], [10, 130], [20, 90], [30, 60]], y0);
assert.strictEqual(r.length, 2); assert.strictEqual(r[0].neg, true); assert.strictEqual(r[1].neg, false);
const c = r[0].pts[r[0].pts.length - 1]; assert.ok(Math.abs(c[1] - y0) < 1e-9); assert.ok(c[0] > 10 && c[0] < 20);
assert.deepStrictEqual(r[1].pts[0], c);
// 2) semua negatif: satu run
r = potongNol([[0, 150], [10, 140], [20, 120]], y0); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].neg, true);
// 3) semua positif
r = potongNol([[0, 50], [10, 40]], y0); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].neg, false);
// 4) titik tepat di garis nol (modal awal nol) lalu naik
r = potongNol([[0, 100], [10, 80], [20, 60]], y0); assert.strictEqual(r.length, 1); assert.strictEqual(r[0].neg, false);
// 5) mulai di nol lalu turun (negatif)
r = potongNol([[0, 100], [10, 120], [20, 130]], y0); assert.strictEqual(r.filter((x) => x.pts.length > 1).length, 1); assert.strictEqual(r.filter((x) => x.pts.length > 1)[0].neg, true);
// 6) bolak-balik
r = potongNol([[0, 130], [10, 80], [20, 130], [30, 80]], y0); assert.strictEqual(r.length, 4);
console.log('potongNol ok');
