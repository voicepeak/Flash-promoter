import type {
  CanonicalPost,
  PlatformAccount,
  PlatformDraft,
  PlatformId,
  PublishMode,
  PublishResult,
  TransformOptions,
  ValidationResult
} from "../models.js";

export interface PlatformAdapter {
  id: PlatformId;
  name: string;
  capabilities: {
    supportsDraft: boolean;
    supportsDirectPublish: boolean;
    supportsAssistPublish: boolean;
    supportsSchedule: boolean;
    contentTypes: Array<"article" | "video" | "image-note" | "qa-answer">;
  };
  transform(input: CanonicalPost, options: TransformOptions): Promise<PlatformDraft>;
  validate(draft: PlatformDraft): Promise<ValidationResult>;
  publish(draft: PlatformDraft, account: PlatformAccount, mode: PublishMode): Promise<PublishResult>;
}
