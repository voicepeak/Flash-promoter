import { z } from "zod";
import type { CanonicalPost, StructuredPlatformAdaptation } from "../models.js";
import { blocksToMarkdown, blocksToPlainText, splitIntoSentences, summarizeBlocks } from "../render/markdown.js";

export const structuredPlatformAdaptationSchema = z.object({
  wechat: z.object({
    title: z.string(),
    summary: z.string(),
    bodyMarkdown: z.string(),
    coverPrompt: z.string(),
    coverText: z.string(),
    riskNotes: z.array(z.string())
  }),
  zhihu: z.object({
    title: z.string(),
    bodyMarkdown: z.string(),
    topics: z.array(z.string()),
    answerStyle: z.string(),
    riskNotes: z.array(z.string())
  }),
  bilibili: z.object({
    videoTitle: z.string(),
    articleTitle: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    partitionSuggestion: z.string(),
    timeline: z.array(z.string()),
    pinnedComment: z.string(),
    riskNotes: z.array(z.string())
  }),
  xiaohongshu: z.object({
    title: z.string(),
    content: z.string(),
    hashtags: z.array(z.string()),
    coverText: z.string(),
    cardTexts: z.array(z.string()),
    emojiLevel: z.enum(["none", "low", "medium"]),
    riskNotes: z.array(z.string())
  })
});

export function generateStructuredPlatformAdaptation(post: CanonicalPost): StructuredPlatformAdaptation {
  const markdown = blocksToMarkdown(post.body);
  const plain = blocksToPlainText(post.body);
  const summary = post.summary || summarizeBlocks(post.body, 120);
  const sentences = splitIntoSentences(plain);
  const tags = post.tags.length ? post.tags : ["内容创作"];
  const cardTexts = [post.title, ...sentences.slice(0, 5), summary].filter(Boolean).slice(0, 7);

  const adaptation: StructuredPlatformAdaptation = {
    wechat: {
      title: post.title,
      summary,
      bodyMarkdown: markdown,
      coverPrompt: `${post.title} 的公众号封面，清晰、克制、适合长文阅读`,
      coverText: post.title.slice(0, 18),
      riskNotes: ["公众号 MVP 默认生成草稿，不默认真实发布。"]
    },
    zhihu: {
      title: post.title.replace(/[！!]{2,}/g, "！"),
      bodyMarkdown: markdown,
      topics: tags.slice(0, 5),
      answerStyle: post.contentType === "qa-answer" ? "answer" : "article",
      riskNotes: ["保留事实依据，避免营销化表达。"]
    },
    bilibili: {
      videoTitle: post.title.slice(0, 80),
      articleTitle: post.title,
      description: sentences.slice(0, 5).join("\n") || summary,
      tags: tags.slice(0, 10),
      partitionSuggestion: post.contentType === "video" ? "知识 / 科学科普" : "专栏 / 科技",
      timeline: [],
      pinnedComment: "欢迎在评论区补充你的经验。",
      riskNotes: ["B站投稿存在审核流程，提交不等于发布成功。"]
    },
    xiaohongshu: {
      title: post.title.slice(0, 20),
      content: sentences.slice(0, 8).map((sentence) => sentence.replace(/[。；;]/g, "")).join("\n") || summary,
      hashtags: tags.slice(0, 8).map((tag) => `#${tag.replace(/^#/, "")}`),
      coverText: post.title.slice(0, 14),
      cardTexts,
      emojiLevel: "none",
      riskNotes: ["避免夸大、功效承诺和规避平台规则相关表达。"]
    }
  };

  return structuredPlatformAdaptationSchema.parse(adaptation);
}
