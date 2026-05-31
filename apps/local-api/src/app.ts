import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import {
  adapterRegistry,
  buildPlatformGenerationPrompt,
  callLlm,
  createCanonicalPost,
  createId,
  createLlmConfig,
  defaultPublishMode,
  generatePlatformDrafts,
  generateStructuredPlatformAdaptation,
  generateVideoPlatformAdaptation,
  isRealPublishEnabled,
  isPlatformRealPublishEnabled,
  parsePlatformDraft,
  platformManifests,
  setRealPublishEnabled,
  setPlatformRealPublishEnabled,
  type AiActionRequest,
  type CreatePostInput,
  type LlmConfig,
  type PlatformAccount,
  type PlatformDraft,
  type PlatformDraftUpdate,
  type PlatformId,
  type PublishMode,
  type ValidationResult,
  type VideoAdaptationInput
} from "@flash-promoter/core";
import { FlashPromoterRepository } from "@flash-promoter/storage";

const platformIdSchema = z.enum([
  "mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist",
  "douyin", "kuaishou", "youtube", "instagram", "threads", "facebook-pages", "x-twitter", "linkedin",
  "pinterest", "reddit", "medium", "mastodon", "bluesky", "telegram-channel", "discord", "ghost",
  "toutiao", "baijiahao", "csdn", "juejin", "jianshu", "douban", "notion"
]);
const publishModeSchema = z.enum(["simulate", "copy", "share", "assist", "draft", "submit", "publish"]);

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  bodyMarkdown: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  inputFormat: z.enum(["markdown", "html", "text"]).default("markdown"),
  contentType: z.enum(["article", "video", "image-note", "qa-answer", "short-text", "long-form", "carousel", "link-post"]).default("article"),
  topic: z.string().optional(),
  script: z.string().optional(),
  transcript: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  style: z.string().optional(),
  videoAssetId: z.string().optional(),
  coverAssetId: z.string().optional(),
  assets: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(["image", "video", "cover", "attachment"]).default("image"),
        dataUrl: z.string().optional(),
        localPath: z.string().optional(),
        filename: z.string().optional(),
        mimeType: z.string().optional(),
        size: z.number().optional(),
        duration: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      })
    )
    .optional()
});

const generateSchema = z.object({
  platforms: z.array(platformIdSchema).default(["wechat", "bilibili", "zhihu-assist", "xhs-assist"]),
  style: z.literal("balanced").default("balanced")
});

const publishSchema = z.object({
  mode: publishModeSchema.optional(),
  confirmed: z.boolean().default(false)
});

const updateDraftSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.union([z.string(), z.array(z.unknown())]).optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  platformMeta: z.record(z.string(), z.unknown()).optional(),
  userConfirmed: z.boolean().optional()
});

