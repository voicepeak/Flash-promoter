import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Asset,
  CanonicalPost,
  PlatformDraft,
  PlatformId,
  PublishJob,
  PublishLog,
  PublishMode,
  PublishResult,
  PublishStatus,
  ValidationResult
} from "@flash-promoter/core";
import { createId, now } from "@flash-promoter/core";
import { schemaSql } from "./schema.js";

type PostRow = {
  id: string;
  title: string;
  canonical_json: string;
  status: string;
  created_at: number;
  updated_at: number;
};

type DraftRow = {
  id: string;
  post_id: string;
  platform: PlatformId;
  draft_json: string;
  status: string;
  created_at: number;
  updated_at: number;
};

type JobRow = {
  id: string;
  post_id: string;
  platform: PlatformId;
  mode: PublishMode;
  status: PublishStatus;
  result_json: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
};

type LogRow = {
  id: string;
  job_id: string;
  platform: PlatformId;
  level: "info" | "warn" | "error";
  message: string;
  raw_json: string | null;
  created_at: number;
};

export class FlashPromoterRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(schemaSql);
  }

  createPost(post: CanonicalPost, status = "created"): CanonicalPost {
    this.db
      .prepare(
        "INSERT INTO posts (id, title, canonical_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(post.id, post.title, JSON.stringify(post), status, post.createdAt, post.updatedAt);

    for (const asset of post.assets) {
      this.upsertAsset({ ...asset, postId: post.id });
    }

    return post;
  }

  updatePost(post: CanonicalPost, status = "updated"): CanonicalPost {
    const updated = { ...post, updatedAt: now() };
    this.db
      .prepare("UPDATE posts SET title = ?, canonical_json = ?, status = ?, updated_at = ? WHERE id = ?")
      .run(updated.title, JSON.stringify(updated), status, updated.updatedAt, updated.id);
    return updated;
  }

  getPost(id: string): CanonicalPost | null {
    const row = this.db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as PostRow | undefined;
    return row ? (JSON.parse(row.canonical_json) as CanonicalPost) : null;
  }

  listPosts(): Array<CanonicalPost & { status: string }> {
    const rows = this.db
      .prepare("SELECT * FROM posts ORDER BY updated_at DESC LIMIT 100")
      .all() as PostRow[];
    return rows.map((row) => ({ ...(JSON.parse(row.canonical_json) as CanonicalPost), status: row.status }));
  }

  savePlatformDraft(draft: PlatformDraft, status = "ready"): PlatformDraft {
    this.db
      .prepare(
        `INSERT INTO platform_drafts (id, post_id, platform, draft_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           draft_json = excluded.draft_json,
           status = excluded.status,
           updated_at = excluded.updated_at`
      )
      .run(draft.id, draft.postId, draft.platform, JSON.stringify(draft), status, draft.createdAt, draft.updatedAt);

    return draft;
  }

  replacePlatformDrafts(postId: string, drafts: PlatformDraft[]): PlatformDraft[] {
    const remove = this.db.prepare("DELETE FROM platform_drafts WHERE post_id = ?");
    const save = this.db.prepare(
      `INSERT INTO platform_drafts (id, post_id, platform, draft_json, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    this.db.exec("BEGIN");
    try {
      remove.run(postId);
      for (const draft of drafts) {
        save.run(draft.id, draft.postId, draft.platform, JSON.stringify(draft), "ready", draft.createdAt, draft.updatedAt);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
    return drafts;
  }

  getPlatformDraft(id: string): PlatformDraft | null {
    const row = this.db.prepare("SELECT * FROM platform_drafts WHERE id = ?").get(id) as DraftRow | undefined;
    return row ? (JSON.parse(row.draft_json) as PlatformDraft) : null;
  }

  listPlatformDrafts(postId: string): PlatformDraft[] {
    const rows = this.db
      .prepare("SELECT * FROM platform_drafts WHERE post_id = ? ORDER BY created_at ASC")
      .all(postId) as DraftRow[];
    return rows.map((row) => JSON.parse(row.draft_json) as PlatformDraft);
  }

  updateDraftValidation(draftId: string, validation: ValidationResult): PlatformDraft | null {
    const draft = this.getPlatformDraft(draftId);
    if (!draft) {
      return null;
    }

    const updated: PlatformDraft = {
      ...draft,
      validation,
      updatedAt: now()
    };
    this.savePlatformDraft(updated, validation.ok ? "validated" : "validation_failed");
    return updated;
  }

  createPublishJob(input: {
    postId: string;
    draftId: string;
    platform: PlatformId;
    mode: PublishMode;
  }): PublishJob {
    const timestamp = now();
    const job: PublishJob = {
      id: createId("job"),
      postId: input.postId,
      draftId: input.draftId,
      platform: input.platform,
      mode: input.mode,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.db
      .prepare(
        "INSERT INTO publish_jobs (id, post_id, platform, mode, status, result_json, error_message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(job.id, job.postId, job.platform, job.mode, job.status, null, null, job.createdAt, job.updatedAt);

    return job;
  }

  updatePublishJob(jobId: string, status: PublishStatus, result?: PublishResult, errorMessage?: string): PublishJob | null {
    const timestamp = now();
    this.db
      .prepare("UPDATE publish_jobs SET status = ?, result_json = ?, error_message = ?, updated_at = ? WHERE id = ?")
      .run(status, result ? JSON.stringify(result) : null, errorMessage ?? null, timestamp, jobId);
    return this.getPublishJob(jobId);
  }

  getPublishJob(id: string): PublishJob | null {
    const row = this.db.prepare("SELECT * FROM publish_jobs WHERE id = ?").get(id) as JobRow | undefined;
    return row ? this.jobFromRow(row) : null;
  }

  listPublishJobs(limit = 100): PublishJob[] {
    const rows = this.db
      .prepare("SELECT * FROM publish_jobs ORDER BY updated_at DESC LIMIT ?")
      .all(limit) as JobRow[];
    return rows.map((row) => this.jobFromRow(row));
  }

  addPublishLog(log: Omit<PublishLog, "id" | "createdAt"> & { createdAt?: number }): PublishLog {
    const entry: PublishLog = {
      ...log,
      id: createId("log"),
      createdAt: log.createdAt ?? now()
    };

    this.db
      .prepare(
        "INSERT INTO publish_logs (id, job_id, platform, level, message, raw_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        entry.id,
        entry.jobId,
        entry.platform,
        entry.level,
        entry.message,
        entry.raw ? JSON.stringify(entry.raw) : null,
        entry.createdAt
      );

    return entry;
  }

  listPublishLogs(limit = 200): PublishLog[] {
    const rows = this.db
      .prepare("SELECT * FROM publish_logs ORDER BY created_at DESC LIMIT ?")
      .all(limit) as LogRow[];
    return rows.map((row) => ({
      id: row.id,
      jobId: row.job_id,
      platform: row.platform,
      level: row.level,
      message: row.message,
      raw: row.raw_json ? JSON.parse(row.raw_json) : undefined,
      createdAt: row.created_at
    }));
  }

  private upsertAsset(asset: Asset): void {
    this.db
      .prepare(
        `INSERT INTO assets (id, post_id, type, local_path, mime_type, size, width, height, duration, hash, platform_urls_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           post_id = excluded.post_id,
           local_path = excluded.local_path,
           mime_type = excluded.mime_type,
           size = excluded.size,
           width = excluded.width,
           height = excluded.height,
           duration = excluded.duration,
           hash = excluded.hash,
           platform_urls_json = excluded.platform_urls_json,
           updated_at = excluded.updated_at`
      )
      .run(
        asset.id,
        asset.postId ?? null,
        asset.type,
        asset.localPath ?? asset.dataUrl ?? null,
        asset.mimeType ?? null,
        asset.size ?? null,
        asset.width ?? null,
        asset.height ?? null,
        asset.duration ?? null,
        asset.hash ?? null,
        asset.platformUrls ? JSON.stringify(asset.platformUrls) : null,
        asset.createdAt,
        asset.updatedAt
      );
  }

  private jobFromRow(row: JobRow): PublishJob {
    return {
      id: row.id,
      postId: row.post_id,
      draftId: "",
      platform: row.platform,
      mode: row.mode,
      status: row.status,
      result: row.result_json ? (JSON.parse(row.result_json) as PublishResult) : undefined,
      errorMessage: row.error_message ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
