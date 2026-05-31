import type { PlatformDraft, PlatformId } from "../models.js";
import { createId, now } from "../models.js";

type LlmCallFn = (prompt: string) => Promise<string>;

const platformRecipes: Partial<Record<PlatformId, { name: string; style: string; outputFormat: string }>> = {
  wechat: {
    name: "微信公众号",
    style: "长文风格，适合深度阅读。需要有引人入胜的导语、清晰的小标题结构、克制的表达。导语约 2-3 句，正文分 3-5 个小节。标题 20 字以内。",
    outputFormat: `{"title":"","summary":"","bodyMarkdown":"# 导语\n\n...\n\n## 小标题1\n\n...","coverText":"","riskNotes":[]}`
  },
  bilibili: {
    name: "B站",
    style: "B站风格，标题直接有吸引力但不标题党。简介段落短（每段 1-2 句），包含看点列表。适合专栏区阅读。标题 30 字以内。",
    outputFormat: `{"title":"","articleTitle":"","description":"","tags":[],"partitionSuggestion":"","pinnedComment":"","riskNotes":[]}`
  },
  "zhihu-assist": {
    name: "知乎",
    style: "知乎风格，有明确的问题意识和论证结构。开头一句话点明问题，正文分论点-论据-结论。避免营销口吻，保持理性克制。标题要有问题感。",
    outputFormat: `{"title":"","bodyMarkdown":"## 问题\n\n...\n\n## 分析\n\n...","topics":[],"answerStyle":"article","riskNotes":[]}`
  },
  "xhs-assist": {
    name: "小红书",
    style: "小红书风格，短句为主（每句不超过 30 字），生活化表达。多分段，使用场景化描述。标题 20 字以内，要吸引人但不夸张。带话题标签。不要强行加 emoji。",
    outputFormat: `{"title":"","content":"第一段场景化引入\n\n第二段核心内容\n\n第三段总结互动","hashtags":[],"coverText":"","cardTexts":[],"emojiLevel":"none","riskNotes":[]}`
  },
  mock: { name: "Mock", style: "", outputFormat: "{}" }
};

export function buildPlatformGenerationPrompt(
  platform: PlatformId,
  title: string,
  body: string,
  summary: string,
  tags: string[]
): string {
  const recipe = platformRecipes[platform];
  if (!recipe || platform === "mock") return "";

  return `你是一个专业的多平台内容创作助手。请将以下原始文章改写为适合「${recipe.name}」发布的内容。

平台要求：${recipe.style}

原始标题：${title || "无"}
原始摘要：${summary || "无"}
原始标签：${tags.join(", ") || "无"}
原始正文：
---
${body}
---

请严格按以下 JSON 格式输出（不要输出任何其他文字）：

${recipe.outputFormat}`;
}

export function parsePlatformDraft(
  platform: PlatformId,
  postId: string,
  title: string,
  body: string,
  summary: string,
  tags: string[],
  llmOutput: string,
  assets?: import("../models.js").Asset[]
): PlatformDraft {
  const json = tryParse(llmOutput) ?? {};
  const timestamp = now();
  const base = {
    id: createId("draft"), postId, aiGenerated: true, userConfirmed: false,
    createdAt: timestamp, updatedAt: timestamp, assets
  };

  switch (platform) {
    case "wechat":
      return {
        ...base, platform: "wechat",
        title: String(json.title ?? title),
        body: String(json.bodyMarkdown ?? body),
        summary: String(json.summary ?? summary),
        tags: Array.isArray(json.tags) ? json.tags.map(String) : tags,
        platformMeta: { coverText: String(json.coverText ?? title.slice(0, 18)), coverPrompt: String(json.coverPrompt ?? ""), draftOnlyByDefault: true, riskNotes: asStrs(json.riskNotes), structuredSource: "llm" }
      };
    case "bilibili":
      return {
        ...base, platform: "bilibili",
        title: String(json.articleTitle ?? json.title ?? title),
        body: String(json.description ?? summary),
        summary: String(json.description ?? summary),
        tags: Array.isArray(json.tags) ? json.tags.map(String) : tags,
        platformMeta: { videoTitle: String(json.videoTitle ?? json.title ?? title), partitionSuggestion: String(json.partitionSuggestion ?? ""), timeline: asStrs((json as Record<string, unknown>).timeline), pinnedComment: String(json.pinnedComment ?? ""), riskNotes: asStrs(json.riskNotes), structuredSource: "llm" }
      };
    case "zhihu-assist":
      return {
        ...base, platform: "zhihu-assist",
        title: String(json.title ?? title),
        body: String(json.bodyMarkdown ?? body),
        summary: String(json.summary ?? summary),
        tags: Array.isArray(json.tags) ? json.tags.map(String) : tags,
        topics: (Array.isArray(json.topics) ? json.topics.map(String) : tags.slice(0, 5)),
        platformMeta: { topics: (Array.isArray(json.topics) ? json.topics.map(String) : tags.slice(0, 5)), answerStyle: String(json.answerStyle ?? "article"), riskNotes: asStrs(json.riskNotes), structuredSource: "llm" }
      };
    case "xhs-assist":
      return {
        ...base, platform: "xhs-assist",
        title: String(json.title ?? title),
        body: String(json.content ?? summary),
        summary: String(json.summary ?? summary),
        tags: Array.isArray(json.tags) ? json.tags.map(String) : tags,
        platformMeta: { hashtags: Array.isArray(json.hashtags) ? json.hashtags.map(String) : tags.map((t: string) => t.startsWith("#") ? t : `#${t}`), coverText: String(json.coverText ?? title.slice(0, 14)), cardTexts: asStrs((json as Record<string, unknown>).cardTexts), emojiLevel: String((json as Record<string, unknown>).emojiLevel ?? "none"), riskNotes: asStrs(json.riskNotes), structuredSource: "llm" }
      };
    default:
      return { ...base, platform, title, body, tags, platformMeta: { structuredSource: "llm" } };
  }
}

function tryParse(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()) as Record<string, unknown>; } catch { return null; }
}
function asStrs(v: unknown): string[] { return Array.isArray(v) ? v.map(String) : []; }
