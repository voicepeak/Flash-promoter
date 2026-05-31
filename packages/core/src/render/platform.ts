import { marked } from "marked";
import type { Asset, PlatformDraft, PlatformId } from "../models.js";
import { blocksToMarkdown, blocksToPlainText } from "./markdown.js";

export type PlatformContentFormat = "html" | "markdown" | "text";

export type RenderPlatformDraftOptions = {
  target?: "preview" | "publish";
  assetUrl?: (assetId: string, asset?: Asset) => string | undefined;
};

export type RenderedPlatformDraft = {
  platform: PlatformId;
  contentFormat: PlatformContentFormat;
  bodyMarkdown: string;
  bodyText: string;
  bodyHtml: string;
  previewHtml: string;
};

const WECHAT_BODY_STYLE = "max-width:677px;margin:0 auto;color:#2f3437;font-size:16px;line-height:1.78;";
const WECHAT_PARAGRAPH_STYLE = "margin:0 0 16px;color:#2f3437;font-size:16px;line-height:1.78;";
const GENERIC_PARAGRAPH_STYLE = "margin:0 0 12px;line-height:1.68;";

const HTML_PLATFORMS = new Set<PlatformId>(["wechat", "medium", "ghost"]);
const TEXT_PLATFORMS = new Set<PlatformId>([
  "xhs-assist",
  "bilibili",
  "douyin",
  "kuaishou",
  "instagram",
  "threads",
  "x-twitter",
  "mastodon",
  "bluesky",
  "telegram-channel",
  "discord"
]);

export function renderPlatformDraft(
  draft: PlatformDraft,
  options: RenderPlatformDraftOptions = {}
): RenderedPlatformDraft {
  const bodyMarkdown = draftBodyToMarkdown(draft);
  const bodyText = draftBodyToPlainText(draft);
  const contentFormat = contentFormatForPlatform(draft.platform);
  const bodyHtml =
    draft.platform === "wechat"
      ? renderWechatBodyHtml(draft, options)
      : contentFormat === "text"
        ? plainTextToHtml(bodyText)
        : renderMarkdownToHtml(bodyMarkdown, draft, options);

  return {
    platform: draft.platform,
    contentFormat,
    bodyMarkdown,
    bodyText,
    bodyHtml,
    previewHtml: buildPreviewHtml(draft, bodyHtml)
  };
}

export function contentFormatForPlatform(platform: PlatformId): PlatformContentFormat {
  if (HTML_PLATFORMS.has(platform)) return "html";
  if (TEXT_PLATFORMS.has(platform)) return "text";
  return "markdown";
}

export function draftBodyToMarkdown(draft: PlatformDraft): string {
  return typeof draft.body === "string" ? draft.body.trim() : blocksToMarkdown(draft.body);
}

export function draftBodyToPlainText(draft: PlatformDraft): string {
  if (typeof draft.body !== "string") {
    return blocksToPlainText(draft.body);
  }

  if (contentFormatForPlatform(draft.platform) === "text") {
    return draft.body.trim();
  }

  return markdownToPlainText(draft.body);
}

function renderWechatBodyHtml(draft: PlatformDraft, options: RenderPlatformDraftOptions): string {
  const source = draftBodyToMarkdown(draft) || draft.summary || "";
  let bodyHtml = renderMarkdownToHtml(source, draft, options);
  bodyHtml = removeDuplicateLeadingHeading(bodyHtml, draft.title);
  bodyHtml = demoteH1ToH2(bodyHtml);
  bodyHtml = applyWechatInlineStyles(bodyHtml);
  return `<section style="${WECHAT_BODY_STYLE}">${bodyHtml}</section>`;
}

