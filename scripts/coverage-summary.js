// Prints coverage/coverage-summary.json as a Markdown table (for the CI job summary).
import { existsSync, readFileSync } from "node:fs";

const file = "coverage/coverage-summary.json";
if (!existsSync(file)) {
  process.stdout.write("### Test coverage\n\nNo coverage report (an earlier step failed).\n");
  process.exit(0);
}
const { total } = JSON.parse(readFileSync(file, "utf8"));
const rows = ["lines", "statements", "functions", "branches"].map(
  (k) => `| ${k} | ${total[k].pct}% | ${total[k].covered}/${total[k].total} |`,
);
process.stdout.write(
  ["### Test coverage", "", "| Metric | % | Covered |", "| --- | --- | --- |", ...rows].join("\n") + "\n",
);
