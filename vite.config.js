import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "node:fs/promises";
import path from "node:path";

const dataFilePath = path.resolve("data", "applications.json");

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "local-json-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url !== "/api/applications") {
            next();
            return;
          }

          await ensureDataFile();

          if (req.method === "GET") {
            const content = await fs.readFile(dataFilePath, "utf8");
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(content);
            return;
          }

          if (req.method === "POST") {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", async () => {
              try {
                const bodyText = Buffer.concat(chunks).toString("utf8");
                const payload = bodyText ? JSON.parse(bodyText) : [];
                await fs.writeFile(dataFilePath, JSON.stringify(payload, null, 2), "utf8");
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: true }));
              } catch (error) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: false, message: error.message }));
              }
            });
            return;
          }

          res.statusCode = 405;
          res.end("Method Not Allowed");
        });
      },
    },
  ],
});