export function createApp(repository: FlashPromoterRepository, options: { dbPath?: string } = {}) {
  // Restore persisted safety state on startup
  try {
    const sp = repository.getPost("safety_config");
    if (sp) {
      const state = JSON.parse((sp.body[0] as { text?: string }).text ?? "{}") as { realPublishEnabled: boolean; platformSwitches: Record<string, boolean> };
      setRealPublishEnabled(state.realPublishEnabled);
      for (const [platform, enabled] of Object.entries(state.platformSwitches ?? {})) {
        setPlatformRealPublishEnabled(platform as PlatformId, enabled);
      }
    }
  } catch {}

  const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 });

  app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => ({
    ok: true,
    name: "flash-promoter",
    adapters: adapterRegistry.list().map((adapter) => adapter.manifest.id)
  }));

  app.get("/api/settings/storage", async () => ({
    dbPath: options.dbPath ?? ""
  }));

  app.get("/api/adapters", async () => ({
    adapters: adapterRegistry.list().map((adapter) => ({
      id: adapter.manifest.id,
      name: adapter.manifest.name,
      capabilities: {
        supportsDraft: adapter.manifest.publishLevels.includes("draft"),
        supportsDirectPublish: adapter.manifest.publishLevels.includes("publish"),
        supportsAssistPublish: adapter.manifest.publishLevels.includes("assist"),
        supportsSchedule: false,
        contentTypes: adapter.manifest.supportedContentTypes
      },
      defaultMode:
        adapter.manifest.id === "mock"
          ? "simulate"
          : defaultPublishMode[adapter.manifest.id] ?? "simulate"
    }))
  }));

  app.post("/api/posts", async (request, reply) => {
    const parsed = createPostSchema.parse(request.body);
    const timestamp = Date.now();
    const input: CreatePostInput = {
      title: parsed.title,
      body: parsed.bodyMarkdown ?? parsed.body ?? "",
      summary: parsed.summary,
      tags: parsed.tags ?? [],
      inputFormat: parsed.inputFormat,
      contentType: parsed.contentType,
      assets: parsed.assets?.map((asset) => ({
        id: asset.id ?? createId("asset"),
        type: asset.type,
        dataUrl: asset.dataUrl,
        localPath: asset.localPath,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        createdAt: timestamp,
        updatedAt: timestamp
      }))
    };

    const post = createCanonicalPost(input);
    if (parsed.contentType === "video") {
      (post as Record<string, unknown>).topic = parsed.topic ?? "";
      (post as Record<string, unknown>).script = parsed.script ?? "";
      (post as Record<string, unknown>).transcript = parsed.transcript ?? "";
      (post as Record<string, unknown>).highlights = parsed.highlights ?? [];
      (post as Record<string, unknown>).style = parsed.style ?? "";
      (post as Record<string, unknown>).videoAssetId = parsed.videoAssetId ?? "";
      (post as Record<string, unknown>).coverAssetId = parsed.coverAssetId ?? "";
    }
    repository.createPost(post);
    return reply.code(201).send({
      id: post.id,
      status: "created",
      post
    });
  });

  app.get("/api/posts", async () => ({
    posts: repository.listPosts()
  }));

  app.get<{ Params: { postId: string } }>("/api/posts/:postId", async (request, reply) => {
    const post = repository.getPost(request.params.postId);
    if (!post) {
      return reply.code(404).send({ error: "post_not_found" });
    }
    return {
      post,
      drafts: repository.listPlatformDrafts(post.id)
    };
  });

  app.post<{ Params: { postId: string } }>("/api/posts/:postId/generate", async (request, reply) => {
    const post = repository.getPost(request.params.postId);
    if (!post) {
      return reply.code(404).send({ error: "post_not_found" });
    }

    const parsed = generateSchema.parse(request.body ?? {});
    const platforms = parsed.platforms as PlatformId[];

    const llmPost = repository.getPost(llmConfigKey);
    let llmConfig: LlmConfig | null = null;
    if (llmPost) {
      try { llmConfig = JSON.parse((llmPost.body[0] as { text?: string }).text ?? "{}") as LlmConfig; } catch {}
    }
    const useLlm = !!(llmConfig?.enabled && llmConfig.apiKeyEncrypted && llmConfig.baseUrl);

    let drafts: PlatformDraft[];

    if (useLlm && llmConfig) {
      // LLM-powered per-platform generation
      const body = post.body.map((b) => ("text" in b ? b.text : "")).join("\n\n");
      drafts = [];
      for (const platform of platforms) {
        if (platform === "mock") {
          const mockDrafts = await generatePlatformDrafts(post, [platform], { style: "balanced" });
          drafts.push(...mockDrafts);
          continue;
        }
        const prompt = buildPlatformGenerationPrompt(platform, post.title, body, post.summary ?? "", post.tags);
        try {
          const res = await callLlm(llmConfig, {
            contentId: post.id, action: "generate", contentType: "article",
            currentValue: prompt, slotKey: platform, fieldLabel: platform,
            inputContext: { title: post.title, body, summary: post.summary, tags: post.tags }
          });
          const draft = parsePlatformDraft(platform, post.id, post.title, body, post.summary ?? "", post.tags, res.candidates[0] ?? "", post.assets);
          drafts.push(draft);
        } catch {
          const fallback = await generatePlatformDrafts(post, [platform], { style: "balanced" });
          drafts.push(...fallback);
        }
      }
    } else {
      const adaptation = generateStructuredPlatformAdaptation(post);
      drafts = await generatePlatformDrafts(post, platforms, { style: "balanced" });
      repository.replacePlatformDrafts(post.id, drafts);
      return {
        drafts: drafts.map((draft) => ({ id: draft.id, platform: draft.platform, status: "ready" })),
        items: drafts,
        adaptation
      };
    }

    repository.replacePlatformDrafts(post.id, drafts);
    return {
      drafts: drafts.map((draft) => ({
        id: draft.id,
        platform: draft.platform,
        status: "ready"
      })),
      items: drafts
    };
  });

  app.post<{ Params: { postId: string } }>("/api/posts/:postId/video-adaptations", async (request, reply) => {
    const post = repository.getPost(request.params.postId);
    if (!post) {
      return reply.code(404).send({ error: "post_not_found" });
    }

    const parsed = generateSchema.parse(request.body ?? {});
    const platforms = parsed.platforms as PlatformId[];

    const llmPost = repository.getPost(llmConfigKey);
    const llmConfig: LlmConfig | null = llmPost ? JSON.parse((llmPost.body[0] as { text?: string }).text ?? "{}") as LlmConfig : null;

    const input: VideoAdaptationInput = {
      id: post.id,
      title: post.title,
      topic: (post as Record<string, unknown>).topic as string ?? post.summary ?? "",
      summary: post.summary,
      style: (post as Record<string, unknown>).style as string | undefined,
      script: (post as Record<string, unknown>).script as string | undefined,
      transcript: (post as Record<string, unknown>).transcript as string | undefined,
      highlights: (post as Record<string, unknown>).highlights as string[] | undefined,
      tags: post.tags
    };

    let drafts: PlatformDraft[];

    const llmPost2 = repository.getPost(llmConfigKey);
    let llmConfig2: LlmConfig | null = null;
    if (llmPost2) {
      try { llmConfig2 = JSON.parse((llmPost2.body[0] as { text?: string }).text ?? "{}") as LlmConfig; } catch {}
    }
    const useLlm2 = !!(llmConfig2?.enabled && llmConfig2.apiKeyEncrypted && llmConfig2.baseUrl);

    if (useLlm2 && llmConfig2) {
      const body = (input.script ?? input.transcript ?? input.summary ?? "");
      drafts = [];
      for (const platform of platforms) {
        if (platform === "mock") continue;
        const prompt = buildPlatformGenerationPrompt(platform, input.title, body, input.summary ?? "", input.tags);
        try {
          const res = await callLlm(llmConfig2, {
            contentId: post.id, action: "generate", contentType: "video",
            currentValue: prompt, slotKey: platform, fieldLabel: platform,
            inputContext: { title: input.title, body, summary: input.summary, tags: input.tags, topic: input.topic }
          });
          const draft = parsePlatformDraft(platform, post.id, input.title, body, input.summary ?? "", input.tags, res.candidates[0] ?? "", post.assets);
          drafts.push(draft);
        } catch {
          const fallback = generateVideoPlatformAdaptation(input, [platform]);
          drafts.push(...fallback);
        }
      }
    } else {
      drafts = generateVideoPlatformAdaptation(input, platforms);
    }

    repository.replacePlatformDrafts(post.id, drafts);
    return {
      drafts: drafts.map((draft) => ({
        id: draft.id,
        platform: draft.platform,
        status: "ready"
      })),
      items: drafts
    };
  });

  app.get<{ Params: { postId: string } }>("/api/posts/:postId/drafts", async (request, reply) => {
    const post = repository.getPost(request.params.postId);
    if (!post) {
      return reply.code(404).send({ error: "post_not_found" });
    }
    return {
      drafts: repository.listPlatformDrafts(post.id)
    };
  });

  app.post<{ Params: { draftId: string } }>("/api/drafts/:draftId/validate", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) {
      return reply.code(404).send({ error: "draft_not_found" });
    }

    const validation = await validateDraft(draft);
    const updated = repository.updateDraftValidation(draft.id, validation);
    return {
      ok: validation.ok,
      warnings: validation.warnings,
      errors: validation.errors,
      draft: updated
    };
  });

  app.put<{ Params: { draftId: string } }>("/api/drafts/:draftId", async (request, reply) => {
    const current = repository.getPlatformDraft(request.params.draftId);
    if (!current) {
      return reply.code(404).send({ error: "draft_not_found" });
    }

    const parsed = updateDraftSchema.parse(request.body ?? {});
    const updated = repository.updatePlatformDraft(current.id, parsed as PlatformDraftUpdate);
    return {
      draft: updated
    };
  });

  app.post<{ Params: { draftId: string } }>("/api/drafts/:draftId/publish", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) {
      return reply.code(404).send({ error: "draft_not_found" });
    }

    const parsed = publishSchema.parse(request.body ?? {});
    const mode = parsed.mode ?? defaultModeForPlatform(draft.platform);
    const job = repository.createPublishJob({
      postId: draft.postId,
      draftId: draft.id,
      platform: draft.platform,
      mode
    });

    repository.addPublishLog({
      jobId: job.id,
      platform: draft.platform,
      level: "info",
      message: `开始发布前校验，模式：${mode}`,
      raw: { draftId: draft.id, mode }
    });

    const validation = await validateDraft(draft);
    repository.updateDraftValidation(draft.id, validation);

    if (!validation.ok) {
      const message = validation.errors.map((error) => error.message).join("；") || "发布前校验失败";
      repository.updatePublishJob(job.id, "failed", undefined, message);
      repository.addPublishLog({
        jobId: job.id,
        platform: draft.platform,
        level: "error",
        message,
        raw: validation
      });
      return reply.code(422).send({
        jobId: job.id,
        status: "failed",
        validation
      });
    }

    if (mode !== "simulate" && draft.aiGenerated && !draft.userConfirmed) {
      const message = "平台版本为自动生成内容，必须先由用户确认后才能执行 draft / assist / publish。";
      repository.updatePublishJob(job.id, "failed", undefined, message);
      repository.addPublishLog({
        jobId: job.id,
        platform: draft.platform,
        level: "error",
        message,
        raw: { draftId: draft.id, userConfirmed: draft.userConfirmed, mode }
      });
      return reply.code(409).send({
        jobId: job.id,
        status: "failed",
        error: "draft_confirmation_required",
        message
      });
    }

    if (mode === "publish" && !parsed.confirmed) {
      const message = "真实发布需要二次确认；MVP 默认不启用真实发布。";
      repository.updatePublishJob(job.id, "failed", undefined, message);
      repository.addPublishLog({
        jobId: job.id,
        platform: draft.platform,
        level: "error",
        message,
        raw: { requiresSecondConfirmation: true, realPlatformCalled: false }
      });
      return reply.code(409).send({
        jobId: job.id,
        status: "failed",
        error: "publish_confirmation_required",
        message
      });
    }

    try {
      const adapter = adapterRegistry.get(draft.platform);
      const result = await adapter.publish(draft, accountFor(draft.platform, repository), mode);
      repository.updatePublishJob(job.id, result.status, result, result.errorMessage);
      repository.addPublishLog({
        jobId: job.id,
        platform: draft.platform,
        level: result.status === "failed" ? "error" : "info",
        message: result.message ?? result.errorMessage ?? `发布任务完成：${result.status}`,
        raw: result
      });
      return {
        jobId: job.id,
        status: result.status,
        result
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知发布错误";
      repository.updatePublishJob(job.id, "failed", undefined, message);
      repository.addPublishLog({
        jobId: job.id,
        platform: draft.platform,
        level: "error",
        message,
        raw: { error: message }
      });
      return reply.code(500).send({
        jobId: job.id,
        status: "failed",
        error: message
      });
    }
  });

  app.get("/api/publish-jobs", async () => ({
    jobs: repository.listPublishJobs()
  }));

  app.get<{ Params: { jobId: string } }>("/api/publish-jobs/:jobId", async (request, reply) => {
    const job = repository.getPublishJob(request.params.jobId);
    if (!job) {
      return reply.code(404).send({ error: "job_not_found" });
    }
    return job;
  });

  app.get("/api/publish-logs", async () => ({
    logs: repository.listPublishLogs()
  }));

  // === Independent Publish-Level Endpoints ===

  app.post<{ Params: { draftId: string } }>("/api/drafts/:draftId/create-draft", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) return reply.code(404).send({ error: "draft_not_found" });
    const adapter = adapterRegistry.get(draft.platform);
    if (!adapter.createDraft) return reply.code(400).send({ error: "createDraft not supported for this platform" });
    const result = await adapter.createDraft(draft, accountFor(draft.platform, repository));
    return { result };
  });

  app.post<{ Params: { draftId: string } }>("/api/drafts/:draftId/submit", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) return reply.code(404).send({ error: "draft_not_found" });
    const adapter = adapterRegistry.get(draft.platform);
    if (!adapter.submit) return reply.code(400).send({ error: "submit not supported for this platform" });
    const result = await adapter.submit(draft, accountFor(draft.platform, repository), { dryRun: false, confirmed: false });
    return { result };
  });

  app.post<{ Params: { draftId: string } }>("/api/drafts/:draftId/prepare-assets", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) return reply.code(404).send({ error: "draft_not_found" });
    const adapter = adapterRegistry.get(draft.platform);
    if (!adapter.prepareAssets) return reply.code(400).send({ error: "prepareAssets not supported for this platform" });
    const result = await adapter.prepareAssets(draft, accountFor(draft.platform, repository));
    return { result };
  });

  app.post<{ Params: { draftId: string } }>("/api/drafts/:draftId/dry-run", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) return reply.code(404).send({ error: "draft_not_found" });
    const adapter = adapterRegistry.get(draft.platform);
    if (!adapter.dryRun) return reply.code(400).send({ error: "dryRun not supported for this platform" });
    const parsed = publishSchema.parse(request.body ?? {});
    const result = await adapter.dryRun(draft, accountFor(draft.platform, repository), parsed.mode ?? defaultModeForPlatform(draft.platform));
    return { result };
  });

  app.get<{ Params: { draftId: string } }>("/api/drafts/:draftId/status", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) return reply.code(404).send({ error: "draft_not_found" });
    const job = repository.listPublishJobs().find((j) => j.draftId === draft.id);
    if (!job || !job.externalId) return reply.code(404).send({ error: "no_published_external_id" });
    const adapter = adapterRegistry.get(draft.platform);
    if (!adapter.getStatus) return reply.code(400).send({ error: "getStatus not supported for this platform" });
    const result = await adapter.getStatus(job.externalId, accountFor(draft.platform, repository));
    return { result };
  });

  app.get<{ Params: { draftId: string } }>("/api/drafts/:draftId/metrics", async (request, reply) => {
    const draft = repository.getPlatformDraft(request.params.draftId);
    if (!draft) return reply.code(404).send({ error: "draft_not_found" });
    const job = repository.listPublishJobs().find((j) => j.draftId === draft.id);
    if (!job || !job.externalId) return reply.code(404).send({ error: "no_published_external_id" });
    const adapter = adapterRegistry.get(draft.platform);
    if (!adapter.getMetrics) return reply.code(400).send({ error: "getMetrics not supported for this platform" });
    const result = await adapter.getMetrics(job.externalId, accountFor(draft.platform, repository));
    return { result };
  });

  // === Account Management ===

  app.get("/api/accounts", async () => ({
    accounts: repository.listAccounts()
  }));

  app.get<{ Params: { accountId: string } }>("/api/accounts/:accountId", async (request, reply) => {
    const account = repository.getAccount(request.params.accountId);
    if (!account) return reply.code(404).send({ error: "account_not_found" });
    return { account: { ...account, encryptedCredentials: "***" } };
  });

  app.post("/api/accounts", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const account = repository.createAccount({
      id: createId("acct"),
      platform: String(body.platform) as PlatformId,
      displayName: String(body.displayName ?? ""),
      authType: String(body.authType ?? "none") as PlatformAccount["authType"],
      encryptedCredentials: String(body.encryptedCredentials ?? ""),
      scopes: Array.isArray(body.scopes) ? (body.scopes as string[]) : [],
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return reply.code(201).send({ account: { ...account, encryptedCredentials: "***" } });
  });

  app.put<{ Params: { accountId: string } }>("/api/accounts/:accountId", async (request, reply) => {
    const existing = repository.getAccount(request.params.accountId);
    if (!existing) return reply.code(404).send({ error: "account_not_found" });
    const body = request.body as Record<string, unknown>;
    const updated = repository.updateAccount(request.params.accountId, {
      displayName: body.displayName !== undefined ? String(body.displayName) : undefined,
      scopes: body.scopes !== undefined ? (Array.isArray(body.scopes) ? (body.scopes as string[]) : []) : undefined,
      status: body.status !== undefined ? String(body.status) as PlatformAccount["status"] : undefined,
      encryptedCredentials: body.encryptedCredentials !== undefined ? String(body.encryptedCredentials) : undefined
    });
    return { account: updated ? { ...updated, encryptedCredentials: "***" } : null };
  });

  app.delete<{ Params: { accountId: string } }>("/api/accounts/:accountId", async (request, reply) => {
    const deleted = repository.deleteAccount(request.params.accountId);
    if (!deleted) return reply.code(404).send({ error: "account_not_found" });
    return reply.code(204).send();
  });

  // === LLM config ===
  const llmConfigKey = "llm_config";

  app.get("/api/settings/llm", async () => {
    const post = repository.getPost(llmConfigKey);
    if (!post) return { config: createLlmConfig() };
    const raw = parseStoredLlmConfig(post);
    return { config: maskLlmConfig(raw) };
  });

  app.post("/api/settings/llm", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const incomingKey = String(body.apiKeyEncrypted ?? "");
    const incomingImageKey = String(body.imageApiKey ?? "");
    const existing = repository.getPost(llmConfigKey);
    const stored = existing ? parseStoredLlmConfig(existing) : null;
    const storedKey = stored?.apiKeyEncrypted ?? "";
    const storedImageKey = stored?.imageApiKey ?? "";
    // If the client sent a masked key (contains ****) or empty, keep the real stored key
    const keyToSave = isNewSecret(incomingKey) ? incomingKey : storedKey;
    const imageKeyToSave = isNewSecret(incomingImageKey) ? incomingImageKey : storedImageKey;
    const config = createLlmConfig({
      enabled: Boolean(body.enabled),
      provider: String(body.provider ?? "openai-compatible"),
      baseUrl: String(body.baseUrl ?? ""),
      apiKeyEncrypted: keyToSave,
      model: String(body.model ?? "gpt-4o"),
      temperature: Number(body.temperature ?? 0.7),
      timeoutMs: Number(body.timeoutMs ?? 30000),
      maxTokens: body.maxTokens ? Number(body.maxTokens) : undefined,
      imageBaseUrl: String(body.imageBaseUrl ?? stored?.imageBaseUrl ?? ""),
      imageApiKey: imageKeyToSave,
      imageModel: String(body.imageModel ?? stored?.imageModel ?? "dall-e-3"),
      capabilities: (body.capabilities as LlmConfig["capabilities"]) ?? { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true },
      createdAt: stored?.createdAt ?? Date.now(),
      updatedAt: Date.now()
    });
    if (existing) {
      existing.body = [{ type: "paragraph", text: JSON.stringify(config) }];
      repository.updatePost(existing);
    } else {
      repository.createPost({
        id: llmConfigKey, title: "LLM Config",
        body: [{ type: "paragraph", text: JSON.stringify(config) }],
        assets: [], tags: [], contentType: "article",
        createdAt: Date.now(), updatedAt: Date.now()
      });
    }
    return { ok: true, config: maskLlmConfig(config) };
  });

  app.post("/api/settings/llm/test", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const existing = repository.getPost(llmConfigKey);
    const stored = existing ? parseStoredLlmConfig(existing) : createLlmConfig();
    const incomingKey = String(body.apiKeyEncrypted ?? "");
    const apiKey = isNewSecret(incomingKey) ? incomingKey : stored.apiKeyEncrypted;
    const baseUrl = String(body.baseUrl ?? stored.baseUrl ?? "").replace(/\/$/, "");
    const model = String(body.model ?? stored.model ?? "gpt-4o");
    if (!apiKey) {
      return reply.code(400).send({ ok: false, error: "API Key 未配置" });
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "Hello" }], max_tokens: 5 }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, message: "连接成功" };
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : "连接失败" });
    }
  });

  // === AI Actions ===
  app.post("/api/ai/actions", async (request, reply) => {
    const existing = repository.getPost(llmConfigKey);
    if (!existing) return reply.code(400).send({ error: "请先在设置中配置 LLM" });
    const config = JSON.parse((existing.body[0] as { text?: string }).text ?? "{}") as LlmConfig;
    if (!config.enabled || !config.apiKeyEncrypted) return reply.code(400).send({ error: "LLM 未启用或未配置 API Key" });
    try {
      const result = await callLlm(config, request.body as AiActionRequest);
      repository.addPublishLog({ jobId: "ai", platform: "mock", level: "info", message: `AI ${result.action} on ${(request.body as AiActionRequest).slotKey}`, raw: result });
      return result;
    } catch (error) {
      repository.addPublishLog({ jobId: "ai", platform: "mock", level: "error", message: `AI error: ${error instanceof Error ? error.message : ""}`, raw: {} });
      return reply.code(500).send({ error: error instanceof Error ? error.message : "AI 调用失败" });
    }
  });

  // === Safety / Real Publish ===
  app.get("/api/settings/safety", async () => {
    // Load persisted state
    let persisted = { realPublishEnabled: false, platformSwitches: {} as Record<string, boolean> };
    try {
      const sp = repository.getPost("safety_config");
      if (sp) persisted = JSON.parse((sp.body[0] as { text?: string }).text ?? "{}") as typeof persisted;
    } catch {}
    const switches: Record<string, boolean> = {};
    for (const manifest of Object.values(platformManifests)) {
      switches[manifest.id] = (persisted.platformSwitches[manifest.id] ?? false) && manifest.publishLevels.some((l) => l === "submit" || l === "publish");
    }
    return {
      realPublishEnabled: persisted.realPublishEnabled,
      platformSwitches: switches,
      platformGuides: Object.values(platformManifests).filter((m) => m.id !== "mock").map((m) => ({
        id: m.id, name: m.name, authType: m.auth.type, setupNote: m.auth.note ?? "", setupUrl: m.auth.setupUrl ?? "",
        docs: m.docs ?? [], publishLevels: m.publishLevels, riskLevel: m.riskLevel, defaultMode: m.defaultMode, supportedContentTypes: m.supportedContentTypes
      }))
    };
  });

  app.post("/api/settings/safety", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    let state = { realPublishEnabled: false, platformSwitches: {} as Record<string, boolean> };
    try {
      const sp = repository.getPost("safety_config");
      if (sp) state = JSON.parse((sp.body[0] as { text?: string }).text ?? "{}") as typeof state;
    } catch {}

    if (typeof body.realPublishEnabled === "boolean") {
      state.realPublishEnabled = body.realPublishEnabled;
      setRealPublishEnabled(body.realPublishEnabled);
    }
    if (body.platformSwitches && typeof body.platformSwitches === "object") {
      for (const [platform, enabled] of Object.entries(body.platformSwitches as Record<string, boolean>)) {
        state.platformSwitches[platform] = enabled;
        setPlatformRealPublishEnabled(platform as PlatformId, enabled);
      }
    }

    const json = JSON.stringify(state);
    const existing = repository.getPost("safety_config");
    if (existing) {
      existing.body = [{ type: "paragraph", text: json }];
      repository.updatePost(existing);
    } else {
      repository.createPost({ id: "safety_config", title: "Safety Config", body: [{ type: "paragraph", text: json }], assets: [], tags: [], contentType: "article", createdAt: Date.now(), updatedAt: Date.now() });
    }
    return { ok: true };
  });

  // === Platform Credentials (stored in SQLite) ===
  const credConfigKey = "platform_credentials";

  app.get("/api/platform-accounts", async () => {
    const post = repository.getPost(credConfigKey);
    if (!post) return { accounts: [] };
    try {
      const raw = JSON.parse((post.body[0] as { text?: string }).text ?? "[]") as Array<Record<string, unknown>>;
      return { accounts: raw.map((r) => ({ ...r, encryptedCredentials: "***" })) };
    } catch { return { accounts: [] }; }
  });

  app.post("/api/platform-accounts", async (request, reply) => {
    const body = request.body as { platform: string; displayName?: string; authType?: string; credentials?: Record<string, string> };
    try {
      const existing = repository.getPost(credConfigKey);
      let accounts: Array<Record<string, unknown>> = [];
      if (existing) {
        try { accounts = JSON.parse((existing.body[0] as { text?: string }).text ?? "[]") as Array<Record<string, unknown>>; } catch {}
      }
      const idx = accounts.findIndex((a) => a.platform === body.platform);
      const entry = {
        platform: body.platform, displayName: body.displayName ?? body.platform,
        authType: body.authType ?? "api-key", credentials: body.credentials ?? {},
        status: "active", createdAt: Date.now()
      };
      if (idx >= 0) accounts[idx] = entry; else accounts.push(entry);

      const json = JSON.stringify(accounts);
      if (existing) {
        existing.body = [{ type: "paragraph", text: json }];
        repository.updatePost(existing);
      } else {
        repository.createPost({ id: credConfigKey, title: "Platform Credentials", body: [{ type: "paragraph", text: json }], assets: [], tags: [], contentType: "article", createdAt: Date.now(), updatedAt: Date.now() });
      }
      return { ok: true, account: { ...entry, credentials: "***" } };
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "保存失败" });
    }
  });

  app.delete<{ Params: { platform: string } }>("/api/platform-accounts/:platform", async (request, reply) => {
    const post = repository.getPost(credConfigKey);
    if (!post) return reply.code(404).send({ error: "not_found" });
    try {
      let accounts = JSON.parse((post.body[0] as { text?: string }).text ?? "[]") as Array<Record<string, unknown>>;
      accounts = accounts.filter((a) => a.platform !== request.params.platform);
      post.body = [{ type: "paragraph", text: JSON.stringify(accounts) }];
      repository.updatePost(post);
      return { ok: true };
    } catch { return reply.code(500).send({ error: "删除失败" }); }
  });

  // === AI Image Generation ===
  app.post("/api/ai/generate-image", async (request, reply) => {
    const body = request.body as { prompt: string; n?: number; size?: string };
    const existing = repository.getPost(llmConfigKey);
    if (!existing) return reply.code(400).send({ error: "请先在设置中配置 LLM" });
    const config = JSON.parse((existing.body[0] as { text?: string }).text ?? "{}") as LlmConfig & { imageBaseUrl?: string; imageApiKey?: string; imageModel?: string };
    if (!config.enabled || !config.apiKeyEncrypted || !config.capabilities?.image) {
      return reply.code(400).send({ error: "当前模型不支持图片生成，请在设置中启用图片能力" });
    }
    const baseUrl = config.imageBaseUrl || config.baseUrl;
    const apiKey = config.imageApiKey || config.apiKeyEncrypted;
    const model = config.imageModel || "dall-e-3";
    try {
      const res = await fetch(`${baseUrl}/images/generations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, prompt: body.prompt ?? "illustration", n: body.n ?? 1, size: body.size ?? "1024x1024" }),
        signal: AbortSignal.timeout(config.timeoutMs)
      });
      if (!res.ok) {
        const err = await res.text().catch(() => "");
        return reply.code(400).send({ error: `图片生成失败: ${err.slice(0, 200)}` });
      }
      const data = await res.json() as { data: Array<{ url?: string; b64_json?: string }> };
      const images = data.data?.map((img) => ({ url: img.url, b64Json: img.b64_json })) ?? [];
      return { images };
    } catch (error) {
      return reply.code(500).send({ error: error instanceof Error ? error.message : "图片生成失败" });
    }
  });

  return app;
}

async function validateDraft(draft: PlatformDraft): Promise<ValidationResult> {
  const adapter = adapterRegistry.get(draft.platform);
  return adapter.validate(draft);
}

function defaultModeForPlatform(platform: PlatformId): PublishMode {
  if (platform === "mock") {
    return "simulate";
  }
  return defaultPublishMode[platform as keyof typeof defaultPublishMode];
}

function accountFor(platform: PlatformId, credStore: FlashPromoterRepository): PlatformAccount {
  const timestamp = Date.now();
  let credentials = "";
  try {
    const credPost = credStore.getPost("platform_credentials");
    if (credPost) {
      const accounts = JSON.parse((credPost.body[0] as { text?: string }).text ?? "[]") as Array<Record<string, unknown>>;
      const match = accounts.find((a) => a.platform === platform);
      if (match?.credentials) credentials = JSON.stringify(match.credentials);
    }
  } catch {}
  return {
    id: `local-${platform}`,
    platform,
    displayName: platform,
    authType: platform === "mock" ? "mock" : platform === "wechat" ? "app-secret" : "none",
    encryptedCredentials: credentials,
    scopes: [],
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return key;
  return key.slice(0, 4) + "****" + key.slice(-4);
}

function parseStoredLlmConfig(post: { body?: unknown }): LlmConfig {
  try {
    const body = Array.isArray(post.body) ? post.body : [];
    const first = body[0] as { text?: string } | undefined;
    return createLlmConfig(JSON.parse(first?.text ?? "{}") as Partial<LlmConfig>);
  } catch {
    return createLlmConfig();
  }
}

function maskLlmConfig(config: LlmConfig): LlmConfig {
  return {
    ...config,
    apiKeyEncrypted: maskKey(config.apiKeyEncrypted),
    imageApiKey: config.imageApiKey ? maskKey(config.imageApiKey) : config.imageApiKey
  };
}

function isNewSecret(value: string): boolean {
  return Boolean(value && !value.includes("****"));
}
