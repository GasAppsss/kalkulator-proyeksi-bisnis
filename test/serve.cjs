/* server statis kecil untuk pengujian: node test/serve.cjs [port] [folder] */
const http = require('http'), fs = require('fs'), path = require('path');
const TIPE = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
/* opsi: { headers: {nama: nilai} untuk semua respons, headersPer: (path) => {..} tambahan per berkas, tunda: (path) => milidetik penundaan respons } */
function mulai(folder, port, opsi) {
  const root = path.resolve(folder);
  opsi = opsi || {};
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    const kepala = Object.assign({ 'Content-Type': TIPE[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }, opsi.headers || {}, opsi.headersPer ? opsi.headersPer(p) : {});
    const kirim = () => { res.writeHead(200, kepala); fs.createReadStream(f).pipe(res); };
    const tunda = opsi.tunda ? opsi.tunda(p) : 0;
    if (tunda > 0) setTimeout(kirim, tunda); else kirim();
  });
  /* menutup server sampai sambungan keep-alive terputus, supaya uji offline benar-benar offline */
  srv.berhenti = () => new Promise((ok) => { srv.close(() => ok()); if (srv.closeAllConnections) srv.closeAllConnections(); });
  return new Promise((ok) => srv.listen(port || 0, '127.0.0.1', () => ok({ srv, port: srv.address().port, url: 'http://127.0.0.1:' + srv.address().port })));
}
module.exports = { mulai };
if (require.main === module) mulai(process.argv[3] || path.join(__dirname, '../dist/paket'), Number(process.argv[2]) || 8080).then((s) => console.log('melayani', s.url));
