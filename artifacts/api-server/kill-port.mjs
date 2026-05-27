#!/usr/bin/env node
import { createServer } from "net";
import { readFileSync, writeFileSync } from "fs";

const port = parseInt(process.env.PORT || "8080");

// Try to kill previously tracked PID
try {
  const pid = readFileSync("/tmp/api-server.pid", "utf8").trim();
  if (pid) process.kill(parseInt(pid), "SIGKILL");
} catch {}

// Also verify port is free by trying to bind
await new Promise((resolve) => {
  const s = createServer();
  s.once("error", () => {
    // Port in use but we already tried killing - just continue
    resolve(null);
  });
  s.once("listening", () => s.close(resolve));
  s.listen(port);
});
