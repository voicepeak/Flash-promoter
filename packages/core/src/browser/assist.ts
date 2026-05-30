/* ===== Browser Assist Foundation =====
 * Provides browser-based content publishing assistance.
 * MVP is stub/interface only — browsers auto-assist relies on user
 * manually filling in content in their logged-in browser.
 */

import type { PlatformDraft, PublishResult, PlatformId } from "../models.js";
import { createId, now } from "../models.js";

export type BrowserAssistPackage = {
  platform: PlatformId;
  openUrl: string;
  title: string;
  body: string | Record<string, unknown>[];
  fields: Record<string, string | string[]>;
  instructions: string[];
  finalPublishAction: "manual-only";
};

export type AssistFillResult = {
  success: boolean;
  filledFields: string[];
  failedFields: string[];
  errorMessage?: string;
  screenshotBefore?: string;
  screenshotAfter?: string;
};

export interface BrowserAssistStrategy {
  readonly platform: PlatformId;
  readonly openUrl: string;

  buildPackage(draft: PlatformDraft): BrowserAssistPackage;
  fillFields(pkg: BrowserAssistPackage): Promise<AssistFillResult>;
}

export function createBrowserAssistPackage(draft: PlatformDraft): BrowserAssistPackage {
  const openUrls: Record<string, string> = {
    "zhihu-assist": "https://www.zhihu.com/write",
    "xhs-assist": "https://creator.xiaohongshu.com/",
    toutiao: "https://mp.toutiao.com/",
    baijiahao: "https://baijiahao.baidu.com/",
    csdn: "https://mp.csdn.net/mp_blog/creation/editor",
    juejin: "https://juejin.cn/editor/drafts/new",
    jianshu: "https://www.jianshu.com/writer",
    douban: "https://www.douban.com/write"
  };

  const instructions: Record<string, string[]> = {
    "zhihu-assist": [
      "打开知乎发布页 https://www.zhihu.com/write",
      "粘贴标题到标题栏",
      "粘贴正文到编辑器",
      "添加话题标签",
      "检查内容格式",
      "手动点击发布"
    ],
    "xhs-assist": [
      "打开小红书创作中心 https://creator.xiaohongshu.com/",
      "粘贴标题",
      "粘贴正文",
      "上传封面图片",
      "添加上话题标签",
      "检查内容",
      "手动发布"
    ],
    toutiao: [
      "打开头条号 https://mp.toutiao.com/",
      "粘贴标题到输入框",
      "粘贴正文到编辑器",
      "上传封面和正文图片",
      "选择分类和标签",
      "检查内容合规性",
      "手动发布"
    ],
    baijiahao: [
      "打开百家号 https://baijiahao.baidu.com/",
      "粘贴标题",
      "粘贴正文到富文本编辑器",
      "上传封面和图片",
      "选择频道分类",
      "添加标签",
      "检查内容并手动发布"
    ],
    csdn: [
      "打开CSDN创作中心 https://mp.csdn.net/mp_blog/creation/editor",
      "粘贴标题",
      "粘贴正文到Markdown编辑器",
      "选择文章分类",
      "添加标签",
      "设置文章类型（原创/转载）",
      "预览并手动发布"
    ],
    juejin: [
      "打开掘金编辑器 https://juejin.cn/editor/drafts/new",
      "粘贴标题",
      "粘贴正文到Markdown编辑器",
      "选择分类",
      "添加技术标签",
      "上传封面图",
      "预览确认后手动发布"
    ],
    jianshu: [
      "打开简书 https://www.jianshu.com/writer",
      "粘贴标题",
      "粘贴正文",
      "选择文集",
      "添加标签",
      "手动发布"
    ],
    douban: [
      "打开豆瓣 https://www.douban.com/write",
      "粘贴标题",
      "粘贴正文到编辑器",
      "添加标签",
      "手动发布日记"
    ]
  };

  return {
    platform: draft.platform,
    openUrl: String(draft.platformMeta.assistUrl ?? openUrls[draft.platform] ?? ""),
    title: draft.title,
    body: draft.body,
    fields: extractAssistFields(draft),
    instructions: instructions[draft.platform] ?? ["打开平台", "粘贴内容", "添加标签", "手动发布"],
    finalPublishAction: "manual-only"
  };
}

export function extractAssistFields(draft: PlatformDraft): Record<string, string | string[]> {
  const fields: Record<string, string | string[]> = {};

  fields.title = draft.title;
  fields.body = typeof draft.body === "string" ? draft.body : "";

  if (draft.tags?.length) fields.tags = draft.tags;
  if (draft.summary) fields.summary = draft.summary;
  if (draft.topics?.length) fields.topics = draft.topics;

  const meta = draft.platformMeta;
  if (meta.hashtags && Array.isArray(meta.hashtags)) fields.hashtags = meta.hashtags as string[];
  if (meta.topics && Array.isArray(meta.topics)) fields.topics = meta.topics as string[];

  return fields;
}

export async function fillFields(pkg: BrowserAssistPackage): Promise<AssistFillResult> {
  // MVP: Simulated field fill — in production this would use Playwright
  const filledFields: string[] = [];
  const failedFields: string[] = [];

  const fieldKeys = Object.keys(pkg.fields);
  for (const key of fieldKeys) {
    const value = pkg.fields[key];
    const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
    if (isEmpty && key !== "tags" && key !== "hashtags") {
      failedFields.push(key);
    } else {
      filledFields.push(key);
    }
  }

  if (failedFields.length > 0) {
    return {
      success: false,
      filledFields,
      failedFields,
      errorMessage: `部分字段为空：${failedFields.join(", ")}。当前为 MVP 模拟模式，请手动检查后发布。`
    };
  }

  return {
    success: true,
    filledFields,
    failedFields: [],
    screenshotBefore: "[MVP mock] 模拟已打开发布页面",
    screenshotAfter: `[MVP mock] 已填充字段：${filledFields.join(", ")}`
  };
}

export async function assistSimulatePublish(draft: PlatformDraft): Promise<PublishResult> {
  const pkg = createBrowserAssistPackage(draft);

  return {
    platform: draft.platform,
    mode: "assist",
    status: "assist_opened",
    externalId: createId(`${draft.platform.replace("-assist", "")}_assist`),
    url: pkg.openUrl,
    message: `${draft.platform} 辅助发布材料已生成；用户需自行登录、检查内容并手动发布。`,
    raw: {
      simulated: true,
      realPlatformCalled: false,
      browserAssistPackage: pkg,
      finalPublishAction: "manual-only"
    },
    createdAt: now()
  };
}

export function copyToClipboardText(draft: PlatformDraft): string {
  const parts: string[] = [];
  parts.push(`# ${draft.title}`);
  if (draft.summary) parts.push(`\n${draft.summary}`);
  parts.push(typeof draft.body === "string" ? `\n${draft.body}` : "");
  if (draft.tags?.length) parts.push(`\n\n标签：${draft.tags.join(", ")}`);
  return parts.join("\n");
}
