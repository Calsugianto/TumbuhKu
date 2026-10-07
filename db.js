// Shared data helpers (JSON file database). Used by server.js, create.js, seed.js, display.js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const FILE = process.env.DB_PATH || path.join(__dirname, "data.json");
const empty = () => ({ users: [], sessions: {}, records: [], next: 1 });
function load() { try { return JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) { return empty(); } }
function save(db) { fs.writeFileSync(FILE + ".tmp", JSON.stringify(db, null, 1)); fs.renameSync(FILE + ".tmp", FILE); }
const hash = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString("hex");
function addUser(db, username, password, role = "user") {
  const salt = crypto.randomBytes(16).toString("hex");
  const u = { id: db.next++, username, role, salt, hash: hash(password, salt) };
  db.users.push(u); return u;
}
module.exports = { FILE, empty, load, save, hash, addUser };
