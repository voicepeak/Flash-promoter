import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode, PublishOptions } from "../models.js";
import { createId, now } from "../models.js";
import { generateStructuredPlatformAdaptation } from "../ai/local.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

export const wechatAdapter: PlatformAdapter = {
  manifest: platformManifests.wechat,
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
    return validateWithLimits(draft, { titleMax: 64, bodyMin: 20, tagMax: 8 });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async createDraft(draft, account) {
    const draftId = createId("wechat_draft");
    return {
      draftId,
      platform: "wechat",
      externalId: draftId,
      mediaId: draftId
    };
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode, options?: PublishOptions) {
    const directBlocked = enforceNoDirectPublish("wechat", account, mode);
    if (directBlocked) return directBlocked;

    if (options?.dryRun) {
      const dryRun = await performDryRun("wechat", account, mode, draft);
      if (dryRun.errors.length) {
        return { platform: "wechat", mode, status: "failed", errorCode: "dry_run_failed", errorMessage: dryRun.errors.join("; "), raw: dryRun, createdAt: now() };
      }
    }

    if (mode === "draft") {
      const draftId = createId("wechat_draft");
      return {
        platform: "wechat", mode, status: "draft_created",
        draftId, externalId: draftId,
        message: "公众号草稿已模拟创建；MVP 未调用微信接口。",
        raw: { title: draft.title, mediaId: draftId, simulated: true, realPlatformCalled: false, requiresSecondConfirmationForPublish: true },
        createdAt: now()
      };
    }
    return simulatedResult("wechat", mode, mode === "assist" ? "assist_opened" : mode === "simulate" ? "simulated" : "draft_created", "公众号发布动作已模拟，未调用微信接口。");
  },
  async dryRun(draft, account, mode) {
    return performDryRun("wechat", account, mode, draft);
  }
};
