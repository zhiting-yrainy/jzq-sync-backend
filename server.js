/**
 * 教资简答题题库 —— 轻量同步后端（方案 B）
 * 零依赖 Node.js 服务：
 *   1) 托管 public/ 下的静态文件（index.html 等）
 *   2) 提供 /api/state 接口，读写用户标注（不熟练标记 / 答案批注 / 新增题目）
 * 存储：data/sync.json（单文件，last-write-wins）
 * 运行：node server.js   （可选环境变量 PORT、SYNC_KEY、PUBLIC_DIR）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const SYNC_KEY = process.env.SYNC_KEY || '';           // 可选：设置后客户端需带 ?k= 才能读写
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'sync.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ updatedAt: 0, data: {} }));
}
ensureStore();

function readState() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch (e) { return { updatedAt: 0, data: {} }; }
}
function writeState(obj) { fs.writeFileSync(DATA_FILE, JSON.stringify(obj)); }

const server = http.createServer((req, res) => {
  // 允许跨域（前端部署在别处时需用到）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, 'http://localhost');

  // ===== 同步接口 =====
  if (url.pathname === '/api/state') {
    const k = url.searchParams.get('k') || '';
    if (SYNC_KEY && k !== SYNC_KEY) { res.writeHead(403); res.end('forbidden'); return; }

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(readState()));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const incoming = JSON.parse(body);
          const cur = readState();
          const newUpdated = incoming.updatedAt || Date.now();
          // last-write-wins：以时间戳较新者为准
          if (newUpdated >= cur.updatedAt) {
            writeState({ updatedAt: newUpdated, data: incoming.data || {} });
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(readState()));
        } catch (e) {
          res.writeHead(400); res.end('bad json');
        }
      });
      return;
    }
    res.writeHead(405); res.end('method not allowed'); return;
  }

  // ===== 静态文件 =====
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  const safe = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const fp = path.join(PUBLIC_DIR, safe);
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('forbidden'); return; }

  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('教资题库同步服务已启动： http://localhost:' + PORT);
  if (SYNC_KEY) console.log('已启用访问密钥校验');
});
