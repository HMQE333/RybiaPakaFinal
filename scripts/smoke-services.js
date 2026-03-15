const BASE_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYGWNgYGD4DwABBAEAu1bq3QAAAABJRU5ErkJggg==";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name}_MISSING`);
  }
  return value;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`REQUEST_FAILED_${response.status}`);
  }
  return response.json();
}

async function run() {
  const mainBase = process.env.MAIN_BASE_URL;
  const dataBase = process.env.DATA_BASE_URL;
  const galleryBase = process.env.GALLERY_BASE_URL;

  if (mainBase) {
    await fetchJson(`${mainBase.replace(/\/+$/, "")}/health`);
    await fetchJson(`${mainBase.replace(/\/+$/, "")}/api/health/data`);
    console.log("MAIN health + DATA proxy ok");
  }

  if (dataBase) {
    await fetchJson(`${dataBase.replace(/\/+$/, "")}/health`);
    console.log("DATA health ok");
  }

  if (galleryBase && process.env.SMOKE_AUTHOR_ID) {
    const form = new FormData();
    const buffer = Buffer.from(BASE_PNG, "base64");
    form.set("file", new Blob([buffer], { type: "image/png" }), "smoke.png");
    form.set("kind", "gallery");
    form.set("authorId", String(process.env.SMOKE_AUTHOR_ID));
    form.set("title", "Smoke Test");
    form.set("category", "Krajobraz");

    const response = await fetch(`${galleryBase.replace(/\/+$/, "")}/upload`, {
      method: "POST",
      headers: {
        "x-service-token": requireEnv("GALLERY_SERVICE_TOKEN"),
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`GALLERY_UPLOAD_FAILED_${response.status}`);
    }

    const result = await response.json();
    if (!result?.url || !result?.item?.id) {
      throw new Error("GALLERY_UPLOAD_MISSING_RESULT");
    }
    console.log("GALLERY upload + DATA metadata ok");
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error?.message || error);
  process.exit(1);
});
