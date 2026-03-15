module.exports = {
  apps: [
    {
      name: "rybiapaka",
      cwd: __dirname,
      script: "node",
      args: "./scripts/run-prod.js",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
