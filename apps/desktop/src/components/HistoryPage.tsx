import { useEffect, useState } from "react";
import { Clock, FileText, ListChecks } from "lucide-react";
import type { CanonicalPost, PlatformDraft, PublishJob, PublishLog } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { api } from "../api/client.js";

export function HistoryPage() {
  const [posts, setPosts] = useState<Array<CanonicalPost & { status: string }>>([]);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [viewPost, setViewPost] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [p, j, l] = await Promise.all([api.posts(), api.jobs(), api.logs()]);
    setPosts(p.posts);
    setJobs(j.jobs);
    setLogs(l.logs);
  }

  async function loadPostDrafts(postId: string) {
    setViewPost(postId);
    try {
      const result = await api.post(postId);
      setDrafts(result.drafts);
    } catch { setDrafts([]); }
  }

  return (
    <div className="history-shell">
      <header className="wizard-header">
        <div>
          <span className="eyebrow">记录</span>
          <h1>发布记录</h1>
        </div>
      </header>

      <div className="history-grid">
        <section className="card">
          <h2><FileText size={16} /> 内容草稿</h2>
          <div className="compact-list">
            {posts.slice(0, 20).map((post) => (
              <button key={post.id} type="button" className={`compact-row compact-button ${post.id === viewPost ? "active" : ""}`} onClick={() => loadPostDrafts(post.id)}>
                <span>{post.title}</span>
                <small>{post.status}</small>
              </button>
            ))}
            {!posts.length ? <p className="muted">暂无内容草稿</p> : null}
          </div>
        </section>

        <section className="card">
          <h2><ListChecks size={16} /> 发布任务</h2>
          <div className="compact-list">
            {jobs.slice(0, 20).map((job) => (
              <div key={job.id} className="compact-row">
                <span>{platformLabels[job.platform]}</span>
                <small>{job.mode} · {job.status}</small>
              </div>
            ))}
            {!jobs.length ? <p className="muted">暂无发布任务</p> : null}
          </div>
        </section>

        <section className="card">
          <h2><Clock size={16} /> 发布日志</h2>
          <div className="log-list">
            {logs.slice(0, 30).map((log) => (
              <div key={log.id} className={`log-row ${log.level}`}>
                <span>{platformLabels[log.platform]}</span>
                <p>{log.message}</p>
              </div>
            ))}
            {!logs.length ? <p className="muted">暂无日志</p> : null}
          </div>
        </section>
      </div>

      {viewPost && drafts.length > 0 ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>平台版本预览</h2>
          <div className="drafts-preview-grid">
            {drafts.map((d) => (
              <div key={d.id} className="draft-mini-card">
                <strong>{platformLabels[d.platform]}</strong>
                <p>{d.title}</p>
                <small>{d.userConfirmed ? "已确认" : "未确认"}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
