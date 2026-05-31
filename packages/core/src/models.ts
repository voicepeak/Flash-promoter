/* ===== Content Types ===== */

export type ContentType =
  | "article"
  | "video"
  | "image-note"
  | "qa-answer"
  | "short-text"
  | "long-form"
  | "carousel"
  | "link-post";

/* ===== Block Model ===== */

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "image"; assetId: string; caption?: string }
  | { type: "quote"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "divider" };

/* ===== Asset ===== */

export type AssetType =
  | "image"
  | "video"
  | "cover"
  | "thumbnail"
  | "audio"
  | "subtitle"
  | "document"
  | "attachment";

export type Asset = {
  id: string;
  postId?: string;
  type: AssetType;
  localPath?: string;
  dataUrl?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  hash?: string;
  platformUrls?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
};

/* ===== CanonicalPost ===== */

export type CanonicalPost = {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  body: Block[];
  assets: Asset[];
  tags: string[];
  topics?: string[];
  authorNote?: string;
  sourceUrl?: string;
  contentType: ContentType;
  createdAt: number;
  updatedAt: number;
};

/* ===== Platform IDs ===== */

export type PlatformId =
  // P0
  | "mock"
  | "wechat"
  | "bilibili"
  | "zhihu-assist"
  | "xhs-assist"
  // P1
  | "douyin"
  | "kuaishou"
  | "youtube"
  | "instagram"
  | "threads"
  | "facebook-pages"
  | "x-twitter"
  | "linkedin"
  // P2
  | "pinterest"
  | "reddit"
  | "medium"
  | "mastodon"
  | "bluesky"
  | "telegram-channel"
  | "discord"
  | "ghost"
  // P3
  | "toutiao"
  | "baijiahao"
  | "csdn"
  | "juejin"
  | "jianshu"
  | "douban"
  | "notion";

/* ===== PlatformManifest ===== */

export type PlatformRegion = "cn" | "global";

export type PublishLevel =
  | "simulate"
  | "copy"
  | "share"
  | "assist"
  | "draft"
  | "container"
  | "submit"
  | "publish"
  | "status"
  | "metrics";

export type AuthManifest = {
  type: AuthType;
  requiredScopes: string[];
  setupUrl?: string;
  note?: string;
};

export type AssetManifest = {
  supportedImageFormats: string[];
  supportedVideoFormats: string[];
  maxImageSizeBytes: number;
  maxVideoSizeBytes: number;
  maxVideoDurationSec: number;
  maxCoverCount: number;
  supportedContentTypes: ContentType[];
};

export type PlatformLimits = {
  titleMaxLength: number;
  bodyMaxLength: number;
  tagMaxCount: number;
  imagesMaxCount: number;
  videosMaxCount: number;
  summaryMaxLength?: number;
};

export type RiskLevel = "low" | "medium" | "high";

export type PlatformManifest = {
  id: PlatformId;
  name: string;
  region: PlatformRegion;
  homepage: string;
  docs?: string[];
  supportedContentTypes: ContentType[];
  supportedPackageTypes: string[];
  publishLevels: PublishLevel[];
  auth: AuthManifest;
  assets: AssetManifest;
  limits: PlatformLimits;
  riskLevel: RiskLevel;
  defaultMode: PublishMode;
  featureFlags: Record<string, boolean>;
};

/* ===== Auth ===== */

export type AuthType =
  | "none"
  | "oauth2"
  | "oauth1"
  | "api-key"
  | "app-secret"
  | "bot-token"
  | "webhook"
  | "manual"
  | "browser-assist"
  | "mock";

export type PlatformAccount = {
  id: string;
  platform: PlatformId;
  displayName: string;
  authType: AuthType;
  encryptedCredentials: string;
  scopes: string[];
  expiresAt?: number;
  status: "active" | "expired" | "invalid" | "disabled";
  createdAt: number;
  updatedAt: number;
};

/* ===== Publish Mode ===== */

