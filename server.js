const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let filePath = path.join(__dirname, decodeURIComponent(req.url));

    if (filePath.endsWith("/")) filePath = path.join(filePath, "index.html");
    if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");

    // Prevent directory traversal
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end("<h1>404 - Pagina nao encontrada</h1>");
      }
      const ext = path.extname(filePath);
      const mime = MIME[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": `${mime}; charset=utf-8` });
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`NLE rodando na porta ${PORT}`));
