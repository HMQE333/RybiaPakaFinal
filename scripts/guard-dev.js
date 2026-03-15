const { spawnSync } = require("child_process");

const isRailway = Object.keys(process.env).some((key) =>
  key.startsWith("RAILWAY_")
);

if (process.env.NODE_ENV === "production" || isRailway) {
  console.error("This script is blocked in production.");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Missing command.");
  process.exit(1);
}

const result = spawnSync(args[0], args.slice(1), {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status || 0);