export type PublishMode =
  | "simulate"
  | "copy"
  | "share"
  | "assist"
  | "draft"
  | "submit"
  | "publish";

export const defaultPublishMode: Record<string, PublishMode> = {
  mock: "simulate",
  wechat: "draft",
  bilibili: "simulate",
  "zhihu-assist": "assist",
  "xhs-assist": "assist",
  douyin: "simulate",
  kuaishou: "simulate",
  youtube: "draft",
  instagram: "draft",
  threads: "submit",
  "facebook-pages": "submit",
  "x-twitter": "submit",
  linkedin: "submit",
  pinterest: "submit",
  reddit: "submit",
  medium: "draft",
  mastodon: "submit",
  bluesky: "submit",
  "telegram-channel": "submit",
  discord: "submit",
  ghost: "draft",
  toutiao: "assist",
  baijiahao: "assist",
  csdn: "assist",
  juejin: "assist",
  jianshu: "assist",
  douban: "assist",
  notion: "draft"
};

/* ===== Publish Status ===== */

export type PublishStatus =
  | "pending"
  | "validating"
  | "asset_preparing"
  | "ready"
  | "simulated"
  | "copied"
  | "share_opened"
  | "assist_opened"
  | "draft_created"
  | "submitted"
  | "reviewing"
  | "published"
  | "failed"
  | "cancelled";

export type PublishJobStatus = PublishStatus;

/* ===== Validation ===== */

export type ValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export type ValidationResult = {
  ok: boolean;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
};

/* ===== Field Mapping ===== */

export type FieldMappingSlot = {
  slotKey: string;
  platformField: string;
  required: boolean;
  transform?: string;
  maxLength?: number;
};

export type FieldMapping = {
  packageType: string;
  platform: PlatformId;
  slots: FieldMappingSlot[];
};

/* ===== Prepared Assets ===== */

export type PreparedAsset = {
  localAssetId: string;
  platformAssetId?: string;
  platformUrl?: string;
  usage: "cover" | "body" | "video" | "thumbnail" | "attachment";
  status: "prepared" | "uploaded" | "failed";
};

export type PreparedAssets = {
  platform: PlatformId;
  assets: PreparedAsset[];
};

/* ===== Platform Draft ===== */

export type PlatformDraft = {
  id: string;
  platform: PlatformId;
  postId: string;
  title: string;
  body: string | Block[];
  summary?: string;
  tags?: string[];
  topics?: string[];
  assets?: Asset[];
  platformMeta: Record<string, unknown>;
  aiGenerated: boolean;
  userConfirmed: boolean;
  validation?: ValidationResult;
  createdAt: number;
  updatedAt: number;
};

export type PlatformDraftUpdate = {
  title?: string;
  body?: string | Block[];
  summary?: string;
  tags?: string[];
  topics?: string[];
  platformMeta?: Record<string, unknown>;
  userConfirmed?: boolean;
};

/* ===== Publish Result Types ===== */

export type PublishResult = {
  platform: PlatformId;
  mode: PublishMode;
  status: PublishStatus;
  externalId?: string;
  url?: string;
  draftId?: string;
  reviewStatus?: string;
  message?: string;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
  createdAt: number;
};

export type PlatformDraftResult = {
  draftId: string;
  platform: PlatformId;
  mediaId?: string;
  externalId: string;
  url?: string;
};

export type PlatformSubmitResult = {
  submitId: string;
  platform: PlatformId;
  status: PublishStatus;
  externalId?: string;
  reviewStatus?: string;
  message: string;
};

export type PlatformPublishResult = {
  platform: PlatformId;
  status: PublishStatus;
  externalId?: string;
  url?: string;
  message: string;
};

export type PlatformStatusResult = {
  platform: PlatformId;
  externalId: string;
  status: PublishStatus;
  reviewStatus?: string;
  url?: string;
  raw?: unknown;
};

