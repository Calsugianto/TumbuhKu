// node seed.js -> adds demo families (safe to run again; existing users are skipped)
const D = require("./db"), { classify } = require("./who");
const db = D.load();
if (!db.users.some(u => u.username === "admin")) D.addUser(db, "admin", process.env.ADMIN_PASSWORD || "admin123", "admin");
// [username, password, [ [child, sex, dob, [ [date, cm, kg], ... ] ] ] ]
const demo = [
  ["ibu.sari", "demo123", [
    ["Adi", "B", "2025-01-10", [["2025-07-10", 62.0, 6.0], ["2025-10-10", 66.5, 7.0], ["2026-01-10", 70.0, 7.5], ["2026-07-10", 77.5, 9.0], ["2026-09-10", 79.8, 9.6]]],
    ["Bunga", "G", "2024-03-20", [["2026-03-20", 86.5, 14.0], ["2026-09-20", 91.0, 17.5]]]]],
  ["ibu.dewi", "demo123", [
    ["Rizky", "B", "2025-04-05", [["2025-10-05", 67.0, 7.8], ["2026-04-05", 75.5, 9.5], ["2026-09-05", 81.0, 10.5]]]]]
];
for (const [username, pw, kids] of demo) {
  if (db.users.some(u => u.username === username)) { console.log("skip " + username); continue; }
  const u = D.addUser(db, username, pw);
  for (const [n, k, dob, ms] of kids) for (const [d, h, w] of ms) {
    const m = +((new Date(d) - new Date(dob)) / 2629800000).toFixed(1);
    db.records.push({ id: db.next++, uid: u.id, n, k, d, m, h, w, ...classify(k, m, h, w) });
  }
  console.log("seeded " + username + " (password: " + pw + ")");
}
D.save(db);
