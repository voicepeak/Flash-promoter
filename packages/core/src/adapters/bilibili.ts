import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode, PublishOptions } from "../models.js";
import { now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

export const bilibiliAdapter: PlatformAdapter = {
  manifest: platformManifests.bilibili,
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
    return validateWithLimits(draft, { titleMax: 80, bodyMin: 20, tagMax: 10, requiredMeta: ["partitionSuggestion"] });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode, options?: PublishOptions) {
    const directBlocked = enforceNoDirectPublish("bilibili", account, mode);
    if (directBlocked) return directBlocked;

    if (options?.dryRun) {
      const dryRun = await performDryRun("bilibili", account, mode, draft);
      if (dryRun.errors.length) {
        return { platform: "bilibili", mode, status: "failed", errorCode: "dry_run_failed", errorMessage: dryRun.errors.join("; "), raw: dryRun, createdAt: now() };
      }
    }

    return simulatedResult("bilibili", mode, mode === "draft" ? "draft_created" : "simulated", "B站投稿参数已模拟生成，未调用开放平台接口。");
  },
  async dryRun(draft, account, mode) {
    return performDryRun("bilibili", account, mode, draft);
  }
};
