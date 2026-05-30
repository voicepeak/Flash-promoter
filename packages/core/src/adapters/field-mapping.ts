/* ===== Field Mapping Engine ===== */

import type { FieldMapping, FieldMappingSlot, PlatformDraft, PlatformId } from "../models.js";

const platformFieldMappings: Record<string, FieldMapping> = {
  "bilibili-video": {
    packageType: "bilibili-video",
    platform: "bilibili",
    slots: [
      { slotKey: "title", platformField: "title", required: true, maxLength: 80 },
      { slotKey: "description", platformField: "desc", required: true },
      { slotKey: "tags", platformField: "tag", required: true },
      { slotKey: "partitionSuggestion", platformField: "tid", required: true },
      { slotKey: "cover", platformField: "cover", required: true }
    ]
  },
  "wechat-article": {
    packageType: "wechat-article",
    platform: "wechat",
    slots: [
      { slotKey: "title", platformField: "title", required: true, maxLength: 64 },
      { slotKey: "bodyMarkdown", platformField: "content", required: true },
      { slotKey: "summary", platformField: "digest", required: false, maxLength: 120 },
      { slotKey: "coverText", platformField: "cover_text", required: false },
      { slotKey: "tags", platformField: "tags", required: false, maxLength: 8 }
    ]
  },
  "wordpress-post": {
    packageType: "wordpress-post",
    platform: "wordpress",
    slots: [
      { slotKey: "title", platformField: "title", required: true },
      { slotKey: "body", platformField: "content", required: true },
      { slotKey: "summary", platformField: "excerpt", required: false, maxLength: 300 },
      { slotKey: "tags", platformField: "tags", required: false },
      { slotKey: "categories", platformField: "categories", required: false }
    ]
  },
  "xhs-note": {
    packageType: "xhs-note",
    platform: "xhs-assist",
    slots: [
      { slotKey: "title", platformField: "title", required: true, maxLength: 20 },
      { slotKey: "content", platformField: "content", required: true },
      { slotKey: "hashtags", platformField: "hashtags", required: true },
      { slotKey: "coverText", platformField: "cover_text", required: true },
      { slotKey: "cardTexts", platformField: "card_texts", required: true }
    ]
  },
  "zhihu-article": {
    packageType: "zhihu-article",
    platform: "zhihu-assist",
    slots: [
      { slotKey: "title", platformField: "title", required: true, maxLength: 100 },
      { slotKey: "bodyMarkdown", platformField: "content", required: true },
      { slotKey: "topics", platformField: "topics", required: true },
      { slotKey: "tags", platformField: "tags", required: false }
    ]
  },
  "youtube-video": {
    packageType: "youtube-video",
    platform: "youtube",
    slots: [
      { slotKey: "title", platformField: "snippet.title", required: true, maxLength: 100 },
      { slotKey: "description", platformField: "snippet.description", required: false, maxLength: 5000 },
      { slotKey: "tags", platformField: "snippet.tags", required: false },
      { slotKey: "visibility", platformField: "status.privacyStatus", required: false }
    ]
  },
  "twitter-post": {
    packageType: "twitter-post",
    platform: "x-twitter",
    slots: [
      { slotKey: "text", platformField: "text", required: true, maxLength: 280 },
      { slotKey: "tags", platformField: "tags", required: false }
    ]
  },
  "douyin-video": {
    packageType: "douyin-video",
    platform: "douyin",
    slots: [
      { slotKey: "title", platformField: "title", required: true, maxLength: 55 },
      { slotKey: "description", platformField: "description", required: false },
      { slotKey: "tags", platformField: "tags", required: false }
    ]
  },
  "instagram-container": {
    packageType: "instagram-container",
    platform: "instagram",
    slots: [
      { slotKey: "title", platformField: "caption", required: false, maxLength: 2200 },
      { slotKey: "tags", platformField: "hashtags", required: false }
    ]
  },
  "linkedin-post": {
    packageType: "linkedin-post",
    platform: "linkedin",
    slots: [
      { slotKey: "title", platformField: "commentary", required: true, maxLength: 3000 },
      { slotKey: "body", platformField: "content", required: false },
      { slotKey: "tags", platformField: "hashtags", required: false }
    ]
  },
  "facebook-post": {
    packageType: "facebook-post",
    platform: "facebook-pages",
    slots: [
      { slotKey: "title", platformField: "message", required: true },
      { slotKey: "body", platformField: "description", required: false },
      { slotKey: "tags", platformField: "tags", required: false }
    ]
  },
  "medium-article": {
    packageType: "medium-article",
    platform: "medium",
    slots: [
      { slotKey: "title", platformField: "title", required: true },
      { slotKey: "body", platformField: "content", required: true },
      { slotKey: "tags", platformField: "tags", required: false }
    ]
  },
  "mastodon-status": {
    packageType: "mastodon-status",
    platform: "mastodon",
    slots: [
      { slotKey: "title", platformField: "status", required: true, maxLength: 500 },
      { slotKey: "tags", platformField: "hashtags", required: false }
    ]
  },
  "reddit-post": {
    packageType: "reddit-post",
    platform: "reddit",
    slots: [
      { slotKey: "title", platformField: "title", required: true, maxLength: 300 },
      { slotKey: "body", platformField: "text", required: false }
    ]
  },
  "telegram-message": {
    packageType: "telegram-message",
    platform: "telegram-channel",
    slots: [
      { slotKey: "title", platformField: "text", required: true, maxLength: 4096 }
    ]
  },
  "discord-message": {
    packageType: "discord-message",
    platform: "discord",
    slots: [
      { slotKey: "title", platformField: "content", required: true, maxLength: 2000 }
    ]
  },
  "ghost-post": {
    packageType: "ghost-post",
    platform: "ghost",
    slots: [
      { slotKey: "title", platformField: "title", required: true },
      { slotKey: "body", platformField: "html", required: false },
      { slotKey: "tags", platformField: "tags", required: false },
      { slotKey: "summary", platformField: "excerpt", required: false, maxLength: 300 }
    ]
  },
  "notion-page": {
    packageType: "notion-page",
    platform: "notion",
    slots: [
      { slotKey: "title", platformField: "title", required: true },
      { slotKey: "body", platformField: "children", required: false },
      { slotKey: "tags", platformField: "tags", required: false }
    ]
  }
};

