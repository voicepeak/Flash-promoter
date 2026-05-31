import type { PlatformAdapter } from "./types.js";
import type { Asset, PlatformAccount, PlatformDraft, PublishMode, PublishResult, PublishOptions } from "../models.js";
import { createId, now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, isPlatformRealPublishEnabled, performDryRun, simulatedResult, validateWithLimits } from "./common.js";
import { renderPlatformDraft } from "../render/platform.js";

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

async function uploadWechatImage(accessToken: string, asset: Asset): Promise<{ mediaId: string; url: string } | { error: string }> {
  try {
    let buffer: Buffer;
    const filename = asset.filename ?? "image.png";
    const mime = asset.mimeType ?? "image/png";

    if (asset.dataUrl) {
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
    if (data.media_id) return { mediaId: data.media_id as string, url: (data.url as string) ?? "" };
    const err = String(data.errmsg ?? JSON.stringify(data));
    return { error: `素材上传失败: ${err}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "素材上传请求失败" };
  }
}

/** Generate a valid minimal 300x250 PNG for cover fallback */
async function generateCoverPng(): Promise<Buffer> {
  const { deflateSync } = await import("node:zlib");
  const w = 300, h = 250;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const o = y * (1 + w * 3);
    for (let x = 0; x < w; x++) { raw[o + 1 + x * 3] = 59; raw[o + 1 + x * 3 + 1] = 130; raw[o + 1 + x * 3 + 2] = 246; }
  }
  const idat = deflateSync(raw);
  const crc = (b: Buffer) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0); } return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const b2 = Buffer.concat([Buffer.from(t), d]); const r = Buffer.alloc(4); r.writeUInt32BE(crc(b2), 0); return Buffer.concat([l, Buffer.from(t), d, r]); };
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function parseCred(account: PlatformAccount): Record<string, string> | null {
  try { return account.encryptedCredentials ? JSON.parse(account.encryptedCredentials) as Record<string, string> : null; } catch { return null; }
}

function findImageAssets(draft: PlatformDraft): Asset[] {
  return (draft.assets ?? []).filter((a) => a.type === "image" && (a.dataUrl || a.localPath));
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

    // Upload ALL image assets to WeChat, collect URLs for inline images
    const imageAssets = findImageAssets(draft);
    const imageUrls = new Map<string, string>();
    let thumbMediaId = "";
    const uploadErrors: string[] = [];

    for (const asset of imageAssets) {
      const result = await uploadWechatImage(token, asset);
      if ("mediaId" in result) {
        if (!thumbMediaId) thumbMediaId = result.mediaId;
        if (result.url) imageUrls.set(asset.id, result.url);
      } else {
        uploadErrors.push(result.error);
      }
    }

    // Fallback: generate a valid 300x250 PNG cover if no image uploaded
    if (!thumbMediaId) {
      const png = await generateCoverPng();
      const b64 = png.toString("base64");
      const fallback = await uploadWechatImage(token, { id: "fallback", type: "image", dataUrl: `data:image/png;base64,${b64}`, filename: "cover.png", mimeType: "image/png", createdAt: Date.now(), updatedAt: Date.now(), size: png.length } as Asset);
      if ("mediaId" in fallback) thumbMediaId = fallback.mediaId;
    }

    // Build the exact WeChat HTML payload used by preview and publish.
    const content = renderPlatformDraft(draft, {
      target: "publish",
      assetUrl: (assetId) => imageUrls.get(assetId)
    }).bodyHtml;
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
      const imageCount = imageUrls.size;
      const coverOk = !!thumbMediaId;
      let msg = "公众号草稿已创建";
      if (coverOk && imageCount > 0) msg += `（含封面 + ${imageCount} 张配图）`;
      else if (coverOk) msg += "（含封面图）";
      else if (imageCount > 0) msg += `（含 ${imageCount} 张配图，无封面）`;
      if (uploadErrors.length) msg += ` | 上传错误: ${uploadErrors.join("; ")}`;
      return {
        platform: "wechat", mode, status: "draft_created",
        externalId: String((res.data as Record<string, unknown>)?.media_id ?? createId("wechat_media")),
        url: "https://mp.weixin.qq.com/",
        message: msg,
        raw: { realApiCalled: true, result: res.data, thumbMediaId, imageCount, uploadErrors },
        createdAt: now()
      };
    }
    const errMsg = String((res.data as Record<string, unknown>)?.errmsg ?? res.error ?? "创建草稿失败");
    return { platform: "wechat", mode, status: "failed", errorMessage: errMsg, createdAt: now() };
  },
  async dryRun(draft, account, mode) { return performDryRun("wechat", account, mode, draft); }
};
