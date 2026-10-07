// node display.js [users|records|all] -> prints the database as tables
const D = require("./db"), db = D.load(), what = process.argv[2] || "all";
const S = ["Normal", "Stunted", "Severely stunted"], W = ["Normal", "Underweight", "Severely underweight", "Overweight"];
if (what !== "records") { console.log("\nUSERS"); console.table(db.users.map(u => ({ id: u.id, username: u.username, role: u.role || "user", records: db.records.filter(r => r.uid === u.id).length }))); }
if (what !== "users") {
  console.log("\nRECORDS");
  console.table(db.records.map(r => ({ id: r.id, user: (db.users.find(u => u.id === r.uid) || {}).username, child: r.n, sex: r.k, date: r.d, age_m: r.m, cm: r.h, kg: r.w, height: S[r.ch], weight: W[r.cw] })));
}
