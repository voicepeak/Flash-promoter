import { Clock, Database, FileText, ListChecks } from "lucide-react";
import type { Asset, CanonicalPost, PublishJob, PublishLog } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";

type Props = {
  assets: Asset[];
  posts: Array<CanonicalPost & { status: string }>;
  currentPostId: string | null;
  jobs: PublishJob[];
  logs: PublishLog[];
  onLoadPost: (postId: string) => void;
};

export function RightPanel(props: Props) {
  return (
    <aside className="right-panel">
      <section>
        <h2>
          <FileText size={16} />
          内容草稿
        </h2>
        <div className="compact-list">
          {props.posts.slice(0, 8).map((post) => (
            <button
              type="button"
              key={post.id}
              className={`compact-row compact-button ${post.id === props.currentPostId ? "active" : ""}`}
              onClick={() => props.onLoadPost(post.id)}
            >
              <span>{post.title}</span>
              <small>{post.status}</small>
            </button>
          ))}
          {!props.posts.length ? <p className="muted">暂无本地草稿</p> : null}
        </div>
      </section>

      <section>
        <h2>
          <Database size={16} />
          资产
        </h2>
        <div className="compact-list">
          {props.assets.length ? (
            props.assets.map((asset) => (
              <div key={asset.id} className="compact-row">
                <span>{asset.filename ?? asset.id}</span>
                <small>{asset.mimeType ?? asset.type}</small>
              </div>
            ))
          ) : (
            <p className="muted">暂无资产</p>
          )}
        </div>
      </section>

      <section>
        <h2>
          <ListChecks size={16} />
          发布任务
        </h2>
        <div className="compact-list">
          {props.jobs.slice(0, 8).map((job) => (
            <div key={job.id} className="compact-row">
              <span>{platformLabels[job.platform]}</span>
              <small>{job.mode} · {job.status}</small>
            </div>
          ))}
          {!props.jobs.length ? <p className="muted">暂无任务</p> : null}
        </div>
      </section>

      <section>
        <h2>
          <Clock size={16} />
          发布日志
        </h2>
        <div className="log-list">
          {props.logs.slice(0, 12).map((log) => (
            <div key={log.id} className={`log-row ${log.level}`}>
              <span>{platformLabels[log.platform]}</span>
              <p>{log.message}</p>
            </div>
          ))}
          {!props.logs.length ? <p className="muted">暂无日志</p> : null}
        </div>
      </section>
    </aside>
  );
}
