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
  ValidationResult
} from "@flash-promoter/core";

type CreatePostPayload = {
  title: string;
  body: string;
  summary?: string;
  tags: string[];
  inputFormat: "markdown" | "html" | "text";
  assets: Asset[];
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

  generateDrafts: (postId: string, platforms: PlatformId[]) =>
    request<{ drafts: Array<{ id: string; platform: PlatformId; status: string }>; items: PlatformDraft[] }>(
      `/posts/${postId}/generate`,
      {
        method: "POST",
        body: JSON.stringify({ platforms, style: "balanced" })
      }
    ),

  posts: () => request<{ posts: Array<CanonicalPost & { status: string }> }>("/posts"),

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
  logs: () => request<{ logs: PublishLog[] }>("/publish-logs")
};
