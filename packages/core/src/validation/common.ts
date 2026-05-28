import type { PlatformDraft, ValidationIssue, ValidationResult } from "../models.js";
import { blocksToPlainText } from "../render/markdown.js";

const highRiskWords = ["稳赚", "绝对有效", "包过", "治愈", "一夜暴富", "规避审核"];

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

  return {
    ok: errors.length === 0,
    warnings,
    errors
  };
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
