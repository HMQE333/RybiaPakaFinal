const { spawnSync } = require("child_process");
const path = require("path");

function getPrismaBin() {
  const binName = process.platform === "win32" ? "prisma.cmd" : "prisma";
  return path.join(__dirname, "..", "node_modules", ".bin", binName);
}

function runPrisma(args) {
  const prismaBin = getPrismaBin();
  const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
  const result = spawnSync(prismaBin, [...args, "--schema", schemaPath], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status && result.status !== 0) {
    process.exit(result.status);
  }
}

const shouldRun = (value) => value !== "0" && value !== "false";

if (shouldRun(process.env.PRISMA_GENERATE)) {
  runPrisma(["generate"]);
}

if (shouldRun(process.env.PRISMA_MIGRATE)) {
  runPrisma(["migrate", "deploy"]);
}

require("./server");
