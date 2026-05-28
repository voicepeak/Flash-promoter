import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { createDraftBase, enforceNoDirectPublish, simulatedResult, validateWithLimits } from "./common.js";

export const zhihuAssistAdapter: PlatformAdapter = {
  id: "zhihu-assist",
  name: "知乎辅助发布",
  capabilities: {
    supportsDraft: false,
    supportsDirectPublish: false,
    supportsAssistPublish: true,
    supportsSchedule: false,
    contentTypes: ["article", "qa-answer"]
  },
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
    return validateWithLimits(draft, {
      titleMax: 100,
      bodyMin: 50,
      tagMax: 5
    });
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("zhihu-assist", account, mode);
    if (directBlocked) {
      return directBlocked;
    }

    if (mode === "assist") {
      return {
        ...simulatedResult("zhihu-assist", mode, "assist_opened", "知乎辅助发布材料已生成；用户需自行登录、检查内容并手动点击发布。"),
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
  }
};
