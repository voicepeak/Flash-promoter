import { marked } from "marked";
import type { Tokens } from "marked";
import type { Asset, Block, CanonicalPost, CreatePostInput } from "../models.js";
import { createId, now } from "../models.js";
import { summarizeBlocks } from "../render/markdown.js";

export function createCanonicalPost(input: CreatePostInput): CanonicalPost {
  const timestamp = now();
  const id = createId("post");
  const assets = (input.assets ?? []).map((asset) => ({
    ...asset,
    postId: id,
    createdAt: asset.createdAt || timestamp,
    updatedAt: asset.updatedAt || timestamp
  }));
  const normalized = normalizeInputToMarkdown(input.body, input.inputFormat, assets);
  const body = markdownToBlocks(normalized, assets);
  const summary = input.summary?.trim() || summarizeBlocks(body);

  return {
    id,
    title: input.title.trim(),
    summary,
    body,
    assets,
    tags: input.tags ?? [],
    contentType: input.contentType ?? "article",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function normalizeInputToMarkdown(
  source: string,
  inputFormat: CreatePostInput["inputFormat"],
  assets: Asset[] = []
): string {
  if (inputFormat === "markdown") {
    return source.trim();
  }

  if (inputFormat === "text") {
    return source
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  return htmlToMarkdown(source, assets);
}

function htmlToMarkdown(html: string, assets: Asset[]): string {
  let next = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<img[^>]*src=[\"']([^\"']+)[\"'][^>]*alt=[\"']([^\"']*)[\"'][^>]*>/gi, (_match, src, alt) =>
      imageTagToMarkdown(src, alt, assets)
    )
    .replace(/<img[^>]*alt=[\"']([^\"']*)[\"'][^>]*src=[\"']([^\"']+)[\"'][^>]*>/gi, (_match, alt, src) =>
      imageTagToMarkdown(src, alt, assets)
    )
    .replace(/<img[^>]*src=[\"']([^\"']+)[\"'][^>]*>/gi, (_match, src) => imageTagToMarkdown(src, "", assets))
    .replace(/<[^>]+>/g, "");

  next = decodeHtmlEntities(next);
  return next
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
}

function imageTagToMarkdown(src: string, alt: string, assets: Asset[]): string {
  const existing = assets.find((asset) => asset.dataUrl === src || asset.localPath === src);
  const assetId = existing?.id ?? createId("asset");
  if (!existing) {
    assets.push({
      id: assetId,
      type: "image",
      dataUrl: src.startsWith("data:") ? src : undefined,
      localPath: src.startsWith("data:") ? undefined : src,
      filename: alt || "pasted-image",
      createdAt: now(),
      updatedAt: now()
    });
  }
  return `\n![${alt ?? ""}](asset:${assetId})\n`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

export function markdownToBlocks(markdown: string, assets: Asset[] = []): Block[] {
  const lexerTokens = marked.lexer(markdown);
  const blocks: Block[] = [];

  for (const token of lexerTokens) {
    const block = tokenToBlock(token, assets);
    if (block) {
      blocks.push(block);
    }
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: markdown.trim() }];
}

function tokenToBlock(token: Tokens.Generic, assets: Asset[]): Block | null {
  switch (token.type) {
    case "heading":
      return {
        type: "heading",
        level: Math.min((token as Tokens.Heading).depth, 4) as 1 | 2 | 3 | 4,
        text: cleanInline((token as Tokens.Heading).text)
      };
    case "paragraph": {
      const paragraph = token as Tokens.Paragraph;
      const image = paragraph.tokens?.find((inline) => inline.type === "image") as Tokens.Image | undefined;
      if (image && paragraph.tokens?.length === 1) {
        const assetId = image.href.startsWith("asset:") ? image.href.slice(6) : createExternalImageAsset(image, assets);
        return { type: "image", assetId, caption: image.text };
      }
      return { type: "paragraph", text: cleanInline(paragraph.text) };
    }
    case "blockquote": {
      const quote = token as Tokens.Blockquote;
      const text = quote.tokens.map((child) => blockTokenToText(child)).filter(Boolean).join("\n");
      return { type: "quote", text };
    }
    case "code": {
      const code = token as Tokens.Code;
      return { type: "code", language: code.lang || undefined, code: code.text };
    }
    case "list": {
      const list = token as Tokens.List;
      return {
        type: "list",
        ordered: list.ordered,
        items: list.items.map((item) => cleanInline(item.text))
      };
    }
    case "hr":
      return { type: "divider" };
    case "space":
      return null;
    default:
      return token.raw?.trim() ? { type: "paragraph", text: cleanInline(token.raw) } : null;
  }
}

function blockTokenToText(token: Tokens.Generic): string {
  if ("text" in token && typeof token.text === "string") {
    return cleanInline(token.text);
  }
  if ("raw" in token && typeof token.raw === "string") {
    return cleanInline(token.raw);
  }
  return "";
}

function createExternalImageAsset(image: Tokens.Image, assets: Asset[]): string {
  const assetId = createId("asset");
  assets.push({
    id: assetId,
    type: "image",
    localPath: image.href,
    filename: image.text || "remote-image",
    createdAt: now(),
    updatedAt: now()
  });
  return assetId;
}

function cleanInline(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
