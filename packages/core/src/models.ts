export type ContentType = "article" | "video" | "image-note" | "qa-answer";

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "image"; assetId: string; caption?: string }
  | { type: "quote"; text: string }
  | { type: "code"; language?: string; code: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "divider" };

export type Asset = {
  id: string;
  postId?: string;
  type: "image" | "video" | "cover" | "attachment";
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

export type PublishMode = "simulate" | "draft" | "assist" | "publish";

export type PublishStatus =
  | "pending"
  | "validating"
  | "ready"
  | "simulated"
  | "draft_created"
  | "assist_opened"
  | "submitted"
  | "reviewing"
  | "published"
  | "failed"
  | "cancelled";

export type PlatformId =
  | "mock"
  | "wechat"
  | "bilibili"
  | "zhihu-assist"
  | "xhs-assist";

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

export type PlatformAccount = {
  id: string;
  platform: PlatformId;
  displayName?: string;
  authType: "none" | "api" | "browser-assist" | "mock";
  capabilities?: Record<string, unknown>;
};

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

export type PublishJob = {
  id: string;
  postId: string;
  draftId: string;
  platform: PlatformId;
  mode: PublishMode;
  status: PublishStatus;
  result?: PublishResult;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
};

export type PublishLog = {
  id: string;
  jobId: string;
  platform: PlatformId;
  level: "info" | "warn" | "error";
  message: string;
  raw?: unknown;
  createdAt: number;
};

export type CreatePostInput = {
  title: string;
  body: string;
  summary?: string;
  tags?: string[];
  inputFormat: "markdown" | "html" | "text";
  contentType?: ContentType;
  assets?: Asset[];
};

export type TransformOptions = {
  style?: "balanced";
  mode?: PublishMode;
};

export const defaultPublishMode: Record<Exclude<PlatformId, "mock">, PublishMode> = {
  wechat: "draft",
  bilibili: "simulate",
  "zhihu-assist": "assist",
  "xhs-assist": "assist"
};

export const platformLabels: Record<PlatformId, string> = {
  mock: "Mock",
  wechat: "微信公众号",
  bilibili: "B站",
  "zhihu-assist": "知乎",
  "xhs-assist": "小红书"
};

export function now(): number {
  return Date.now();
}

export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