export function getFieldMapping(packageType: string, platform: PlatformId): FieldMapping | null {
  const key = `${packageType}`;
  const direct = platformFieldMappings[key];
  if (direct && direct.platform === platform) return direct;

  return platformFieldMappings[`${platform}-article`] ?? platformFieldMappings[`${platform}-video`] ?? null;
}

export function getAllFieldMappings(): FieldMapping[] {
  return Object.values(platformFieldMappings);
}

export function applyFieldMapping(
  draft: PlatformDraft,
  mapping: FieldMapping
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  for (const slot of mapping.slots) {
    let value: string | string[] | undefined;

    switch (slot.slotKey) {
      case "title":
        value = draft.title;
        break;
      case "description":
      case "body":
      case "bodyMarkdown":
      case "content":
        value = typeof draft.body === "string" ? draft.body : "";
        break;
      case "summary":
        value = draft.summary ?? "";
        break;
      case "tags":
        value = draft.tags ?? [];
        break;
      case "topics":
      case "categories":
        value = (draft.platformMeta[slot.slotKey] as string[]) ?? draft.tags ?? [];
        break;
      case "hashtags":
      case "cardTexts":
        value = (draft.platformMeta[slot.slotKey] as string[]) ?? [];
        break;
      case "partitionSuggestion":
        value = String(draft.platformMeta.partitionSuggestion ?? "");
        break;
      case "cover":
      case "coverText":
        value = String(draft.platformMeta.coverText ?? "");
        break;
      case "visibility":
        value = String(draft.platformMeta.visibility ?? "draft");
        break;
      case "text":
        value = draft.title;
        break;
      default:
        value = String(draft.platformMeta[slot.slotKey] ?? "");
    }

    if (slot.maxLength && typeof value === "string" && value.length > slot.maxLength) {
      value = value.slice(0, slot.maxLength);
    }

    if (slot.required && (!value || (Array.isArray(value) && value.length === 0) || (typeof value === "string" && !value.trim()))) {
      throw new Error(`必填字段 ${slot.platformField} (${slot.slotKey}) 缺失`);
    }

    result[slot.platformField] = value;
  }

  return result;
}

export function validateFieldMapping(
  draft: PlatformDraft,
  mapping: FieldMapping
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const slot of mapping.slots) {
    if (!slot.required) continue;

    let hasValue = false;
    switch (slot.slotKey) {
      case "title":
        hasValue = !!draft.title?.trim();
        break;
      case "body":
      case "bodyMarkdown":
      case "content":
        hasValue = typeof draft.body === "string" ? !!draft.body.trim() : draft.body.length > 0;
        break;
      case "tags":
        hasValue = (draft.tags?.length ?? 0) > 0;
        break;
      case "hashtags":
      case "cardTexts":
      case "topics":
      case "categories":
        hasValue = ((draft.platformMeta[slot.slotKey] as string[] | undefined)?.length ?? 0) > 0;
        break;
      default:
        hasValue = true;
    }

    if (!hasValue) {
      errors.push(`必填字段 ${slot.platformField} (${slot.slotKey}) 缺失`);
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
