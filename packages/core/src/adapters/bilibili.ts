import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, simulatedResult, validateWithLimits } from "./common.js";

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
    const adaptation = generateStructuredPlatformAdaptation(input).bilibili;
    return createDraftBase("bilibili", input, adaptation.articleTitle, originalMarkdown(input), {
      videoTitle: adaptation.videoTitle,
      articleTitle: adaptation.articleTitle,
      description: adaptation.description,
      tags: adaptation.tags,
      partitionSuggestion: adaptation.partitionSuggestion,
      timeline: adaptation.timeline,
      pinnedComment: adaptation.pinnedComment,
      apiReserved: true,
      riskNotes: adaptation.riskNotes,
      structuredSource: "local-json-schema"
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
