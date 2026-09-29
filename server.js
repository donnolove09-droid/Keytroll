const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.set("trust proxy", true); // Render đứng sau proxy -> lấy đúng IP thật

// ====== SỬA LOGO + TÊN WEB Ở ĐÂY (hoặc đặt biến môi trường trên Render) ======
const CONFIG = {
  name: process.env.SITE_NAME || "TROLLMODZ",
  sub: process.env.SITE_SUB || "KEY CỦA BẠN",
  logo: process.env.LOGO_URL || "/logo.svg", // đổi file public/logo.svg hoặc dán link ảnh
};
// ==============================================================================

const PREFIX = "TRLL";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "keys.json");

let db = {};
try { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (_) {}

function save() {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function part() {
  let s = "";
  for (let i = 0; i < 4; i++) s += CHARS[crypto.randomInt(CHARS.length)];
  return s;
}
function newKey() {
  const used = new Set(Object.values(db).map((v) => v.key));
  let k;
  do { k = `${PREFIX}-${part()}-${part()}-${part()}`; } while (used.has(k));
  return k;
}
function clientIp(req) {
  return String(req.ip || req.socket.remoteAddress || "unknown").replace(/^::ffff:/, "");
}

app.get("/api/config", (_req, res) => res.json(CONFIG));

app.get("/api/key", (req, res) => {
  const ip = clientIp(req);
  if (!db[ip]) {                       // IP mới -> cấp 1 key và lưu lại
    db[ip] = { key: newKey(), at: new Date().toISOString() };
    save();
  }
  res.set("Cache-Control", "no-store");
  res.json({ key: db[ip].key });       // IP cũ -> luôn trả đúng key đã cấp
});

app.use(express.static(path.join(__dirname, "public")));
app.listen(process.env.PORT || 3000, () => console.log("running"));
