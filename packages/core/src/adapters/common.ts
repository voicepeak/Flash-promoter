import type {
  CanonicalPost,
  PlatformAccount,
  PlatformDraft,
  PlatformId,
  PublishMode,
  PublishResult,
  PublishStatus
} from "../models.js";
import { createId, now } from "../models.js";
import { blocksToMarkdown, blocksToPlainText, splitIntoSentences, summarizeBlocks } from "../render/markdown.js";
import { validateCommonDraft } from "../validation/common.js";

export function createDraftBase(
  platform: PlatformId,
  post: CanonicalPost,
  title: string,
  body: string,
  platformMeta: Record<string, unknown> = {}
): PlatformDraft {
  const timestamp = now();
  return {
    id: createId("draft"),
    platform,
    postId: post.id,
    title: title.trim() || post.title,
    body,
    summary: post.summary || summarizeBlocks(post.body),
    tags: post.tags,
    assets: post.assets,
    platformMeta,
    aiGenerated: true,
    userConfirmed: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function originalMarkdown(post: CanonicalPost): string {
  return blocksToMarkdown(post.body);
}

export function originalPlainText(post: CanonicalPost): string {
  return blocksToPlainText(post.body);
}

export function selectTags(post: CanonicalPost, fallback: string[], max = 8): string[] {
  return Array.from(new Set([...(post.tags ?? []), ...fallback]))
    .map((tag) => tag.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

export function firstSentences(post: CanonicalPost, max = 4): string[] {
  return splitIntoSentences(originalPlainText(post)).slice(0, max);
}

export async function validateWithLimits(
  draft: PlatformDraft,
  limits: {
    titleMax?: number;
    bodyMin?: number;
    tagMax?: number;
    requiredMeta?: string[];
  }
) {
  const result = validateCommonDraft(draft);
  const bodyText = typeof draft.body === "string" ? draft.body : blocksToPlainText(draft.body);

  if (limits.titleMax && draft.title.length > limits.titleMax) {
    result.warnings.push({
      code: "title_too_long",
      field: "title",
      message: `标题长度超过建议上限 ${limits.titleMax} 字`
    });
  }

  if (limits.bodyMin && bodyText.length < limits.bodyMin) {
    result.warnings.push({
      code: "body_too_short",
      field: "body",
      message: `正文短于建议下限 ${limits.bodyMin} 字`
    });
  }

  if (limits.tagMax && (draft.tags?.length ?? 0) > limits.tagMax) {
    result.warnings.push({
      code: "too_many_tags",
      field: "tags",
      message: `标签数量超过建议上限 ${limits.tagMax} 个`
    });
  }

  for (const meta of limits.requiredMeta ?? []) {
    if (!draft.platformMeta[meta]) {
      result.warnings.push({
        code: "platform_meta_missing",
        field: meta,
        message: `缺少平台参数：${meta}`
      });
    }
  }

  return result;
}

export function simulatedResult(platform: PlatformId, mode: PublishMode, status: PublishStatus, message: string): PublishResult {
  return {
    platform,
    mode,
    status,
    externalId: createId(`${platform.replace("-assist", "")}_external`),
    message,
    raw: { simulated: true, realPlatformCalled: false },
    createdAt: now()
  };
}

export function enforceNoDirectPublish(
  platform: PlatformId,
  account: PlatformAccount,
  mode: PublishMode
): PublishResult | null {
  if (mode !== "publish") {
    return null;
  }

  return {
    platform,
    mode,
    status: "failed",
    errorCode: "publish_disabled_in_mvp",
    errorMessage: "MVP 阶段未启用真实发布；真实发布必须在二次确认后单独接入官方能力。",
    raw: {
      accountId: account.id,
      realPlatformCalled: false,
      requiresSecondConfirmation: true
    },
    createdAt: now()
  };
}
