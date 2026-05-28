import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { createDraftBase, enforceNoDirectPublish, simulatedResult, validateWithLimits } from "./common.js";

export const xhsAssistAdapter: PlatformAdapter = {
  id: "xhs-assist",
  name: "小红书辅助发布",
  capabilities: {
    supportsDraft: false,
    supportsDirectPublish: false,
    supportsAssistPublish: true,
    supportsSchedule: false,
    contentTypes: ["image-note", "article", "video"]
  },
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
    return validateWithLimits(draft, {
      titleMax: 20,
      bodyMin: 20,
      tagMax: 10,
      requiredMeta: ["cardTexts", "coverText"]
    });
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("xhs-assist", account, mode);
    if (directBlocked) {
      return directBlocked;
    }

    if (mode === "assist") {
      return {
        ...simulatedResult("xhs-assist", mode, "assist_opened", "小红书辅助发布材料已生成；用户需自行检查并手动发布。"),
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
  }
};
