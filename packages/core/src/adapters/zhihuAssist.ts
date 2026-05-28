import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, selectTags, simulatedResult, validateWithLimits } from "./common.js";

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
    return createDraftBase("zhihu-assist", input, input.title.replace(/[！!]{2,}/g, "！"), originalMarkdown(input), {
      topics: selectTags(input, ["内容创作"], 5),
      answerStyle: "article",
      logicHints: ["保留原文事实", "减少营销口吻", "突出问题与论证结构"],
      assistUrl: "https://www.zhihu.com/write",
      riskNotes: ["辅助发布只打开和填充页面，用户需要自行登录并手动点击发布。"]
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
      return simulatedResult("zhihu-assist", mode, "assist_opened", "知乎辅助发布已模拟打开；不会绕过登录、验证码或点击最终发布按钮。");
    }

    return simulatedResult("zhihu-assist", mode, "simulated", "知乎发布已模拟，未调用真实平台能力。");
  }
};
