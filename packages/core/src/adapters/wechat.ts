import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PlatformDraft, PublishMode, PublishResult, PublishOptions } from "../models.js";
import { createId, now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, isPlatformRealPublishEnabled, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

async function callWechatApi(credentials: Record<string, string>, path: string, method: string, body?: Record<string, unknown>): Promise<{ ok: boolean; status: number; data?: unknown; error?: string }> {
  const { appId, appSecret } = credentials;
  try {
    const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const tokenRes = await fetch(tokenUrl, { signal: AbortSignal.timeout(10000) });
    const tokenData = await tokenRes.json() as Record<string, unknown>;
    const accessToken = tokenData.access_token as string;
    if (!accessToken) {
      return { ok: false, status: 401, error: `获取 access_token 失败: ${String(tokenData.errmsg ?? "未知错误")}` };
    }
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin${path}?access_token=${accessToken}`, {
      method, headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json().catch(() => null);
    return { ok: (data as Record<string, unknown>)?.errcode === 0, status: res.status, data, error: data ? String((data as Record<string, unknown>).errmsg ?? "") : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "连接失败" };
  }
}

function parseCred(account: PlatformAccount): Record<string, string> | null {
  try { return account.encryptedCredentials ? JSON.parse(account.encryptedCredentials) as Record<string, string> : null; } catch { return null; }
}

export const wechatAdapter: PlatformAdapter = {
  manifest: platformManifests.wechat,
  async transform(input) {
    const adaptation = generateStructuredPlatformAdaptation(input).wechat;
    return createDraftBase("wechat", input, adaptation.title, adaptation.bodyMarkdown, {
      summary: adaptation.summary, coverPrompt: adaptation.coverPrompt, coverText: adaptation.coverText,
      draftOnlyByDefault: true, riskNotes: adaptation.riskNotes, structuredSource: "local-json-schema"
    });
  },
  async validate(draft) { return validateWithLimits(draft, { titleMax: 64, bodyMin: 20, tagMax: 8 }); },
  async validatePackage(draft) { return this.validate(draft); },
  async createDraft(draft, _account) {
    return { draftId: createId("wechat_draft"), platform: "wechat", externalId: createId("wechat_external"), mediaId: createId("wechat_media") };
  },
  async publish(draft: PlatformDraft, account: PlatformAccount, mode: PublishMode, options?: PublishOptions): Promise<PublishResult> {
    const blocked = enforceNoDirectPublish("wechat", account, mode);
    if (blocked) return blocked;

    if (options?.dryRun) {
      const dr = await performDryRun("wechat", account, mode, draft);
      if (dr.errors.length) return { platform: "wechat", mode, status: "failed", errorCode: "dry_run_failed", errorMessage: dr.errors.join("; "), raw: dr, createdAt: now() };
    }

    const cred = parseCred(account);
    const realEnabled = isPlatformRealPublishEnabled("wechat");

    if (!realEnabled || !cred?.appId || !cred?.appSecret) {
      return simulatedResult("wechat", mode, mode === "draft" ? "draft_created" : "simulated",
        cred ? "公众号凭证已配置但真实发布未开启，执行模拟。" : "公众号未配置凭证，执行模拟发布。");
    }

    if (mode === "draft") {
      const body = typeof draft.body === "string" ? draft.body : draft.body.map((b) => ("text" in b ? b.text : "")).join("\n\n");
      const content = `<!DOCTYPE html><html><head><title>${draft.title}</title></head><body>${body.replace(/\n/g, "<br>")}</body></html>`;
      const res = await callWechatApi(cred, "/draft/add", "POST", {
        articles: [{ title: draft.title, content, digest: (draft.summary ?? "").slice(0, 120), content_source_url: "", need_open_comment: 0, only_fans_can_comment: 0 }]
      });
      if (res.ok) {
        return {
          platform: "wechat", mode, status: "draft_created",
          externalId: String((res.data as Record<string, unknown>)?.media_id ?? createId("wechat_media")),
          message: "公众号草稿已创建",
          raw: { realApiCalled: true, result: res.data },
          createdAt: now()
        };
      }
      return { platform: "wechat", mode, status: "failed", errorMessage: res.error ?? "创建草稿失败", createdAt: now() };
    }
    return simulatedResult("wechat", mode, "simulated", "公众号仅支持 draft 模式。");
  },
  async dryRun(draft, account, mode) { return performDryRun("wechat", account, mode, draft); }
};
