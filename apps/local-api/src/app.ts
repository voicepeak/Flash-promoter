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
  parsePlatformDraft,
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

const platformIdSchema = z.enum(["mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist"]);
const publishModeSchema = z.enum(["simulate", "draft", "assist", "publish"]);

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  bodyMarkdown: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  inputFormat: z.enum(["markdown", "html", "text"]).default("markdown"),
  contentType: z.enum(["article", "video", "image-note", "qa-answer"]).default("article"),
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

export function createApp(repository: FlashPromoterRepository) {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true
  });

  app.get("/api/health", async () => ({
    ok: true,
    name: "flash-promoter",
    adapters: adapterRegistry.list().map((adapter) => adapter.id)
  }));

  app.get("/api/adapters", async () => ({
    adapters: adapterRegistry.list().map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      capabilities: adapter.capabilities,
      defaultMode:
        adapter.id === "mock"
          ? "simulate"
          : defaultPublishMode[adapter.id as keyof typeof defaultPublishMode]
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
          const draft = parsePlatformDraft(platform, post.id, post.title, body, post.summary ?? "", post.tags, res.candidates[0] ?? "");
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
          const draft = parsePlatformDraft(platform, post.id, input.title, body, input.summary ?? "", input.tags, res.candidates[0] ?? "");
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
      const result = await adapter.publish(draft, accountFor(draft.platform), mode);
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

  // === LLM config ===
  const llmConfigKey = "llm_config";

  app.get("/api/settings/llm", async () => {
    const post = repository.getPost(llmConfigKey);
    if (!post) return { config: createLlmConfig() };
    const raw = JSON.parse((post.body?.[0] as { text?: string } | undefined)?.text ?? "{}") as LlmConfig;
    return { config: { ...raw, apiKeyEncrypted: maskKey(raw.apiKeyEncrypted) } };
  });

  app.post("/api/settings/llm", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const config = createLlmConfig({
      enabled: Boolean(body.enabled),
      provider: String(body.provider ?? "openai-compatible"),
      baseUrl: String(body.baseUrl ?? ""),
      apiKeyEncrypted: String(body.apiKeyEncrypted ?? ""),
      model: String(body.model ?? "gpt-4o"),
      temperature: Number(body.temperature ?? 0.7),
      timeoutMs: Number(body.timeoutMs ?? 30000),
      maxTokens: body.maxTokens ? Number(body.maxTokens) : undefined,
      capabilities: (body.capabilities as LlmConfig["capabilities"]) ?? { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true },
      updatedAt: Date.now()
    });
    const existing = repository.getPost(llmConfigKey);
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
    return { ok: true, config: { ...config, apiKeyEncrypted: maskKey(config.apiKeyEncrypted) } };
  });

  app.post("/api/settings/llm/test", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${String(body.baseUrl)}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${String(body.apiKeyEncrypted)}` },
        body: JSON.stringify({ model: String(body.model), messages: [{ role: "user", content: "Hello" }], max_tokens: 5 }),
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

function accountFor(platform: PlatformId): PlatformAccount {
  return {
    id: `local-${platform}`,
    platform,
    displayName: "local-mvp",
    authType: platform === "mock" ? "mock" : "none"
  };
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return key;
  return key.slice(0, 4) + "****" + key.slice(-4);
}
