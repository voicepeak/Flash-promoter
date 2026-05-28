import cors from "@fastify/cors";
import Fastify from "fastify";
import { z } from "zod";
import {
  adapterRegistry,
  createCanonicalPost,
  createId,
  defaultPublishMode,
  generateStructuredPlatformAdaptation,
  generatePlatformDrafts,
  type CreatePostInput,
  type PlatformAccount,
  type PlatformDraft,
  type PlatformDraftUpdate,
  type PlatformId,
  type PublishMode,
  type ValidationResult
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
  assets: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.enum(["image", "video", "cover", "attachment"]).default("image"),
        dataUrl: z.string().optional(),
        localPath: z.string().optional(),
        filename: z.string().optional(),
        mimeType: z.string().optional(),
        size: z.number().optional()
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
        createdAt: timestamp,
        updatedAt: timestamp
      }))
    };

    const post = createCanonicalPost(input);
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
    const adaptation = generateStructuredPlatformAdaptation(post);
    const drafts = await generatePlatformDrafts(post, parsed.platforms as PlatformId[], { style: parsed.style });
    repository.replacePlatformDrafts(post.id, drafts);
    return {
      drafts: drafts.map((draft) => ({
        id: draft.id,
        platform: draft.platform,
        status: "ready"
      })),
      items: drafts,
      adaptation
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
