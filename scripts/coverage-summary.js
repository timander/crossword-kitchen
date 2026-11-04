// Prints coverage/coverage-summary.json as a Markdown table (for the CI job summary).
import { readFileSync } from "node:fs";

const { total } = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf8"));
const rows = ["lines", "statements", "functions", "branches"].map(
  (k) => `| ${k} | ${total[k].pct}% | ${total[k].covered}/${total[k].total} |`,
);
process.stdout.write(
  ["### Test coverage", "", "| Metric | % | Covered |", "| --- | --- | --- |", ...rows].join("\n") + "\n",
);
