// Copies the scrcpy server binary (downloaded by `fetch-scrcpy-server` in
// postinstall) into `public/`, so the browser can fetch it and push it to the
// phone. Plain Node so it behaves the same on macOS, Windows and Linux.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const packageDir = dirname(
  require.resolve("@yume-chan/fetch-scrcpy-server/package.json"),
);
const source = join(packageDir, "server.bin");
const target = join(root, "public", "scrcpy-server.bin");

if (!existsSync(source)) {
  console.error(
    "scrcpy server not found. Run `npx fetch-scrcpy-server 3.3.3` first.",
  );
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`Copied scrcpy server to ${target}`);
