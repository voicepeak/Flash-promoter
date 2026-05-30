import type {
  CanonicalPost,
  DryRunReport,
  PlatformAccount,
  PlatformDraft,
  PlatformId,
  PublishMode,
  PublishOptions,
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
  if (mode !== "publish" && mode !== "submit") {
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

/* ===== Safety: REAL_PUBLISH_ENABLED ===== */

let realPublishEnabled = false;
const platformSwitches: Record<string, boolean> = {};

export function setRealPublishEnabled(enabled: boolean): void {
  realPublishEnabled = enabled;
}

export function isRealPublishEnabled(): boolean {
  return realPublishEnabled;
}

export function setPlatformRealPublishEnabled(platform: PlatformId, enabled: boolean): void {
  platformSwitches[platform] = enabled;
}

export function isPlatformRealPublishEnabled(platform: PlatformId): boolean {
  if (!realPublishEnabled) return false;
  if (platformSwitches[platform] === false) return false;
  return true;
}

/* ===== Dry Run ===== */

export async function performDryRun(
  platform: PlatformId,
  account: PlatformAccount,
  mode: PublishMode,
  draft: PlatformDraft
): Promise<DryRunReport> {
  const checks = {
    accountValid: account.status === "active",
    permissionsOk: account.authType !== "none" && account.authType !== "mock",
    contentValid: draft.validation?.ok ?? true,
    assetsReady: true,
    apiCalls: [] as string[]
  };

  const errors: string[] = [];

  if (!checks.accountValid) {
    errors.push("账号状态无效");
  }

  if (!checks.permissionsOk && mode !== "simulate") {
    errors.push("缺少平台授权凭证");
  }

  if (!checks.contentValid) {
    errors.push("内容校验未通过");
  }

  if (draft.assets) {
    const missing = draft.assets.filter((a) => !a.localPath && !a.dataUrl);
    if (missing.length) {
      errors.push(`${missing.length} 个资源缺少本地路径`);
      checks.assetsReady = false;
    }
  }

  return {
    platform,
    mode,
    accountId: account.id,
    checks,
    errors,
    createdAt: now()
  };
}

/* ===== Second Confirmation ===== */

export function confirmPublishResult(platform: PlatformId, mode: PublishMode): string {
  return `你即将调用官方接口以「${mode}」模式将内容提交到「${platform}」平台。
该操作可能产生公开内容或审核任务。
请确认继续。`;
}

/* ===== Copy / Share / Assist Helpers ===== */

export function assistOpenedResult(
  platform: PlatformId,
  mode: PublishMode,
  status: PublishStatus,
  message: string,
  assistUrl?: string,
  extra?: Record<string, unknown>
): PublishResult {
  return {
    platform,
    mode,
    status,
    externalId: createId(`${platform.replace("-assist", "")}_assist`),
    url: assistUrl,
    message,
    raw: {
      simulated: true,
      realPlatformCalled: false,
      browserAssistPackage: {
        openUrl: assistUrl,
        finalPublishAction: "manual-only",
        ...extra
      }
    },
    createdAt: now()
  };
}

export function copiedResult(
  platform: PlatformId,
  message: string,
  fields: string[]
): PublishResult {
  return {
    platform,
    mode: "copy" as PublishMode,
    status: "copied",
    message,
    raw: {
      copiedFields: fields,
      realPlatformCalled: false,
      finalPublishAction: "manual-only"
    },
    createdAt: now()
  };
}

export function defaultPublishOptions(mode: PublishMode): PublishOptions {
  return {
    dryRun: mode !== "simulate",
    confirmed: mode === "publish" || mode === "submit",
    visibility: "draft"
  };
}
