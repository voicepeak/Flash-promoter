import type { Asset, Block, PlatformDraft, ValidationIssue, ValidationResult } from "../models.js";
import { blocksToPlainText } from "../render/markdown.js";

const highRiskWords = ["稳赚", "绝对有效", "包过", "治愈", "一夜暴富", "规避审核"];
const supportedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const supportedVideoMimeTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);

export function validateCommonDraft(draft: PlatformDraft): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const bodyText = typeof draft.body === "string" ? draft.body : blocksToPlainText(draft.body);

  if (!draft.title.trim()) {
    errors.push({ code: "title_empty", field: "title", message: "标题不能为空" });
  }

  if (!bodyText.trim()) {
    errors.push({ code: "body_empty", field: "body", message: "正文不能为空" });
  }

  if (/https?:\/\//i.test(bodyText)) {
    warnings.push({ code: "external_link", field: "body", message: "正文包含外链，发布前需人工确认" });
  }

  if (bodyText.split(/\n/).some((line) => line.trim() === "" && line.length > 2)) {
    warnings.push({ code: "empty_paragraph", field: "body", message: "存在明显空段落" });
  }

  for (const word of highRiskWords) {
    if (bodyText.includes(word) || draft.title.includes(word)) {
      warnings.push({ code: "high_risk_word", field: "body", message: `包含高风险表达：${word}` });
    }
  }

  if (draft.aiGenerated && !draft.userConfirmed) {
    warnings.push({ code: "ai_unconfirmed", message: "平台版本为自动生成内容，发布前需要用户确认" });
  }

  validateAssets(draft, errors, warnings);

  return {
    ok: errors.length === 0,
    warnings,
    errors
  };
}

function validateAssets(draft: PlatformDraft, errors: ValidationIssue[], warnings: ValidationIssue[]): void {
  const assets = draft.assets ?? [];
  const referencedAssetIds = collectReferencedAssetIds(draft.body);
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  for (const assetId of referencedAssetIds) {
    const asset = assetById.get(assetId);
    if (!asset) {
      errors.push({ code: "asset_not_found", field: "assets", message: `正文引用的图片资源不存在：${assetId}` });
      continue;
    }
    if (!asset.localPath && !asset.dataUrl) {
      errors.push({ code: "asset_missing_source", field: "assets", message: `资源缺少本地路径或数据：${assetId}` });
    }
  }

  for (const asset of assets) {
    if ((asset.type === "image" || asset.type === "cover") && asset.mimeType && !supportedImageMimeTypes.has(asset.mimeType)) {
      errors.push({ code: "unsupported_image_format", field: "assets", message: `不支持的图片格式：${asset.filename ?? asset.id}` });
    }

    if (asset.type === "video" && asset.mimeType && !supportedVideoMimeTypes.has(asset.mimeType)) {
      errors.push({ code: "unsupported_video_format", field: "assets", message: `不支持的视频格式：${asset.filename ?? asset.id}` });
    }

    if (asset.size && asset.size > 20 * 1024 * 1024 && asset.type !== "video") {
      warnings.push({ code: "large_image_asset", field: "assets", message: `图片文件较大，发布前建议压缩：${asset.filename ?? asset.id}` });
    }
  }

  if (draft.platform === "xhs-assist") {
    const cardTexts = draft.platformMeta.cardTexts;
    if (!Array.isArray(cardTexts) || cardTexts.length === 0) {
      errors.push({ code: "xhs_cards_missing", field: "platformMeta.cardTexts", message: "小红书需要生成图文卡片文案" });
    }
  }
}

function collectReferencedAssetIds(body: PlatformDraft["body"]): string[] {
  if (typeof body === "string") {
    const matches = body.matchAll(/asset:([A-Za-z0-9_-]+)/g);
    return Array.from(new Set(Array.from(matches, (match) => match[1])));
  }

  return Array.from(new Set(body.flatMap((block: Block) => (block.type === "image" ? [block.assetId] : []))));
}

export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  const errors = results.flatMap((result) => result.errors);
  const warnings = results.flatMap((result) => result.warnings);
  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
