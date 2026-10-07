// TumbuhKu server - built-in Node modules only (no npm install needed)
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto"), D = require("./db");
const PORT = process.env.PORT || 3000, PUB = path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon" };
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const readBody = req => new Promise((ok, no) => {
  let b = "";
  req.on("data", c => { b += c; if (b.length > 10000) { no(new Error("too big")); req.destroy(); } });
  req.on("end", () => { try { ok(JSON.parse(b || "{}")); } catch (e) { ok({}); } });
});
const validRecord = r => typeof r.n === "string" && r.n.length > 0 && r.n.length <= 60 && ["B", "G"].includes(r.k) &&
  /^\d{4}-\d{2}-\d{2}$/.test(r.d) && r.m >= 0 && r.m <= 60 && r.h > 20 && r.h < 140 && r.w > 1 && r.w < 40 &&
  [0, 1, 2].includes(r.ch) && [0, 1, 2, 3].includes(r.cw);
const pub = ({ uid, ...r }) => r;

http.createServer(async (req, res) => {
  const p = new URL(req.url, "http://localhost").pathname;
  if (p.startsWith("/api/")) {
    try {
      const db = D.load(); // re-read each request so create/seed scripts work while server runs
      const b = ["POST", "PUT"].includes(req.method) ? await readBody(req) : {};
      const start = u => { const token = crypto.randomBytes(24).toString("hex"); db.sessions[token] = u.id; D.save(db); send(res, 200, { token, username: u.username, role: u.role || "user" }); };
      if (req.method === "POST" && p === "/api/register") {
        const { username, password } = b;
        if (!/^[\w.-]{3,30}$/.test(username || "") || (password || "").length < 6) return send(res, 400, { error: "invalid" });
        if (db.users.some(u => u.username === username)) return send(res, 409, { error: "taken" });
        return start(D.addUser(db, username, password));
      }
      if (req.method === "POST" && p === "/api/login") {
        const u = db.users.find(x => x.username === b.username);
        if (!u || !crypto.timingSafeEqual(Buffer.from(D.hash(String(b.password || ""), u.salt)), Buffer.from(u.hash))) return send(res, 401, { error: "wrong login" });
        return start(u);
      }
      const uid = db.sessions[(req.headers.authorization || "").replace("Bearer ", "")];
      if (!uid) return send(res, 401, { error: "unauthorized" });

      if (p.startsWith("/api/admin/")) {
        const me = db.users.find(u => u.id === uid);
        if (!me || me.role !== "admin") return send(res, 403, { error: "forbidden" });
        const name = id => (db.users.find(u => u.id === id) || {}).username || "?";
        if (req.method === "GET" && p === "/api/admin/users")
          return send(res, 200, db.users.map(u => ({ id: u.id, username: u.username, role: u.role || "user", n: db.records.filter(r => r.uid === u.id).length })));
        if (req.method === "GET" && p === "/api/admin/records")
          return send(res, 200, db.records.map(r => ({ ...pub(r), user: name(r.uid) })).sort((a, c) => c.id - a.id));
        let m = p.match(/^\/api\/admin\/records\/(\d+)$/);
        if (m && req.method === "PUT") {
          const r = db.records.find(x => x.id === +m[1]);
          if (!r || !validRecord(b)) return send(res, 400, { error: "invalid record" });
          Object.assign(r, { n: b.n, k: b.k, d: b.d, m: b.m, h: b.h, w: b.w, ch: b.ch, cw: b.cw }); D.save(db); return send(res, 200, { ok: true });
        }
        if (m && req.method === "DELETE") { db.records = db.records.filter(r => r.id !== +m[1]); D.save(db); return send(res, 200, { ok: true }); }
        m = p.match(/^\/api\/admin\/users\/(\d+)(\/password)?$/);
        if (m) {
          const u = db.users.find(x => x.id === +m[1]);
          if (!u || u.role === "admin") return send(res, 400, { error: "not allowed" });
          if (m[2] && req.method === "POST") {
            if ((b.password || "").length < 6) return send(res, 400, { error: "invalid" });
            u.salt = crypto.randomBytes(16).toString("hex"); u.hash = D.hash(b.password, u.salt); D.save(db); return send(res, 200, { ok: true });
          }
          if (!m[2] && req.method === "DELETE") {
            db.users = db.users.filter(x => x.id !== u.id); db.records = db.records.filter(r => r.uid !== u.id);
            for (const t in db.sessions) if (db.sessions[t] === u.id) delete db.sessions[t];
            D.save(db); return send(res, 200, { ok: true });
          }
        }
        return send(res, 404, { error: "not found" });
      }
      if (req.method === "GET" && p === "/api/records")
        return send(res, 200, db.records.filter(r => r.uid === uid).map(pub).sort((a, c) => (a.d + a.id).localeCompare(c.d + c.id)));
      if (req.method === "POST" && p === "/api/records") {
        if (!validRecord(b)) return send(res, 400, { error: "invalid record" });
        const rec = { id: db.next++, uid, n: b.n, k: b.k, d: b.d, m: b.m, h: b.h, w: b.w, ch: b.ch, cw: b.cw };
        db.records.push(rec); D.save(db); return send(res, 200, { id: rec.id });
      }
      const m = p.match(/^\/api\/records\/(\d+)$/);
      if (req.method === "DELETE" && m) { db.records = db.records.filter(r => !(r.id === +m[1] && r.uid === uid)); D.save(db); return send(res, 200, { ok: true }); }
      return send(res, 404, { error: "not found" });
    } catch (e) { return send(res, 400, { error: "bad request" }); }
  }
  const f = path.normalize(path.join(PUB, p === "/" ? "index.html" : p));
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("TumbuhKu running on http://localhost:" + PORT));
