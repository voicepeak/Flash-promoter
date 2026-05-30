import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PlatformDraft, PublishMode, PublishResult } from "../models.js";
import { createId, now } from "../models.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, isPlatformRealPublishEnabled, originalMarkdown, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

async function callWordPressApi(
  credentials: Record<string, string>,
  path: string,
  method: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const { siteUrl, username, appPassword } = credentials;
  const base = siteUrl.replace(/\/$/, "");
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data, error: res.ok ? undefined : String((data as Record<string, unknown>)?.message ?? `HTTP ${res.status}`) };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "连接失败" };
  }
}

function parseCredentials(account: PlatformAccount): Record<string, string> | null {
  try {
    if (!account.encryptedCredentials) return null;
    return JSON.parse(account.encryptedCredentials) as Record<string, string>;
  } catch { return null; }
}

export const wordpressAdapter: PlatformAdapter = {
  manifest: platformManifests.wordpress,
  async transform(input) {
    return createDraftBase("wordpress", input, input.title, originalMarkdown(input), {
      draftOnlyByDefault: true,
      structuredSource: "local-rule",
      postType: "post",
      postStatus: "draft",
      categories: [],
      riskNotes: ["WordPress REST API 支持草稿和真实发布"]
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, { titleMax: 200, bodyMin: 10, tagMax: 20 });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async publish(draft: PlatformDraft, account: PlatformAccount, mode: PublishMode): Promise<PublishResult> {
    const blocked = enforceNoDirectPublish("wordpress", account, mode);
    if (blocked) return blocked;

    const cred = parseCredentials(account);
    const realEnabled = isPlatformRealPublishEnabled("wordpress");

    if (!realEnabled || !cred?.siteUrl || !cred?.appPassword) {
      return simulatedResult("wordpress", mode, mode === "draft" ? "draft_created" : "simulated",
        cred ? "WordPress 凭证已配置但真实发布未开启，执行模拟。" : "WordPress 未配置凭证，执行模拟发布。");
    }

    // Real API call
    if (mode === "draft") {
      const body = typeof draft.body === "string" ? draft.body : draft.body.map((b) => ("text" in b ? b.text : "")).join("\n\n");
      const res = await callWordPressApi(cred, "posts", "POST", {
        title: draft.title,
        content: body,
        excerpt: draft.summary ?? "",
        status: "draft",
        tags: draft.tags ?? []
      });
      if (res.ok) {
        const data = res.data as Record<string, unknown>;
        return {
          platform: "wordpress", mode, status: "draft_created",
          externalId: String(data.id ?? ""),
          url: String(data.link ?? ""),
          message: `WordPress 草稿已创建`,
          raw: { realApiCalled: true, postId: data.id, link: data.link },
          createdAt: now()
        };
      }
      return { platform: "wordpress", mode, status: "failed", errorMessage: res.error ?? "创建草稿失败", createdAt: now() };
    }

    return simulatedResult("wordpress", mode, "simulated", "WordPress 仅支持 draft 模式。");
  },
  async createDraft(draft, _account) {
    return { draftId: createId("wp_draft"), platform: "wordpress", externalId: createId("wp_external") };
  },
  async dryRun(draft, account, mode) {
    return performDryRun("wordpress", account, mode, draft);
  }
};
