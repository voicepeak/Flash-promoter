import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createId } from "../models.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

export const wordpressAdapter: PlatformAdapter = {
  manifest: platformManifests.wordpress,
  async transform(input) {
    return createDraftBase("wordpress", input, input.title, originalMarkdown(input), {
      draftOnlyByDefault: true,
      structuredSource: "local-rule",
      postType: "post",
      postStatus: "draft",
      categories: [],
      riskNotes: ["WordPress REST API 支持草稿和真实发布"]
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, { titleMax: 200, bodyMin: 10, tagMax: 20 });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("wordpress", account, mode);
    if (directBlocked) return directBlocked;
    if (mode === "draft") {
      return simulatedResult("wordpress", mode, "draft_created", "WordPress 草稿已模拟创建；MVP 未调用 WordPress REST API。");
    }
    return simulatedResult("wordpress", mode, "simulated", "WordPress 发布已模拟，未调用 WordPress REST API。");
  },
  async createDraft(draft, _account) {
    return {
      draftId: createId("wp_draft"),
      platform: "wordpress",
      externalId: createId("wp_external")
    };
  },
  async dryRun(draft, account, mode) {
    return performDryRun("wordpress", account, mode, draft);
  }
};
