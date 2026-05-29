import type { PlatformDraft } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Send } from "lucide-react";

type Props = { drafts: PlatformDraft[]; busy: boolean; onBack: () => void; onPublish: () => void; allValid: boolean };

export function VideoValidateStep(props: Props) {
  const errCount = props.drafts.filter((d) => d.validation && !d.validation.ok).length;
  return (
    <div className="step-panel">
      <h2>校验并发布</h2>
      <p className="step-desc">
        以下为各平台视频发布材料校验结果。确保所有平台通过校验后点击"模拟发布"。
        <br /><small className="muted">本阶段不真实上传视频，仅做模拟发布。</small>
      </p>
      <div className="validate-grid">
        {props.drafts.map((draft) => {
          const v = draft.validation;
          const status = !v ? "未校验" : v.ok ? (v.warnings.length ? "有警告" : "通过") : "有错误";
          const icon = !v ? <span className="v-dot" /> : v.ok ? (v.warnings.length ? <AlertTriangle size={18} color="#c7901e" /> : <CheckCircle2 size={18} color="#0e7c66" />) : <XCircle size={18} color="#b13b2e" />;
          return (
            <div key={draft.id} className={`validate-card ${!v ? "" : v.ok ? "v-ok" : "v-err"}`}>
              <div className="validate-card-top">{icon}<div><strong>{platformLabels[draft.platform]}</strong><small>{status}</small></div></div>
              {v?.errors.map((e) => <p key={e.code} className="v-issue err">{e.message}</p>)}
              {v?.warnings.map((w) => <p key={w.code} className="v-issue warn">{w.message}</p>)}
              {!v ? <p className="v-issue">尚未校验</p> : v.ok && !v.errors.length && !v.warnings.length ? <p className="v-issue ok">一切正常</p> : null}
            </div>
          );
        })}
      </div>
      <div className="step-actions">
        <button type="button" disabled={props.busy} onClick={props.onBack}><ArrowLeft size={17} /> 上一步</button>
        <button className="primary-button" type="button" disabled={props.busy || !props.allValid || errCount > 0} onClick={props.onPublish}>
          <Send size={17} /> 模拟发布
        </button>
      </div>
    </div>
  );
}
