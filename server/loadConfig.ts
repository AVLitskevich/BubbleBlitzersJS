import fs from "fs";
import path from "path";

export type ServerConfig = {
  port: number;
  host: string;
  serveClient: boolean;
};

const defaults: ServerConfig = {
  port: 3000,
  host: "0.0.0.0",
  serveClient: false,
};

/**
 * Loads config/server.json from cwd (the directory you run node from — usually project root).
 * If PORT or SERVE_CLIENT is set in the environment, they override the file (for PaaS / systemd).
 */
export function loadServerConfig(cwd: string = process.cwd()): ServerConfig {
  const file = path.join(cwd, "config", "server.json");
  let fromFile: Partial<ServerConfig> = {};
  try {
    fromFile = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<ServerConfig>;
  } catch {
    // missing or invalid JSON — use defaults
  }

  const merged: ServerConfig = {
    port:
      typeof fromFile.port === "number" && Number.isFinite(fromFile.port)
        ? fromFile.port
        : defaults.port,
    host: typeof fromFile.host === "string" && fromFile.host.length > 0 ? fromFile.host : defaults.host,
    serveClient: typeof fromFile.serveClient === "boolean" ? fromFile.serveClient : defaults.serveClient,
  };

  let port = merged.port;
  if (process.env.PORT !== undefined && process.env.PORT !== "") {
    const n = Number(process.env.PORT);
    if (Number.isFinite(n)) port = n;
  }

  let serveClient = merged.serveClient;
  if (process.env.SERVE_CLIENT === "true") serveClient = true;
  if (process.env.SERVE_CLIENT === "false") serveClient = false;

  return { ...merged, port, serveClient };
}
