import type { Plugin } from "vite";

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";

import { generate } from "../../commands/generate.js";

const SCHEMA_ROOT = "src/cms";
const VALID_DIRS = ["collections", "globals", "components"];

function send(res: import("http").ServerResponse, status: number, data: Record<string, unknown>) {
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

interface ValidSave {
  content: string;
  filename: string;
}

function parseBody(body: string): { error: string } | ValidSave {
  let parsed: { content?: unknown; filename?: unknown };
  try {
    parsed = JSON.parse(body) as { content?: unknown; filename?: unknown };
  } catch {
    return { error: "Invalid JSON" };
  }

  const { content, filename } = parsed;

  if (typeof filename !== "string" || typeof content !== "string" || filename.includes("..")) {
    return { error: "Invalid filename or content" };
  }

  const dir = filename.split("/")[0];
  if (!dir || !VALID_DIRS.includes(dir)) {
    return { error: `Invalid directory: ${dir}` };
  }

  return { content, filename };
}

async function handleSaveSchema(
  body: string,
  res: import("http").ServerResponse,
  server: import("vite").ViteDevServer,
) {
  const parsed = parseBody(body);
  if ("error" in parsed) {
    send(res, 400, { error: parsed.error });
    return;
  }

  const fullPath = resolve(process.cwd(), SCHEMA_ROOT, parsed.filename);
  const parentDir = resolve(fullPath, "..");

  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  writeFileSync(fullPath, parsed.content, "utf-8");

  try {
    await generate({ forceReload: true });
    send(res, 200, { ok: true, path: `cms/${parsed.filename}` });
    server.ws.send({ type: "full-reload" });
  } catch (err) {
    send(res, 500, { error: String(err) });
  }
}

export function schemaWriterPlugin(): Plugin {
  return {
    configureServer(server) {
      server.middlewares.use("/__dev-api/save-schema", (req, res) => {
        if (req.method !== "POST") {
          send(res, 405, { error: "Method not allowed" });
          return;
        }

        let body = "";
        req.on("data", (chunk: string) => {
          body += chunk;
        });
        req.on("end", () => {
          handleSaveSchema(body, res, server).catch(() => {
            if (!res.headersSent) send(res, 500, { error: "Unexpected error" });
          });
        });
      });
    },
    name: "schema-writer",
  };
}
