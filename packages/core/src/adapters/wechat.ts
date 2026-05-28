import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createId, now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { createDraftBase, enforceNoDirectPublish, simulatedResult, validateWithLimits } from "./common.js";

export const wechatAdapter: PlatformAdapter = {
  id: "wechat",
  name: "微信公众号",
  capabilities: {
    supportsDraft: true,
    supportsDirectPublish: false,
    supportsAssistPublish: false,
    supportsSchedule: false,
    contentTypes: ["article"]
  },
  async transform(input) {
    const adaptation = generateStructuredPlatformAdaptation(input).wechat;
    return createDraftBase("wechat", input, adaptation.title, adaptation.bodyMarkdown, {
      summary: adaptation.summary,
      coverPrompt: adaptation.coverPrompt,
      coverText: adaptation.coverText,
      draftOnlyByDefault: true,
      riskNotes: adaptation.riskNotes,
      structuredSource: "local-json-schema"
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, {
      titleMax: 64,
      bodyMin: 20,
      tagMax: 8
    });
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("wechat", account, mode);
    if (directBlocked) {
      return directBlocked;
    }

    if (mode === "draft") {
      const draftId = createId("wechat_draft");
      return {
        platform: "wechat",
        mode,
        status: "draft_created",
        draftId,
        externalId: draftId,
        message: "公众号草稿已模拟创建；MVP 未调用微信接口。",
        raw: {
          title: draft.title,
          mediaId: draftId,
          simulated: true,
          realPlatformCalled: false,
          requiresSecondConfirmationForPublish: true
        },
        createdAt: now()
      };
    }

    return simulatedResult("wechat", mode, mode === "assist" ? "assist_opened" : "simulated", "公众号发布动作已模拟，未调用微信接口。");
  }
};
