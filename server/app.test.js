import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "./app.js";

test("health endpoint reports API status and runtime diagnostics", async (t) => {
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const health = await response.json();

  assert.equal(response.status, 200);
  assert.equal(health.status, "ok");
  assert.equal(health.service, "sector-zero-api");
  assert.equal(typeof health.uptimeSeconds, "number");
  assert.ok(health.uptimeSeconds >= 0);
  assert.ok(Number.isFinite(Date.parse(health.checkedAt)));
});
