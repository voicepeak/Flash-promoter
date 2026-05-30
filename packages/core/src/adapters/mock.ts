import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createId, now } from "../models.js";
import { platformManifests } from "./manifests.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, performDryRun, simulatedResult, validateWithLimits } from "./common.js";

export const mockAdapter: PlatformAdapter = {
  manifest: platformManifests.mock,
  async transform(input) {
    return createDraftBase("mock", input, `[Mock] ${input.title}`, originalMarkdown(input), {
      adapter: "mock",
      purpose: "完整验证 transform → validate → publish 闭环"
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, { titleMax: 80, bodyMin: 1, tagMax: 10 });
  },
  async validatePackage(draft) {
    return this.validate(draft);
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("mock", account, mode);
    if (directBlocked) return directBlocked;
    const status = mode === "draft" ? "draft_created" : mode === "assist" ? "assist_opened" : mode === "copy" ? "copied" : "simulated";
    return simulatedResult("mock", mode, status, `Mock ${mode} 已完成，未调用任何真实平台。`);
  },
  async dryRun(draft, account, mode) {
    return performDryRun("mock", account, mode, draft);
  }
};
