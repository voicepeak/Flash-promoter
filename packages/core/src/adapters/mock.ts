import type { PlatformAdapter } from "./types.js";
import type { PlatformAccount, PublishMode } from "../models.js";
import { createDraftBase, enforceNoDirectPublish, originalMarkdown, simulatedResult, validateWithLimits } from "./common.js";

export const mockAdapter: PlatformAdapter = {
  id: "mock",
  name: "Mock Adapter",
  capabilities: {
    supportsDraft: true,
    supportsDirectPublish: false,
    supportsAssistPublish: true,
    supportsSchedule: false,
    contentTypes: ["article", "video", "image-note", "qa-answer"]
  },
  async transform(input) {
    return createDraftBase("mock", input, `[Mock] ${input.title}`, originalMarkdown(input), {
      adapter: "mock",
      purpose: "完整验证 transform → validate → publish 闭环"
    });
  },
  async validate(draft) {
    return validateWithLimits(draft, { titleMax: 80, bodyMin: 1, tagMax: 10 });
  },
  async publish(draft, account: PlatformAccount, mode: PublishMode) {
    const directBlocked = enforceNoDirectPublish("mock", account, mode);
    if (directBlocked) {
      return directBlocked;
    }

    const status = mode === "draft" ? "draft_created" : mode === "assist" ? "assist_opened" : "simulated";
    return simulatedResult("mock", mode, status, `Mock ${mode} 已完成，未调用任何真实平台。`);
  }
};
