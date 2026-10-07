# TumbuhKu
Child growth checker (WHO), history, 7-day low-cost menu (stunting / normal / overweight) and an admin panel.
No npm install needed (Node 18+). Keep server.js, db.js, who.js and the public/ folder together.

    node create.js     # new database + admin account (admin / admin123)
    node seed.js       # demo families (ibu.sari / demo123, ibu.dewi / demo123)
    node display.js    # print users and records  (or: display.js users | records)
    node server.js     # open http://localhost:3000

Data lives in data.json. Set ADMIN_PASSWORD before create.js to choose another admin password.
