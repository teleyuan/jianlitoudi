import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");
const isCliMode = process.env.JOB_APP_TRACKER_ROOT === projectRoot;
const dataRoot = isCliMode ? path.join(os.homedir(), ".job-application-tracker") : path.join(projectRoot, "data");
const dataFilePath = path.join(dataRoot, "applications.json");
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function handleApplicationsApi(request, response) {
  await ensureDataFile();

  if (request.method === "GET") {
    const content = await fs.readFile(dataFilePath, "utf8");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(content);
    return;
  }

  if (request.method === "POST") {
    try {
      const bodyText = await readRequestBody(request);
      const payload = bodyText ? JSON.parse(bodyText) : [];
      await fs.writeFile(dataFilePath, JSON.stringify(payload, null, 2), "utf8");
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
    }
    return;
  }

  response.writeHead(405);
  response.end("Method Not Allowed");
}

async function serveStaticFile(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(distDir, requestedPath));

  if (!filePath.startsWith(distDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  } catch {
    const fallback = await fs.readFile(path.join(distDir, "index.html"));
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(fallback);
  }
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/applications")) {
      await handleApplicationsApi(request, response);
      return;
    }

    await serveStaticFile(request, response);
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message });
  }
});

server.listen(port, () => {
  console.log(`Job application tracker is running at http://localhost:${port}`);
  console.log(`Data file: ${dataFilePath}`);
});