export type PlatformMetricsResult = {
  platform: PlatformId;
  externalId: string;
  metrics: Record<string, number>;
  raw?: unknown;
};

/* ===== Submit / Publish Options ===== */

export type SubmitOptions = {
  dryRun: boolean;
  confirmed: boolean;
  scheduleAt?: number;
  metadata?: Record<string, unknown>;
};

export type PublishOptions = {
  dryRun: boolean;
  confirmed: boolean;
  scheduleAt?: number;
  visibility?: "public" | "private" | "unlisted" | "draft";
};

/* ===== Transform Options ===== */

export type TransformOptions = {
  style?: "balanced";
  mode?: PublishMode;
};

/* ===== Publish Job ===== */

export type PublishJob = {
  id: string;
  postId: string;
  draftId: string;
  packageId?: string;
  platform: PlatformId;
  accountId?: string;
  mode: PublishMode;
  level: PublishLevel;
  status: PublishStatus;
  externalId?: string;
  externalUrl?: string;
  reviewStatus?: string;
  result?: PublishResult;
  errorCode?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
};

/* ===== Publish Log ===== */

export type PublishLog = {
  id: string;
  jobId: string;
  platform: PlatformId;
  level: "info" | "warn" | "error";
  message: string;
  raw?: unknown;
  createdAt: number;
};

/* ===== Structured Platform Adaptation ===== */

export type StructuredPlatformAdaptation = {
  wechat: {
    title: string;
    summary: string;
    bodyMarkdown: string;
    coverPrompt: string;
    coverText: string;
    riskNotes: string[];
  };
  zhihu: {
    title: string;
    bodyMarkdown: string;
    topics: string[];
    answerStyle: string;
    riskNotes: string[];
  };
  bilibili: {
    videoTitle: string;
    articleTitle: string;
    description: string;
    tags: string[];
    partitionSuggestion: string;
    timeline: string[];
    pinnedComment: string;
    riskNotes: string[];
  };
  xiaohongshu: {
    title: string;
    content: string;
    hashtags: string[];
    coverText: string;
    cardTexts: string[];
    emojiLevel: "none" | "low" | "medium";
    riskNotes: string[];
  };
};

/* ===== PlatformRecipe (PRD Section 9.1) ===== */

export type PlatformRecipe = {
  platform: PlatformId;
  packageType: string;
  transformRules: TransformRule[];
  fieldMapping: FieldMapping;
  assetConstraints: AssetConstraint[];
  publishStrategy: PublishStrategy;
};

export type TransformRule = {
  sourceField: string;
  targetField: string;
  transform: "copy" | "truncate" | "summarize" | "split-cards" | "format-markdown" | "strip-html" | "prefix" | "suffix";
  params?: Record<string, unknown>;
};

export type AssetConstraint = {
  type: AssetType;
  maxCount: number;
  maxSize: number;
  formats: string[];
  required: boolean;
};

export type PublishStrategy = {
  preferredMode: PublishMode;
  fallbackMode: PublishMode;
  requiresAccount: boolean;
  requiresAssetUpload: boolean;
  canSchedule: boolean;
};

/* ===== PlatformContentPackage (PRD Section 9.1) ===== */

export type PlatformContentPackage = {
  id: string;
  postId: string;
  platform: PlatformId;
  packageType: string;
  title: string;
  body: string | Block[];
  summary?: string;
  tags: string[];
  topics?: string[];
  assets: Asset[];
  platformMeta: Record<string, unknown>;
  mappedFields?: Record<string, string | string[]>;
  recipeId?: string;
  status: "draft" | "ready" | "validating" | "prepared" | "published" | "failed";
  createdAt: number;
  updatedAt: number;
};

/* ===== Safety Configuration ===== */

export type SafetyConfig = {
  realPublishEnabled: boolean;
  platformSwitches: Record<string, boolean>;
  requireSecondConfirmation: boolean;
  dryRunByDefault: boolean;
};

