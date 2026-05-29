import type { PlatformDraft, PlatformId } from "../models.js";
import { createId, now } from "../models.js";

export type VideoAdaptationInput = {
  id: string;
  title: string;
  topic: string;
  summary?: string;
  style?: string;
  script?: string;
  transcript?: string;
  highlights?: string[];
  tags: string[];
};

const stylePartitions: Record<string, string> = {
  knowledge: "知识",
  product: "数码",
  review: "测评",
  event: "生活",
  "talking-head": "日常",
  vlog: "生活",
  tutorial: "教程",
  "project-demo": "科技"
};

export function generateVideoPlatformAdaptation(
  input: VideoAdaptationInput,
  platforms: PlatformId[]
): PlatformDraft[] {
  const drafts: PlatformDraft[] = [];
  const styleLabel = input.style ?? "知识科普";
  const highlights = input.highlights?.length
    ? input.highlights
    : input.script
      ? input.script.split(/\n/).slice(0, 5).map((s) => s.trim()).filter(Boolean)
      : [];

  for (const platform of platforms) {
    const draft = buildVideoDraft(input, platform, styleLabel, highlights);
    drafts.push(draft);
  }

  return drafts;
}

function buildVideoDraft(
  input: VideoAdaptationInput,
  platform: PlatformId,
  styleLabel: string,
  highlights: string[]
): PlatformDraft {
  const timestamp = now();
  const base: Omit<PlatformDraft, "platform" | "platformMeta" | "title" | "body" | "summary" | "tags"> = {
    id: createId("vdraft"),
    postId: input.id,
    aiGenerated: true,
    userConfirmed: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  switch (platform) {
    case "bilibili":
      return {
        ...base,
        platform: "bilibili",
        title: `【${styleLabel}】${input.title}`,
        body: buildBilibiliDescription(input, highlights),
        summary: input.summary ?? `视频主题：${input.topic}`,
        tags: [...input.tags, "B站", "视频"],
        platformMeta: {
          partitionSuggestion: stylePartitions[input.style ?? ""] ?? "生活",
          timeline: generateTimeline(highlights),
          pinnedComment: `欢迎在评论区讨论${input.topic}相关话题！`
        }
      };
    case "xhs-assist":
      return {
        ...base,
        platform: "xhs-assist",
        title: `${input.title}`,
        body: buildXhsBody(input),
        summary: input.summary ?? `${input.topic}`,
        tags: [...input.tags, "视频"],
        platformMeta: {
          hashtags: input.tags.map((t) => (t.startsWith("#") ? t : `#${t}`)),
          coverText: `${input.title}｜封面`,
          cardTexts: highlights.slice(0, 3),
          firstComment: `了解更多关于${input.topic}的内容，欢迎关注！`
        }
      };
    case "zhihu-assist":
      return {
        ...base,
        platform: "zhihu-assist",
        title: `如何评价「${input.title}」？`,
        body: buildZhihuBody(input, highlights),
        summary: input.summary ?? input.topic,
        tags: [...input.tags, "视频"],
        topics: input.tags.slice(0, 3),
        platformMeta: {
          answerIntro: `关于「${input.topic}」的一段视频说明`,
          topics: input.tags.slice(0, 5),
          assistUrl: ""
        }
      };
    case "wechat":
      return {
        ...base,
        platform: "wechat",
        title: `${input.title}｜视频介绍`,
        body: buildWechatBody(input, highlights),
        summary: input.summary ?? `视频内容简介：${input.topic}`,
        tags: [...input.tags, "视频"],
        platformMeta: {
          coverText: `${input.title}`,
          coverPrompt: `${input.topic} 视频封面`
        }
      };
    default:
      return {
        ...base,
        platform,
        title: input.title,
        body: input.summary ?? "",
        tags: input.tags,
        platformMeta: {}
      };
  }
}

function buildBilibiliDescription(
  input: VideoAdaptationInput,
  highlights: string[]
): string {
  const parts: string[] = [];
  if (input.summary) parts.push(`## 简介\n\n${input.summary}`);
  parts.push(`## 主题\n\n${input.topic}`);
  if (highlights.length) {
    parts.push(`## 主要看点\n\n${highlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}`);
  }
  if (input.transcript) parts.push(`## 字幕\n\n${input.transcript}`);
  return parts.join("\n\n");
}

function buildXhsBody(input: VideoAdaptationInput): string {
  const parts: string[] = [];
  parts.push(`${input.title}`);
  if (input.summary) parts.push(input.summary);
  if (input.script) {
    const lines = input.script.split("\n").filter(Boolean).slice(0, 5);
    parts.push(lines.join("\n"));
  }
  return parts.join("\n\n");
}

function buildZhihuBody(
  input: VideoAdaptationInput,
  highlights: string[]
): string {
  const parts: string[] = [];
  parts.push(`## 视频说明\n\n本视频主题：${input.topic}`);
  if (input.summary) parts.push(`## 内容概述\n\n${input.summary}`);
  if (highlights.length) {
    parts.push(`## 关键要点\n\n${highlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

function buildWechatBody(
  input: VideoAdaptationInput,
  highlights: string[]
): string {
  const parts: string[] = [];
  parts.push(`# ${input.title}`);
  if (input.summary) parts.push(`## 简介\n\n${input.summary}`);
  parts.push(`## 视频主题\n\n${input.topic}`);
  if (highlights.length) {
    parts.push(`## 主要看点\n\n${highlights.map((h, i) => `${i + 1}. ${h}`).join("\n")}`);
  }
  if (input.script) parts.push(`## 视频脚本\n\n${input.script}`);
  return parts.join("\n\n");
}

function generateTimeline(highlights: string[]): string[] {
  if (!highlights.length) return ["00:00 - 开始"];
  return highlights.map((h, i) => {
    const min = String(Math.floor(i * 1.5)).padStart(2, "0");
    const sec = String((i * 30) % 60).padStart(2, "0");
    return `${min}:${sec} - ${h.slice(0, 30)}`;
  });
}
