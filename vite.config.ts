/// <reference types="vitest/config" />
import { createHash } from "node:crypto";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const sha256 = (text: string) => `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
const inlineHashes = (html: string, tag: "script" | "style") =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "g"))].map((m) => sha256(m[1] ?? ""));

/**
 * After the single-file build, add a strict Content-Security-Policy that only
 * allows the exact inline script and styles we shipped (by hash), and enforces
 * Trusted Types so no code can write HTML strings into the DOM.
 * Also writes dist/crossword.html, the copy meant for emailing/USB sticks.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: "content-security-policy",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      const file = resolve("dist/index.html");
      const html = await readFile(file, "utf8");
      const policy = [
        "default-src 'none'",
        `script-src ${inlineHashes(html, "script").join(" ")}`,
        `style-src ${inlineHashes(html, "style").join(" ")}`,
        "img-src data:",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        "require-trusted-types-for 'script'",
        "trusted-types 'none'",
      ].join("; ");
      const out = html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
      await writeFile(file, out);
      await copyFile(file, resolve("dist/crossword.html"));
    },
  };
}

export default defineConfig({
  base: "./",
  build: {
    target: "es2023",
    modulePreload: { polyfill: false },
  },
  plugins: [viteSingleFile(), contentSecurityPolicy()],
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts", "src/wordbanks/**"],
      reporter: ["text-summary", "text", "html", "json-summary"],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
});
