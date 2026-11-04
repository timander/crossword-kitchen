// Bundles src/ into a single self-contained HTML file: dist/crossword.html
import * as esbuild from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (f: string) => path.join(root, "src", f);
const outFile = path.join(root, "dist", "crossword.html");
const watch = process.argv.includes("--watch");

async function assemble(js: string) {
  const [html, css] = await Promise.all([readFile(src("index.html"), "utf8"), readFile(src("styles.css"), "utf8")]);
  const minCss = (await esbuild.transform(css, { loader: "css", minify: true })).code;
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  // Function replacers so "$" in the code isn't treated as a replacement pattern.
  const out = html.replace("/*__STYLES__*/", () => minCss).replace("/*__SCRIPT__*/", () => safeJs);
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, out);
  console.log(`✔ ${path.relative(root, outFile)} (${(out.length / 1024).toFixed(1)} KB)`);
}

const options: esbuild.BuildOptions = {
  entryPoints: [src("main.ts")],
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: !watch,
  write: false,
  logLevel: "warning",
  plugins: [
    {
      name: "inline-html",
      setup(build) {
        build.onEnd(async (result) => {
          if (result.errors.length) return;
          await assemble(result.outputFiles![0].text);
        });
      },
    },
  ],
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  // CSS/HTML aren't part of the JS graph; rebuild when they change too.
  const { watch: fsWatch } = await import("node:fs");
  for (const f of ["index.html", "styles.css"]) fsWatch(src(f), () => ctx.rebuild().catch(() => {}));
  console.log("Watching src/ … open dist/crossword.html and refresh after changes.");
} else {
  await esbuild.build(options);
}
