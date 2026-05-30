import type { PlatformAdapter } from "./types.js";
import type { Asset, PlatformAccount, PlatformDraft, PublishMode, PublishResult, PublishOptions } from "../models.js";
import { createId, now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, isPlatformRealPublishEnabled, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

async function getAccessToken(cred: Record<string, string>): Promise<{ token: string } | { error: string }> {
  try {
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${cred.appId}&secret=${cred.appSecret}`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json() as Record<string, unknown>;
    if (data.access_token) return { token: data.access_token as string };
    return { error: `获取 access_token 失败: ${String(data.errmsg ?? JSON.stringify(data))}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "连接微信服务器失败" };
  }
}

async function callWechatApi(accessToken: string, path: string, method: string, body?: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.weixin.qq.com/cgi-bin${path}?access_token=${accessToken}`, {
      method, headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json().catch(() => null);
    const errcode = (data as Record<string, unknown>)?.errcode;
    const ok = errcode === undefined || errcode === 0 || errcode === null;
    return { ok, status: res.status, data, error: ok ? undefined : String((data as Record<string, unknown>)?.errmsg ?? `HTTP ${res.status}`) };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : "连接失败" };
  }
}

async function uploadWechatImage(accessToken: string, asset: Asset): Promise<{ mediaId: string } | { error: string }> {
  try {
    let buffer: Buffer;
    const filename = asset.filename ?? "cover.png";
    const mime = asset.mimeType ?? "image/png";

    if (asset.dataUrl) {
      // Handle data URL: data:image/png;base64,xxxx
      const match = asset.dataUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (match) {
        buffer = Buffer.from(match[1], "base64");
        if (buffer.length < 100) return { error: "图片数据过小，可能是空图或损坏" };
        if (buffer.length > 2 * 1024 * 1024) return { error: "图片超过 2MB，微信素材上传上限为 2MB" };
      } else {
        return { error: "图片格式不支持，需要 JPG/PNG" };
      }
    } else if (asset.localPath) {
      const { readFileSync } = await import("node:fs");
      buffer = readFileSync(asset.localPath);
    } else {
      return { error: "图片无可用数据源" };
    }

    // Upload as multipart form
    const boundary = `----FormBoundary${Date.now()}`;
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: ${mime}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([Buffer.from(header, "utf-8"), buffer, Buffer.from(footer, "utf-8")]);

    const res = await fetch(`https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`, {
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      body,
      signal: AbortSignal.timeout(20000)
    });
    const data = await res.json() as Record<string, unknown>;
    if (data.media_id) return { mediaId: data.media_id as string };
    const err = String(data.errmsg ?? JSON.stringify(data));
    return { error: `素材上传失败: ${err}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "素材上传请求失败" };
  }
}

function parseCred(account: PlatformAccount): Record<string, string> | null {
  try { return account.encryptedCredentials ? JSON.parse(account.encryptedCredentials) as Record<string, string> : null; } catch { return null; }
}

function bodyToHtml(draft: PlatformDraft): string {
  const text = typeof draft.body === "string" ? draft.body : draft.body.map((b) => ("text" in b ? b.text : "")).join("\n\n");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${draft.title}</title></head><body>${text.replace(/\n/g, "<br>")}</body></html>`;
}

function findImageAsset(draft: PlatformDraft): Asset | null {
  return draft.assets?.find((a) => a.type === "image" && (a.dataUrl || a.localPath)) ?? null;
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

    if (mode !== "draft") {
      return simulatedResult("wechat", mode, "simulated", "公众号仅支持 draft 模式。");
    }

    const tokenResult = await getAccessToken(cred);
    if ("error" in tokenResult) return { platform: "wechat", mode, status: "failed", errorMessage: tokenResult.error, createdAt: now() };
    const token = tokenResult.token;

    // Upload cover image if available
    let thumbMediaId = "";
    let coverError = "";
    const imageAsset = findImageAsset(draft);
    if (imageAsset) {
      const uploadResult = await uploadWechatImage(token, imageAsset);
      if ("mediaId" in uploadResult) {
        thumbMediaId = uploadResult.mediaId;
      } else {
        coverError = uploadResult.error;
      }
    }

    // Fallback: 300x250 valid PNG as placeholder cover
    if (!thumbMediaId) {
      const px = "iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAFklEQVRYw+3BAQ0AAADCoPdPbQ8HFAAAAHwGE0AAAZrFKsAAAAAASUVORK5CYII=";
      const result = await uploadWechatImage(token, { id: "fallback", type: "image", dataUrl: `data:image/png;base64,${px}`, filename: "cover.png", mimeType: "image/png", createdAt: Date.now(), updatedAt: Date.now(), size: 2000 } as Asset);
      if ("mediaId" in result) thumbMediaId = result.mediaId;
    }

    // Build draft
    const content = bodyToHtml(draft);
    const article: Record<string, unknown> = {
      title: draft.title,
      content,
      digest: (draft.summary ?? "").slice(0, 120),
      content_source_url: "",
      need_open_comment: 0,
      only_fans_can_comment: 0
    };
    if (thumbMediaId) article.thumb_media_id = thumbMediaId;

    const res = await callWechatApi(token, "/draft/add", "POST", { articles: [article] });
    if (res.ok) {
      return {
        platform: "wechat", mode, status: "draft_created",
        externalId: String((res.data as Record<string, unknown>)?.media_id ?? createId("wechat_media")),
        message: thumbMediaId ? "公众号草稿已创建（含封面图）" : coverError ? `草稿已创建，但封面图上传失败: ${coverError}` : "公众号草稿已创建（无封面图）",
        raw: { realApiCalled: true, result: res.data, thumbMediaId, coverError },
        createdAt: now()
      };
    }
    const errMsg = String((res.data as Record<string, unknown>)?.errmsg ?? res.error ?? "创建草稿失败");
    return { platform: "wechat", mode, status: "failed", errorMessage: errMsg, createdAt: now() };
  },
  async dryRun(draft, account, mode) { return performDryRun("wechat", account, mode, draft); }
};
