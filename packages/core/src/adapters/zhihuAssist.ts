import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode, PublishOptions } from "../models.js";
import { now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

export const zhihuAssistAdapter: PlatformAdapter = {
  manifest: platformManifests["zhihu-assist"],
  async transform(input) {
    const adaptation = generateStructuredPlatformAdaptation(input).zhihu;
    return createDraftBase("zhihu-assist", input, adaptation.title, adaptation.bodyMarkdown, {
      topics: adaptation.topics,
      answerStyle: adaptation.answerStyle,
      logicHints: ["保留原文事实", "减少营销口吻", "突出问题与论证结构"],
      assistUrl: "https://www.zhihu.com/write",
      riskNotes: adaptation.riskNotes,
      structuredSource: "local-json-schema"
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, { titleMax: 100, bodyMin: 50, tagMax: 5 });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode, options?: PublishOptions) {
    const directBlocked = enforceNoDirectPublish("zhihu-assist", account, mode);
    if (directBlocked) return directBlocked;

    if (options?.dryRun) {
      const dryRun = await performDryRun("zhihu-assist", account, mode, draft);
      if (dryRun.errors.length) {
        return { platform: "zhihu-assist", mode, status: "failed", errorCode: "dry_run_failed", errorMessage: dryRun.errors.join("; "), raw: dryRun, createdAt: now() };
      }
    }

    if (mode === "assist" || mode === "copy") {
      const isCopy = mode === "copy";
      return {
        ...simulatedResult("zhihu-assist", mode, isCopy ? "copied" : "assist_opened", isCopy ? "知乎内容已复制到剪贴板，请手动粘贴发布。" : "知乎辅助发布材料已生成；用户需自行登录、检查内容并手动点击发布。"),
        url: String(draft.platformMeta.assistUrl ?? "https://www.zhihu.com/write"),
        raw: {
          simulated: true,
          realPlatformCalled: false,
          browserAssistPackage: {
            openUrl: draft.platformMeta.assistUrl,
            title: draft.title,
            body: draft.body,
            topics: draft.platformMeta.topics,
            finalPublishAction: "manual-only"
          }
        }
      };
    }
    return simulatedResult("zhihu-assist", mode, "simulated", "知乎发布已模拟，未调用真实平台能力。");
  },
  async dryRun(draft, account, mode) {
    return performDryRun("zhihu-assist", account, mode, draft);
  }
};
