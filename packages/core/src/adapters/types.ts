import type {
  CanonicalPost,
  DryRunReport,
  FieldMapping,
  PlatformAccount,
  PlatformDraft,
  PlatformDraftResult,
  PlatformId,
  PlatformManifest,
  PlatformMetricsResult,
  PlatformPublishResult,
  PlatformStatusResult,
  PlatformSubmitResult,
  PublishMode,
  PublishOptions,
  PublishResult,
  PreparedAssets,
  SubmitOptions,
  TransformOptions,
  ValidationResult
} from "../models.js";

/* ===== Sub-Adapters ===== */

export interface AuthAdapter {
  authorize(): Promise<PlatformAccount>;
  refreshToken(account: PlatformAccount): Promise<PlatformAccount>;
  validate(account: PlatformAccount): Promise<boolean>;
  revoke(account: PlatformAccount): Promise<void>;
}

export interface AssetAdapter {
  prepareAssets(
    pkg: { assets: Array<{ id: string; type: string; localPath?: string; dataUrl?: string; mimeType?: string; filename?: string; size?: number; width?: number; height?: number; duration?: number }> },
    account: PlatformAccount
  ): Promise<PreparedAssets>;
  uploadAsset(assetId: string, account: PlatformAccount): Promise<{ platformAssetId: string; platformUrl?: string }>;
  formatCheck(localPath: string, mimeType?: string): Promise<{ ok: boolean; reason?: string }>;
}

export interface StatusAdapter {
  getStatus(externalId: string, account: PlatformAccount): Promise<PlatformStatusResult>;
  pollStatus(externalId: string, account: PlatformAccount, intervalMs: number, maxAttempts: number): Promise<PlatformStatusResult>;
}

export interface MetricsAdapter {
  getMetrics(externalId: string, account: PlatformAccount): Promise<PlatformMetricsResult>;
}

/* ===== Main Platform Adapter ===== */

export interface PlatformAdapter {
  manifest: PlatformManifest;

  /** Validate a content package against platform rules */
  validatePackage(draft: PlatformDraft): Promise<ValidationResult>;

  /** Simple validation helper (backward compat) */
  validate(draft: PlatformDraft): Promise<ValidationResult>;

  /** Transform CanonicalPost into PlatformDraft */
  transform(input: CanonicalPost, options: TransformOptions): Promise<PlatformDraft>;

  /** Prepare and optionally upload assets */
  prepareAssets?(
    draft: PlatformDraft,
    account: PlatformAccount
  ): Promise<PreparedAssets>;

  /** Create a draft on the platform (L2) */
  createDraft?(
    draft: PlatformDraft,
    account: PlatformAccount
  ): Promise<PlatformDraftResult>;

  /** Submit content for review (L3) */
  submit?(
    draft: PlatformDraft,
    account: PlatformAccount,
    options: SubmitOptions
  ): Promise<PlatformSubmitResult>;

  /** Publish directly (L3) */
  publish(
    draft: PlatformDraft,
    account: PlatformAccount,
    mode: PublishMode,
    options?: PublishOptions
  ): Promise<PublishResult>;

  /** Get status of published content (L4) */
  getStatus?(
    externalId: string,
    account: PlatformAccount
  ): Promise<PlatformStatusResult>;

  /** Get metrics for published content (L4) */
  getMetrics?(
    externalId: string,
    account: PlatformAccount
  ): Promise<PlatformMetricsResult>;

  /** Perform a dry run to check all preconditions */
  dryRun?(
    draft: PlatformDraft,
    account: PlatformAccount,
    mode: PublishMode
  ): Promise<DryRunReport>;

  /** Optional field mappings for this platform */
  fieldMappings?: FieldMapping[];

  /** Optional sub-adapters */
  auth?: AuthAdapter;
  assets?: AssetAdapter;
  status?: StatusAdapter;
  metrics?: MetricsAdapter;
}

/* ===== Adapter Capabilities (derived from manifest) ===== */

export interface AdapterCapabilities {
  supportsDraft: boolean;
  supportsDirectPublish: boolean;
  supportsAssistPublish: boolean;
  supportsSchedule: boolean;
  supportsCopy: boolean;
  supportsShare: boolean;
  supportsContainer: boolean;
  supportsSubmit: boolean;
  supportsStatusQuery: boolean;
  supportsMetrics: boolean;
  contentTypes: string[];
  publishLevels: string[];
}
