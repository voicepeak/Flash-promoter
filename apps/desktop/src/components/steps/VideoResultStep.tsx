import type { PlatformDraft, PublishResult } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { CheckCircle2, FileText, RotateCcw, XCircle } from "lucide-react";

type Props = { drafts: PlatformDraft[]; results: Record<string, PublishResult>; onBackToEdit: () => void; onNewPost: () => void };

export function VideoResultStep(props: Props) {
  return (
    <div className="step-panel">
      <h2>发布结果</h2>
      <p className="step-desc">
        以下为本次视频模拟发布结果。
        <br /><small className="muted">本次为视频模拟发布，未调用真实平台接口，未真实上传视频。</small>
      </p>
      <div className="results-grid">
        {props.drafts.map((draft) => {
          const result = props.results[draft.platform];
          const ok = result?.status === "simulated" || result?.status === "draft_created" || result?.status === "assist_opened";
          return (
            <div key={draft.id} className={`result-card ${ok ? "ok" : "err"}`}>
              <div className="result-top">{ok ? <CheckCircle2 size={20} color="#0e7c66" /> : <XCircle size={20} color="#b13b2e" />}<div><strong>{platformLabels[draft.platform]}</strong><small>{result?.status ?? "未执行"}</small></div></div>
              <p className="result-title">{draft.title}</p>
              {result?.message ? <p className="result-msg">{result.message}</p> : null}
              {result?.errorMessage ? <p className="result-msg err">{result.errorMessage}</p> : null}
              <small className="muted">{result ? new Date(result.createdAt).toLocaleString() : ""}</small>
            </div>
          );
        })}
      </div>
      <div className="step-actions">
        <button type="button" onClick={props.onBackToEdit}><RotateCcw size={17} /> 返回编辑</button>
        <button className="primary-button" type="button" onClick={props.onNewPost}><FileText size={17} /> 新建下一篇内容</button>
      </div>
    </div>
  );
}
