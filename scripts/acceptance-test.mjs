import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const port = Number(process.env.FLASH_PROMOTER_ACCEPTANCE_PORT ?? 3345);
const base = `http://127.0.0.1:${port}/api`;
const dataDir = await mkdtemp(join(tmpdir(), "flash-promoter-acceptance-"));
const tsxCli = join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const child = spawn(process.execPath, [tsxCli, "apps/local-api/src/server.ts"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    FLASH_PROMOTER_API_PORT: String(port),
    FLASH_PROMOTER_DATA_DIR: dataDir
  },
  stdio: ["ignore", "pipe", "pipe"]
});

const serverOutput = [];
child.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
child.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

try {
  await waitForHealth();
  await runAcceptance();
} finally {
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
  await cleanupDataDir();
}

async function runAcceptance() {
  const bodyMarkdown = `# PRD 验收文章

## 核心目标
${"这是一篇用于验证本地 MVP 闭环的文章，覆盖统一内容模型、平台版本生成、发布前校验、确认机制、模拟发布、草稿发布、辅助发布和发布日志。".repeat(18)}

> 不绕过登录、验证码或平台风控。

- 统一模型
- 平台版本
- 校验确认
- 日志记录
`;

  const created = await post("/posts", {
    title: "PRD 完整验收文章",
    bodyMarkdown,
    tags: ["验收", "MVP", "内容创作"],
    inputFormat: "markdown"
  });
  assert(created.id && created.post?.body?.length > 0, "create CanonicalPost");

  // Test 6 adapters (mock, wechat, bilibili, zhihu-assist, xhs-assist, wordpress)
  const generated = await post(`/posts/${created.id}/generate`, {
    platforms: ["mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist", "wordpress"],
    style: "balanced"
  });
  assert(generated.items?.length === 6, "generate 6 platform drafts (incl. WordPress)");
  assert(Boolean(generated.adaptation?.wechat?.bodyMarkdown), "structured adaptation JSON");

  for (const draft of generated.items) {
    const validation = await post(`/drafts/${draft.id}/validate`, {});
    assert(validation.ok === true, `validate ${draft.platform}`);
  }
  pass("validate all drafts");

  // Mock simulate
  const mock = findDraft(generated.items, "mock");
  const mockPublish = await post(`/drafts/${mock.id}/publish`, { mode: "simulate" });
  assert(mockPublish.status === "simulated", "mock simulate publish");

  // Block unconfirmed draft
  const wechat = findDraft(generated.items, "wechat");
  const blocked = await postAllowFailure(`/drafts/${wechat.id}/publish`, { mode: "draft" });
  assert(blocked.statusCode === 409 && blocked.body.error === "draft_confirmation_required", "block unconfirmed draft publish");

  // Confirm and publish WeChat as draft
  const confirmedWechat = await put(`/drafts/${wechat.id}`, { userConfirmed: true });
  assert(confirmedWechat.draft.userConfirmed === true, "confirm WeChat draft");
  const wechatDraft = await post(`/drafts/${wechat.id}/publish`, { mode: "draft" });
  assert(wechatDraft.status === "draft_created", "wechat draft_created after confirmation");

  // Default modes test
  for (const draft of generated.items.filter((item) => item.platform !== "mock" && item.platform !== "wechat")) {
    await put(`/drafts/${draft.id}`, { userConfirmed: true });
    const result = await post(`/drafts/${draft.id}/publish`, {});
    const expectedDefaults = new Map([
      ["bilibili", "simulated"],
      ["zhihu-assist", "assist_opened"],
      ["xhs-assist", "assist_opened"],
      ["wordpress", "draft_created"]
    ]);
    assert(result.status === expectedDefaults.get(draft.platform), `default mode ${draft.platform}`);
    if (draft.platform.endsWith("-assist")) {
      assert(result.result?.raw?.browserAssistPackage?.finalPublishAction === "manual-only", `${draft.platform} manual-only`);
    }
  }
  pass("default modes and assist packages");

  // All platforms simulate
  for (const draft of generated.items) {
    const result = await post(`/drafts/${draft.id}/publish`, { mode: "simulate" });
    assert(result.status === "simulated", `simulate ${draft.platform}`);
  }
  pass("all platforms simulate");

  // Copy mode test
  for (const draft of generated.items.filter((item) => item.platform.endsWith("-assist"))) {
    const copyResult = await post(`/drafts/${draft.id}/publish`, { mode: "copy" });
    assert(copyResult.status === "copied", `copy mode ${draft.platform}`);
  }
  pass("copy mode for assist platforms");

  // WordPress draft mode test
  const wp = findDraft(generated.items, "wordpress");
  await put(`/drafts/${wp.id}`, { userConfirmed: true });
  const wpDraft = await post(`/drafts/${wp.id}/publish`, { mode: "draft" });
  assert(wpDraft.status === "draft_created", "wordpress draft_created");

  // Verify publish jobs and logs
  const jobs = await get("/publish-jobs");
  const logs = await get("/publish-logs");
  assert(jobs.jobs.length >= 14, `publish jobs written (${jobs.jobs.length})`);
  assert(logs.logs.length >= 14, `publish logs written (${logs.logs.length})`);

  // Verify WordPress adapter exists in registry
  const adapters = await get("/adapters");
  const wpAdapter = adapters.adapters.find((a) => a.id === "wordpress");
  assert(!!wpAdapter, "WordPress adapter registered");
  assert(wpAdapter.capabilities.supportsDraft === true, "WordPress supports draft");
}

function findDraft(drafts, platform) {
  const draft = drafts.find((item) => item.platform === platform);
  if (!draft) {
    throw new Error(`Missing draft: ${platform}`);
  }
  return draft;
}

async function waitForHealth() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const health = await get("/health");
      if (health.ok) {
        return;
      }
    } catch {
      await sleep(250);
    }
  }
  throw new Error(`Local API did not start.\n${serverOutput.join("")}`);
}

async function get(path) {
  return request("GET", path);
}

async function post(path, body) {
  const response = await requestWithResponse("POST", path, body);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.statusCode} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function put(path, body) {
  const response = await requestWithResponse("PUT", path, body);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.statusCode} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function postAllowFailure(path, body) {
  return requestWithResponse("POST", path, body);
}

async function request(method, path, body) {
  const response = await requestWithResponse(method, path, body);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.statusCode} ${JSON.stringify(response.body)}`);
  }
  return response.body;
}

async function requestWithResponse(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return {
    ok: response.ok,
    statusCode: response.status,
    body: text ? JSON.parse(text) : null
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL ${message}`);
  }
  pass(message);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupDataDir() {
  try {
    await rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
  } catch (error) {
    console.warn(`WARN acceptance temp cleanup skipped: ${error instanceof Error ? error.message : String(error)}`);
  }
}
