import type {
  Asset,
  CanonicalPost,
  PlatformDraft,
  PlatformDraftUpdate,
  PlatformId,
  PublishJob,
  PublishLog,
  PublishMode,
  PublishResult,
  ValidationResult,
  LlmConfig,
  AiActionResult,
  AiActionRequest
} from "@flash-promoter/core";

type CreatePostPayload = {
  title: string;
  body: string;
  summary?: string;
  tags: string[];
  inputFormat: "markdown" | "html" | "text";
  assets: Asset[];
};

type CreateVideoPayload = {
  title: string;
  body: string;
  summary?: string;
  tags: string[];
  inputFormat: "markdown" | "html" | "text";
  contentType: "video";
  topic: string;
  script?: string;
  transcript?: string;
  highlights: string[];
  style: string;
  assets: Asset[];
};

export type PostWorkflowStatus = {
  editState: "empty" | "generated" | "edited";
  editLabel: string;
  publishState: "not_published" | "publishing" | "done" | "published" | "failed";
  publishLabel: string;
  lastPublishedAt?: number;
};

export type HistoryPost = CanonicalPost & {
  status: string;
  workflowStatus?: PostWorkflowStatus;
};

const headers = {
  "Content-Type": "application/json"
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {})
    }
  });

  const data = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? data.error ?? `Request failed: ${response.status}`);
  }
  return data;
}

export const api = {
  adapters: () =>
    request<{
      adapters: Array<{
        id: PlatformId;
        name: string;
        capabilities: Record<string, unknown>;
        defaultMode: PublishMode;
      }>;
    }>("/adapters"),

  createPost: (payload: CreatePostPayload) =>
    request<{ id: string; status: string; post: CanonicalPost }>("/posts", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  createVideoPost: (payload: CreateVideoPayload) =>
    request<{ id: string; status: string; post: CanonicalPost }>("/posts", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  generateDrafts: (postId: string, platforms: PlatformId[]) =>
    request<{ drafts: Array<{ id: string; platform: PlatformId; status: string }>; items: PlatformDraft[] }>(
      `/posts/${postId}/generate`,
      {
        method: "POST",
        body: JSON.stringify({ platforms, style: "balanced" })
      }
    ),

  generateVideoDrafts: (postId: string, platforms: PlatformId[]) =>
    request<{ drafts: Array<{ id: string; platform: PlatformId; status: string }>; items: PlatformDraft[] }>(
      `/posts/${postId}/video-adaptations`,
      {
        method: "POST",
        body: JSON.stringify({ platforms })
      }
    ),

  posts: () => request<{ posts: HistoryPost[] }>("/posts"),

  post: (postId: string) => request<{ post: CanonicalPost; drafts: PlatformDraft[] }>(`/posts/${postId}`),

  updateDraft: (draftId: string, payload: PlatformDraftUpdate) =>
    request<{ draft: PlatformDraft }>(`/drafts/${draftId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  validateDraft: (draftId: string) =>
    request<{ ok: boolean; warnings: ValidationResult["warnings"]; errors: ValidationResult["errors"]; draft: PlatformDraft }>(
      `/drafts/${draftId}/validate`,
      {
        method: "POST",
        body: JSON.stringify({})
      }
    ),

  publishDraft: (draftId: string, mode: PublishMode, confirmed = false) =>
    request<{ jobId: string; status: string; result?: PublishResult }>(`/drafts/${draftId}/publish`, {
      method: "POST",
      body: JSON.stringify({ mode, confirmed })
    }),

  jobs: () => request<{ jobs: PublishJob[] }>("/publish-jobs"),
  logs: () => request<{ logs: PublishLog[] }>("/publish-logs"),

  // LLM
  getLlmConfig: () => request<{ config: LlmConfig }>("/settings/llm"),
  saveLlmConfig: (config: Partial<LlmConfig>) => request<{ ok: boolean; config: LlmConfig }>("/settings/llm", { method: "POST", body: JSON.stringify(config) }),
  testLlm: (config: Partial<LlmConfig>) => request<{ ok: boolean; message?: string; error?: string }>("/settings/llm/test", { method: "POST", body: JSON.stringify(config) }),

  // AI Actions
  aiAction: (req: AiActionRequest) => request<AiActionResult>("/ai/actions", { method: "POST", body: JSON.stringify(req) }),
  generateImage: (prompt: string, n = 1, size = "1024x1024") => request<{ images: Array<{ url?: string; b64Json?: string }> }>("/ai/generate-image", { method: "POST", body: JSON.stringify({ prompt, n, size }) }),

  // Safety
  getSafety: () => request<{ realPublishEnabled: boolean; platformSwitches: Record<string, boolean>; platformGuides: Array<{ id: string; name: string; authType: string; setupNote: string; setupUrl: string; docs: string[]; publishLevels: string[]; riskLevel: string; defaultMode: string }> }>("/settings/safety"),
  saveSafety: (body: { realPublishEnabled?: boolean; platformSwitches?: Record<string, boolean> }) => request<{ ok: boolean }>("/settings/safety", { method: "POST", body: JSON.stringify(body) }),
  storageInfo: () => request<{ dbPath: string }>("/settings/storage"),

  // Platform Credentials
  getPlatformAccounts: () => request<{ accounts: Array<{ id: string; platform: string; displayName: string; authType: string; status: string; scopes: string[]; encryptedCredentials: string; createdAt: number }> }>("/platform-accounts"),
  savePlatformAccount: (body: { platform: string; displayName?: string; authType?: string; credentials?: Record<string, string> }) => request<{ ok: boolean; account: object }>("/platform-accounts", { method: "POST", body: JSON.stringify(body) }),
  deletePlatformAccount: (platform: string) => request<{ ok: boolean }>(`/platform-accounts/${platform}`, { method: "DELETE" })
};
