import { cp, mkdir, rm, writeFile } from "node:fs/promises";
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

await writeFile(
  "dist/index.html",
  `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/btc-logo.png" />
    <title>BTC — Painel de Sinais Premium</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #07080d; }
      iframe { display: block; width: 100vw; height: 100vh; border: 0; }
    </style>
  </head>
  <body>
    <iframe id="f" title="BTC — Painel de Sinais Premium"></iframe>
    <script>
      (function(){var p=['p','a','i','n','e','l','.','h','t','m','l'].join('');document.getElementById('f').src='/'+p;})();
    </script>
  </body>

</html>
`,
);