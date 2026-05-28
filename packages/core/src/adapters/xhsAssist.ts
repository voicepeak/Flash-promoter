import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createDraftBase, enforceNoDirectPublish, firstSentences, originalPlainText, selectTags, simulatedResult, validateWithLimits } from "./common.js";

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
    const sentences = firstSentences(input, 8);
    const shortBody = sentences.map((sentence) => sentence.replace(/[。；;]/g, "")).join("\n");
    const cardTexts = [input.title, ...sentences.slice(0, 5), input.summary || originalPlainText(input).slice(0, 80)];
    return createDraftBase("xhs-assist", input, input.title.slice(0, 20), shortBody, {
      hashtags: selectTags(input, ["创作", "内容运营"], 8).map((tag) => `#${tag}`),
      coverText: input.title.slice(0, 14),
      cardTexts,
      emojiLevel: "none",
      assistUrl: "https://creator.xiaohongshu.com/",
      riskNotes: ["辅助发布不自动点击最终发布按钮，不提供规避风控建议。"]
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
      return simulatedResult("xhs-assist", mode, "assist_opened", "小红书辅助发布已模拟打开；用户需自行检查并手动发布。");
    }

    return simulatedResult("xhs-assist", mode, "simulated", "小红书发布已模拟，未调用真实平台能力。");
  }
};
