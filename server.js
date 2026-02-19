const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const LINKS_FILE = path.join(DATA_DIR, "links.json");
const CLICKS_FILE = path.join(DATA_DIR, "clicks.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

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

// JSON file helpers
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// Read request body
function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { resolve({}); }
    });
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

http
  .createServer(async (req, res) => {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(parsed.pathname);

    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    // ============ REDIRECT /go/:id ============
    if (pathname.startsWith("/go/")) {
      const linkId = pathname.slice(4);
      const links = readJSON(LINKS_FILE, []);
      const link = links.find((l) => l.id === linkId);
      if (!link) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        return res.end("<h1>Link nao encontrado</h1>");
      }
      // Record click
      const clicks = readJSON(CLICKS_FILE, []);
      clicks.push({
        linkId: link.id,
        descricao: link.descricao,
        vendedorId: link.vendedorId,
        timestamp: new Date().toISOString(),
        ip: (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim(),
        ua: req.headers["user-agent"] || "",
        referer: req.headers["referer"] || "",
      });
      writeJSON(CLICKS_FILE, clicks);
      // Build WhatsApp URL
      const phone = link.whatsapp.startsWith("55") ? link.whatsapp : "55" + link.whatsapp;
      const waUrl = "https://wa.me/" + phone + (link.mensagem ? "?text=" + encodeURIComponent(link.mensagem) : "");
      // Redirect
      res.writeHead(302, { Location: waUrl });
      return res.end();
    }

    // ============ API /api/links ============
    if (pathname === "/api/links" && req.method === "GET") {
      const links = readJSON(LINKS_FILE, []);
      const clicks = readJSON(CLICKS_FILE, []);
      // Attach click count to each link
      const enriched = links.map((l) => ({
        ...l,
        clicks: clicks.filter((c) => c.linkId === l.id).length,
      }));
      return jsonResponse(res, 200, enriched);
    }

    if (pathname === "/api/links" && req.method === "POST") {
      const body = await readBody(req);
      if (!body.descricao || !body.whatsapp) {
        return jsonResponse(res, 400, { error: "descricao e whatsapp sao obrigatorios" });
      }
      const links = readJSON(LINKS_FILE, []);
      const link = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        descricao: body.descricao.trim(),
        whatsapp: body.whatsapp.replace(/\D/g, ""),
        mensagem: (body.mensagem || "").trim(),
        vendedorId: body.vendedorId || "",
        vendedorNome: body.vendedorNome || "",
        criadoEm: new Date().toISOString(),
      };
      links.push(link);
      writeJSON(LINKS_FILE, links);
      return jsonResponse(res, 201, link);
    }

    if (pathname.startsWith("/api/links/") && req.method === "DELETE") {
      const linkId = pathname.split("/")[3];
      let links = readJSON(LINKS_FILE, []);
      const before = links.length;
      links = links.filter((l) => l.id !== linkId);
      writeJSON(LINKS_FILE, links);
      // Also clean clicks
      let clicks = readJSON(CLICKS_FILE, []);
      clicks = clicks.filter((c) => c.linkId !== linkId);
      writeJSON(CLICKS_FILE, clicks);
      return jsonResponse(res, 200, { deleted: before !== links.length });
    }

    // ============ API /api/clicks ============
    if (pathname === "/api/clicks" && req.method === "GET") {
      const clicks = readJSON(CLICKS_FILE, []);
      return jsonResponse(res, 200, clicks);
    }

    // ============ API /api/stats ============
    if (pathname === "/api/stats" && req.method === "GET") {
      const links = readJSON(LINKS_FILE, []);
      const clicks = readJSON(CLICKS_FILE, []);
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const weekAgo = new Date(now - 7 * 86400000).toISOString();

      // Per-link stats
      const perLink = links.map((l) => {
        const lClicks = clicks.filter((c) => c.linkId === l.id);
        const last7 = lClicks.filter((c) => c.timestamp >= weekAgo);
        return {
          id: l.id,
          descricao: l.descricao,
          vendedorNome: l.vendedorNome,
          total: lClicks.length,
          hoje: lClicks.filter((c) => c.timestamp.startsWith(today)).length,
          ultimos7dias: last7.length,
        };
      });
      perLink.sort((a, b) => b.total - a.total);

      // Per-day (last 14 days)
      const perDay = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
        perDay.push({ data: d, clicks: clicks.filter((c) => c.timestamp.startsWith(d)).length });
      }

      // Per-seller
      const sellersMap = {};
      clicks.forEach((c) => {
        const key = c.vendedorId || "desconhecido";
        if (!sellersMap[key]) sellersMap[key] = { vendedorId: key, nome: "", total: 0 };
        sellersMap[key].total++;
      });
      links.forEach((l) => {
        if (sellersMap[l.vendedorId]) sellersMap[l.vendedorId].nome = l.vendedorNome;
      });

      return jsonResponse(res, 200, {
        totalLinks: links.length,
        totalClicks: clicks.length,
        clicksHoje: clicks.filter((c) => c.timestamp.startsWith(today)).length,
        clicks7dias: clicks.filter((c) => c.timestamp >= weekAgo).length,
        perLink,
        perDay,
        perSeller: Object.values(sellersMap).sort((a, b) => b.total - a.total),
      });
    }

    // ============ STATIC FILES ============
    let filePath = path.join(__dirname, pathname);
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
