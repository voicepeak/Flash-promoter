import { useEffect, useMemo, useState } from "react";
import { Clock, Eye, FileText, ListChecks, PencilLine } from "lucide-react";
import type { PlatformDraft, PublishJob, PublishLog } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { api, type HistoryPost, type PostWorkflowStatus } from "../api/client.js";

const activeHistoryPlatforms = new Set(["mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist"]);
const systemPostIds = new Set(["llm_config", "safety_config", "platform_credentials"]);

type Props = {
  active?: boolean;
  onEditPost: (postId: string, contentType: "article" | "video") => void;
};

export function HistoryPage(props: Props) {
  const [posts, setPosts] = useState<HistoryPost[]>([]);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [viewPost, setViewPost] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [filter, setFilter] = useState<"all" | "article" | "video">("all");

  useEffect(() => {
    if (props.active) void load();
  }, [props.active]);

  async function load() {
    const [p, j, l] = await Promise.all([api.posts(), api.jobs(), api.logs()]);
    setPosts(p.posts);
    setJobs(j.jobs.filter((job) => activeHistoryPlatforms.has(job.platform)));
    setLogs(l.logs.filter((log) => activeHistoryPlatforms.has(log.platform)));
  }

  async function loadPostDrafts(postId: string) {
    setViewPost(postId);
    try {
      const result = await api.post(postId);
      setDrafts(result.drafts.filter((draft) => activeHistoryPlatforms.has(draft.platform)));
    } catch { setDrafts([]); }
  }

  const visiblePosts = posts.filter((post) => !systemPostIds.has(post.id));
  const filteredPosts = filter === "all" ? visiblePosts : visiblePosts.filter((post) => contentTypeOf(post) === filter);
  const selectedPost = useMemo(() => posts.find((post) => post.id === viewPost) ?? null, [posts, viewPost]);

  return (
    <div className="history-shell">
      <header className="wizard-header"><div><span className="eyebrow">记录</span><h1>发布记录</h1></div></header>

      <div className="filter-row" style={{ marginBottom: 16 }}>
        <span className="muted" style={{ marginRight: 10 }}>内容类型：</span>
        {(["all", "article", "video"] as const).map((f) => (
          <button key={f} type="button" className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "全部" : f === "article" ? "图文 / 推文" : "视频"}
          </button>
        ))}
      </div>

      <div className="history-grid">
        <section className="card">
          <h2><FileText size={16} /> 内容草稿</h2>
          <div className="compact-list">
            {filteredPosts.slice(0, 20).map((post) => {
              const workflow = workflowOf(post);
              const contentType = contentTypeOf(post);
              return (
                <div key={post.id} className={`compact-row history-record-row ${post.id === viewPost ? "active" : ""}`}>
                  <button type="button" className="history-row-main" onClick={() => loadPostDrafts(post.id)}>
                    <span>{post.title}</span>
                    <small>
                      <span className="history-content-type">{contentType === "video" ? "视频" : "图文"}</span>
                      <StatusPill tone={workflow.editState}>{workflow.editLabel}</StatusPill>
                      <StatusPill tone={workflow.publishState}>{workflow.publishLabel}</StatusPill>
                    </small>
                  </button>
                  <div className="history-row-actions">
                    <button type="button" onClick={() => loadPostDrafts(post.id)}><Eye size={14} /> 查看</button>
                    <button type="button" className="primary-button" onClick={() => props.onEditPost(post.id, contentType)}>
                      <PencilLine size={14} /> 继续编辑
                    </button>
                  </div>
                </div>
              );
            })}
            {!filteredPosts.length ? <p className="muted">暂无内容草稿</p> : null}
          </div>
        </section>
        <section className="card">
          <h2><ListChecks size={16} /> 发布任务</h2>
          <div className="compact-list">
            {jobs.slice(0, 20).map((job) => (
              <div key={job.id} className="compact-row">
                <span>{platformLabels[job.platform]}</span>
                <small><StatusPill tone={job.status}>{publishStatusLabel(job.status)}</StatusPill> · {job.mode}</small>
              </div>
            ))}
            {!jobs.length ? <p className="muted">暂无发布任务</p> : null}
          </div>
        </section>
        <section className="card">
          <h2><Clock size={16} /> 发布日志</h2>
          <div className="log-list">
            {logs.slice(0, 30).map((log) => (
              <div key={log.id} className={`log-row ${log.level}`}><span>{platformLabels[log.platform]}</span><p>{log.message}</p></div>
            ))}
            {!logs.length ? <p className="muted">暂无日志</p> : null}
          </div>
        </section>
      </div>
      {viewPost && drafts.length > 0 ? (
        <section className="card" style={{ marginTop: 16 }}>
          <div className="history-section-head">
            <h2>平台版本预览</h2>
            {selectedPost ? (
              <button type="button" className="primary-button" onClick={() => props.onEditPost(selectedPost.id, contentTypeOf(selectedPost))}>
                <PencilLine size={15} /> 继续编辑
              </button>
            ) : null}
          </div>
          <div className="drafts-preview-grid">
            {drafts.map((draft) => {
              const job = latestJobForDraft(draft.id, jobs);
              return (
                <div key={draft.id} className="draft-mini-card">
                  <strong>{platformLabels[draft.platform]}</strong>
                  <p>{draft.title}</p>
                  <div className="draft-status-row">
                    <StatusPill tone={draft.userConfirmed ? "edited" : "generated"}>{draft.userConfirmed ? "已编辑" : "待确认"}</StatusPill>
                    <StatusPill tone={job?.status ?? "not_published"}>{job ? publishStatusLabel(job.status) : "未发布"}</StatusPill>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusPill(props: { tone: string; children: string }) {
  return <span className={`history-status-pill ${statusTone(props.tone)}`}>{props.children}</span>;
}

function workflowOf(post: HistoryPost): PostWorkflowStatus {
  return post.workflowStatus ?? {
    editState: "empty",
    editLabel: "未生成",
    publishState: "not_published",
    publishLabel: "未发布"
  };
}

function contentTypeOf(post: HistoryPost): "article" | "video" {
  return post.contentType === "video" ? "video" : "article";
}

function latestJobForDraft(draftId: string, jobs: PublishJob[]): PublishJob | undefined {
  return jobs
    .filter((job) => job.draftId === draftId)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
}

function publishStatusLabel(status: string): string {
  switch (status) {
    case "pending":
    case "validating":
    case "asset_preparing":
    case "ready":
    case "reviewing":
      return "发布中";
    case "draft_created": return "已创建草稿";
    case "submitted": return "已提交";
    case "assist_opened": return "已打开辅助发布";
    case "share_opened": return "已打开分享";
    case "copied": return "已复制";
    case "simulated": return "已模拟";
    case "published": return "已发布";
    case "failed": return "发布失败";
    case "cancelled": return "已取消";
    default: return status;
  }
}

function statusTone(tone: string): string {
  if (tone === "edited" || tone === "published" || tone === "draft_created" || tone === "submitted") return "ok";
  if (tone === "generated" || tone === "done" || tone === "simulated" || tone === "assist_opened" || tone === "copied" || tone === "share_opened") return "info";
  if (tone === "failed" || tone === "cancelled") return "danger";
  if (tone === "publishing" || tone === "pending" || tone === "validating" || tone === "asset_preparing" || tone === "ready" || tone === "reviewing") return "warn";
  return "muted";
}
