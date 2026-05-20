import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const clientDir = "dist/client";
const serverDir = "dist/server";

if (!existsSync(clientDir)) {
  throw new Error("Build não gerou dist/client.");
}

if (existsSync(serverDir)) {
  await rm(serverDir, { recursive: true, force: true });
}

await cp(clientDir, "dist", { recursive: true });
await mkdir("dist", { recursive: true });