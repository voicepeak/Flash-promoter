import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createId, now } from "../models.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, simulatedResult, validateWithLimits } from "./common.js";

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
    const body = originalMarkdown(input);
    return createDraftBase("wechat", input, input.title, body, {
      summary: input.summary,
      coverPrompt: `${input.title} 的公众号封面，清晰、克制、图文阅读场景`,
      coverText: input.title.slice(0, 18),
      draftOnlyByDefault: true,
      riskNotes: ["MVP 阶段只模拟生成草稿，不默认真实发布。"]
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
