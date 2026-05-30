import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode, PublishOptions } from "../models.js";
import { now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

export const xhsAssistAdapter: PlatformAdapter = {
  manifest: platformManifests["xhs-assist"],
  async transform(input) {
    const adaptation = generateStructuredPlatformAdaptation(input).xiaohongshu;
    return createDraftBase("xhs-assist", input, adaptation.title, adaptation.content, {
      hashtags: adaptation.hashtags,
      coverText: adaptation.coverText,
      cardTexts: adaptation.cardTexts,
      emojiLevel: adaptation.emojiLevel,
      assistUrl: "https://creator.xiaohongshu.com/",
      riskNotes: adaptation.riskNotes,
      structuredSource: "local-json-schema"
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, { titleMax: 20, bodyMin: 20, tagMax: 10, requiredMeta: ["cardTexts", "coverText"] });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode, options?: PublishOptions) {
    const directBlocked = enforceNoDirectPublish("xhs-assist", account, mode);
    if (directBlocked) return directBlocked;

    if (options?.dryRun) {
      const dryRun = await performDryRun("xhs-assist", account, mode, draft);
      if (dryRun.errors.length) {
        return { platform: "xhs-assist", mode, status: "failed", errorCode: "dry_run_failed", errorMessage: dryRun.errors.join("; "), raw: dryRun, createdAt: now() };
      }
    }

    if (mode === "assist" || mode === "copy" || mode === "share") {
      const isCopy = mode === "copy";
      const isShare = mode === "share";
      const status = isCopy ? "copied" : isShare ? "share_opened" : "assist_opened";
      const message = isCopy ? "小红书内容已复制到剪贴板。" : isShare ? "小红书分享面板已打开。" : "小红书辅助发布材料已生成；用户需自行检查并手动发布。";
      return {
        ...simulatedResult("xhs-assist", mode, status, message),
        url: String(draft.platformMeta.assistUrl ?? "https://creator.xiaohongshu.com/"),
        raw: {
          simulated: true,
          realPlatformCalled: false,
          browserAssistPackage: {
            openUrl: draft.platformMeta.assistUrl,
            title: draft.title,
            body: draft.body,
            hashtags: draft.platformMeta.hashtags,
            coverText: draft.platformMeta.coverText,
            cardTexts: draft.platformMeta.cardTexts,
            finalPublishAction: "manual-only"
          }
        }
      };
    }
    return simulatedResult("xhs-assist", mode, "simulated", "小红书发布已模拟，未调用真实平台能力。");
  },
  async dryRun(draft, account, mode) {
    return performDryRun("xhs-assist", account, mode, draft);
  }
};
