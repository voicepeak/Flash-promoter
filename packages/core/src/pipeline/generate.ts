import type { CanonicalPost, PlatformDraft, PlatformId, TransformOptions } from "../models.js";
import { adapterRegistry } from "../adapters/index.js";

export async function generatePlatformDrafts(
  post: CanonicalPost,
  platforms: PlatformId[],
  options: TransformOptions = { style: "balanced" }
): Promise<PlatformDraft[]> {
  const drafts: PlatformDraft[] = [];
  for (const platform of platforms) {
    const adapter = adapterRegistry.get(platform);
    drafts.push(await adapter.transform(post, options));
  }
  return drafts;
}
