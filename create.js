// node create.js [--force]  -> creates a fresh database with the admin account
const fs = require("fs"), D = require("./db");
if (fs.existsSync(D.FILE) && !process.argv.includes("--force")) {
  console.log("Database already exists: " + D.FILE + "\nUse  node create.js --force  to recreate it (ALL DATA IS DELETED).");
  process.exit(1);
}
const db = D.empty(), pw = process.env.ADMIN_PASSWORD || "admin123";
D.addUser(db, "admin", pw, "admin"); D.save(db);
console.log("Created " + D.FILE + "\nAdmin login -> username: admin  password: " + pw);