function renderMarkdownToHtml(
  markdown: string,
  draft: PlatformDraft,
  options: RenderPlatformDraftOptions
): string {
  const raw = marked.parse(markdown || "", {
    async: false,
    gfm: true,
    breaks: false
  }) as string;
  return rewriteAssetImageUrls(sanitizeRenderedHtml(raw), draft, options);
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="${GENERIC_PARAGRAPH_STYLE}">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function buildPreviewHtml(draft: PlatformDraft, bodyHtml: string): string {
  if (draft.platform === "wechat") {
    const coverText = String(draft.platformMeta.coverText ?? draft.title);
    return [
      `<article class="wechat-rendered-preview" style="background:#fff;color:#2f3437;">`,
      `<div style="min-height:120px;margin:0 0 18px;padding:20px;border-radius:8px;background:#f5f7f8;display:flex;align-items:flex-end;font-size:22px;font-weight:700;line-height:1.25;">${escapeHtml(coverText)}</div>`,
      `<h1 style="margin:0 0 8px;color:#1f2328;font-size:24px;line-height:1.32;font-weight:700;">${escapeHtml(draft.title)}</h1>`,
      `<p style="margin:0 0 18px;color:#8c8c8c;font-size:13px;">flash-promoter</p>`,
      draft.summary ? `<p style="margin:0 0 18px;padding:12px 14px;background:#f7f7f7;color:#666;font-size:14px;line-height:1.65;">${escapeHtml(draft.summary)}</p>` : "",
      bodyHtml,
      `</article>`
    ].join("");
  }

  const tags = draft.tags?.length
    ? `<div class="tag-list" style="margin-top:12px;">${draft.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  return [
    `<article class="rendered-platform-preview">`,
    `<h1>${escapeHtml(draft.title)}</h1>`,
    draft.summary ? `<p class="summary">${escapeHtml(draft.summary)}</p>` : "",
    bodyHtml,
    tags,
    `</article>`
  ].join("");
}

function rewriteAssetImageUrls(
  html: string,
  draft: PlatformDraft,
  options: RenderPlatformDraftOptions
): string {
  return html.replace(/<img\b([^>]*?)\bsrc=(["'])asset:([^"']+)\2([^>]*)>/gi, (_match, before, _quote, assetId, after) => {
    const asset = draft.assets?.find((item) => item.id === assetId);
    const url = options.assetUrl?.(assetId, asset) ?? asset?.platformUrls?.[draft.platform] ?? asset?.dataUrl;
    if (!url || !isSafeAssetUrl(url)) {
      const caption = imageAltFromAttrs(`${before}${after}`) || asset?.filename || "image";
      return `<p style="${GENERIC_PARAGRAPH_STYLE}">[${escapeHtml(caption)}]</p>`;
    }
    return `<img${before}src="${escapeAttribute(url)}"${after}>`;
  });
}

function applyWechatInlineStyles(html: string): string {
  let next = html;
  next = addInlineStyle(next, "p", WECHAT_PARAGRAPH_STYLE);
  next = addInlineStyle(next, "h2", "margin:28px 0 14px;padding-left:12px;border-left:4px solid #07c160;color:#1f2328;font-size:20px;line-height:1.42;font-weight:700;");
  next = addInlineStyle(next, "h3", "margin:24px 0 12px;color:#1f2328;font-size:18px;line-height:1.45;font-weight:700;");
  next = addInlineStyle(next, "h4", "margin:20px 0 10px;color:#1f2328;font-size:16px;line-height:1.45;font-weight:700;");
  next = addInlineStyle(next, "blockquote", "margin:18px 0;padding:12px 14px;border-left:4px solid #d8dde3;background:#f7f8fa;color:#59636e;");
  next = addInlineStyle(next, "ul", "margin:0 0 16px;padding-left:22px;color:#2f3437;line-height:1.78;");
  next = addInlineStyle(next, "ol", "margin:0 0 16px;padding-left:22px;color:#2f3437;line-height:1.78;");
  next = addInlineStyle(next, "li", "margin:0 0 8px;");
  next = addInlineStyle(next, "pre", "margin:16px 0;padding:12px;overflow:auto;border-radius:6px;background:#f6f8fa;color:#24292f;font-size:13px;line-height:1.55;");
  next = addInlineStyle(next, "code", "font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;");
  next = addInlineStyle(next, "img", "display:block;max-width:100%;height:auto;margin:18px auto;border-radius:4px;");
  next = addInlineStyle(next, "hr", "height:1px;margin:28px 0;border:0;background:#e5e7eb;");
  return next;
}

function addInlineStyle(html: string, tag: string, style: string): string {
  return html.replace(new RegExp(`<${tag}(\\s[^>]*)?>`, "gi"), (_match, attrs = "") => {
    return `<${tag}${mergeStyleAttribute(String(attrs), style)}>`;
  });
}

function mergeStyleAttribute(attrs: string, style: string): string {
  const styleMatch = attrs.match(/\sstyle=(["'])(.*?)\1/i);
  if (!styleMatch) {
    return `${attrs} style="${style}"`;
  }
  const existing = styleMatch[2].trim();
  return attrs.replace(styleMatch[0], ` style="${escapeAttribute(existing ? `${style};${existing}` : style)}"`);
}

function removeDuplicateLeadingHeading(html: string, title: string): string {
  return html.replace(/^\s*<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>\s*/i, (match, heading) => {
    return normalizeText(stripHtml(heading)) === normalizeText(title) ? "" : match;
  });
}

function demoteH1ToH2(html: string): string {
  return html.replace(/<h1(\s[^>]*)?>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");
}

function sanitizeRenderedHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\s(href|src)=("|\')\s*javascript:[\s\S]*?\2/gi, "");
}

function markdownToPlainText(markdown: string): string {
  return stripHtml(marked.parse(markdown || "", { async: false, gfm: true, breaks: false }) as string)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function imageAltFromAttrs(attrs: string): string {
  const match = attrs.match(/\balt=(["'])(.*?)\1/i);
  return match ? stripHtml(match[2]) : "";
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|h4|li|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isSafeAssetUrl(value: string): boolean {
  return /^(https?:|data:image\/|\/)/i.test(value);
}