export type DryRunReport = {
  platform: PlatformId;
  mode: PublishMode;
  accountId: string;
  checks: {
    accountValid: boolean;
    permissionsOk: boolean;
    contentValid: boolean;
    assetsReady: boolean;
    apiCalls: string[];
  };
  errors: string[];
  createdAt: number;
};

/* ===== Create Post Input ===== */

export type CreatePostInput = {
  title: string;
  body: string;
  summary?: string;
  tags?: string[];
  inputFormat: "markdown" | "html" | "text";
  contentType?: ContentType;
  assets?: Asset[];
};

/* ===== Platform Labels ===== */

export const platformLabels: Record<PlatformId, string> = {
  mock: "Mock",
  wechat: "微信公众号",
  bilibili: "B站",
  "zhihu-assist": "知乎",
  "xhs-assist": "小红书",
  douyin: "抖音",
  kuaishou: "快手",
  youtube: "YouTube",
  instagram: "Instagram",
  threads: "Threads",
  "facebook-pages": "Facebook Pages",
  "x-twitter": "X/Twitter",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  reddit: "Reddit",
  medium: "Medium",
  mastodon: "Mastodon",
  bluesky: "Bluesky",
  "telegram-channel": "Telegram Channel",
  discord: "Discord",
  ghost: "Ghost",
  toutiao: "今日头条",
  baijiahao: "百家号",
  csdn: "CSDN",
  juejin: "掘金",
  jianshu: "简书",
  douban: "豆瓣",
  notion: "Notion"
};

/* ===== Platform Regions ===== */

export const platformRegions: Record<string, PlatformRegion> = {
  mock: "global",
  wechat: "cn",
  bilibili: "cn",
  "zhihu-assist": "cn",
  "xhs-assist": "cn",
  douyin: "cn",
  kuaishou: "cn",
  youtube: "global",
  instagram: "global",
  threads: "global",
  "facebook-pages": "global",
  "x-twitter": "global",
  linkedin: "global",
  pinterest: "global",
  reddit: "global",
  medium: "global",
  mastodon: "global",
  bluesky: "global",
  "telegram-channel": "global",
  discord: "global",
  ghost: "global",
  toutiao: "cn",
  baijiahao: "cn",
  csdn: "cn",
  juejin: "cn",
  jianshu: "cn",
  douban: "cn",
  notion: "global"
};

/* ===== Utility ===== */

export function now(): number {
  return Date.now();
}

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

/* ===== Video Models ===== */

export type VideoStyle =
  | "knowledge"
  | "product"
  | "review"
  | "event"
  | "talking-head"
  | "vlog"
  | "tutorial"
  | "project-demo";

export const videoStyleLabels: Record<VideoStyle, string> = {
  knowledge: "知识科普",
  product: "产品介绍",
  review: "测评",
  event: "活动记录",
  "talking-head": "口播",
  vlog: "Vlog",
  tutorial: "教程",
  "project-demo": "项目展示"
};

export type VideoAsset = {
  id: string;
  type: "video";
  localPath: string;
  filename: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
  createdAt: number;
  updatedAt: number;
};

export type VideoPlatformMeta =
  | { platform: "bilibili"; partitionSuggestion?: string; timeline?: string[]; pinnedComment?: string }
  | { platform: "xiaohongshu"; hashtags?: string[]; firstComment?: string }
  | { platform: "zhihu"; answerIntro?: string; topics?: string[] }
  | { platform: "wechat"; articleBodyMarkdown?: string };

export type VideoPlatformDraft = {
  id: string;
  contentId: string;
  contentType: "video";
  platform: PlatformId;
  title: string;
  description?: string;
  body?: string;
  tags?: string[];
  topics?: string[];
  coverText?: string;
  platformMeta: Record<string, unknown>;
  aiGenerated: boolean;
  userConfirmed: boolean;
  validation?: ValidationResult;
  createdAt: number;
  updatedAt: number;
};
