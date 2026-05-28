import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createDraftBase, enforceNoDirectPublish, firstSentences, originalMarkdown, selectTags, simulatedResult, validateWithLimits } from "./common.js";

export const bilibiliAdapter: PlatformAdapter = {
  id: "bilibili",
  name: "B站",
  capabilities: {
    supportsDraft: true,
    supportsDirectPublish: false,
    supportsAssistPublish: false,
    supportsSchedule: false,
    contentTypes: ["article", "video"]
  },
  async transform(input) {
    const description = firstSentences(input, 5).join("\n");
    return createDraftBase("bilibili", input, input.title.slice(0, 80), originalMarkdown(input), {
      videoTitle: input.title.slice(0, 80),
      articleTitle: input.title,
      description,
      tags: selectTags(input, ["知识", "创作"], 10),
      partitionSuggestion: input.contentType === "video" ? "知识 / 科学科普" : "专栏 / 科技",
      timeline: [],
      pinnedComment: "欢迎在评论区补充你的经验。",
      apiReserved: true,
      riskNotes: ["B站投稿存在审核流程，模拟提交不代表发布成功。"]
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, {
      titleMax: 80,
      bodyMin: 20,
      tagMax: 10,
      requiredMeta: ["partitionSuggestion"]
    });
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("bilibili", account, mode);
    if (directBlocked) {
      return directBlocked;
    }

    return simulatedResult("bilibili", mode, mode === "draft" ? "draft_created" : "simulated", "B站投稿参数已模拟生成，未调用开放平台接口。");
  }
};
