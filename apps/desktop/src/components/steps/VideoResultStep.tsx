import type { PlatformDraft, PublishResult } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Info, RotateCcw, XCircle } from "lucide-react";

type Props = { drafts: PlatformDraft[]; results: Record<string, PublishResult>; onBackToEdit: () => void; onNewPost: () => void };

const platformLinks: Record<string, string> = {
  bilibili: "https://member.bilibili.com/platform/upload/video/frame",
  wechat: "https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzU3NTY2NzY2Ng==&action=showAlbum&album_id=0#wechat_redirect",
  "zhihu-assist": "https://www.zhihu.com/creator/content/answer",
  "xhs-assist": "https://creator.xiaohongshu.com/publish/publish"
};

const platformLinkLabels: Record<string, string> = {
  bilibili: "前往B站创作中心发布",
  wechat: "前往公众号草稿箱发布",
  "zhihu-assist": "前往知乎创作者中心发布",
  "xhs-assist": "前往小红书创作者中心发布"
};

const hints: Record<string, string> = {
  "invalid ip": "IP 不在白名单，请在平台后台添加本机出口 IP",
  "not in whitelist": "IP 白名单校验失败，请前往平台后台配置",
  "invalid media_id": "缺少封面图素材，请先在平台上传封面",
  "invalid credential": "凭证无效或已过期，请检查 Key/Token",
  "errcode": "接口返回错误，检查凭证和 IP 白名单",
  "timeout": "请求超时，请检查网络",
};

function getHint(msg: string): string | null {
  for (const [k, v] of Object.entries(hints)) { if (msg.toLowerCase().includes(k)) return v; }
  return null;
}

export function VideoResultStep(props: Props) {
  const failCount = Object.values(props.results).filter((r) => r?.status === "failed").length;
  const realCount = Object.values(props.results).filter((r) => (r?.raw as Record<string, unknown>)?.realApiCalled).length;

  return (
    <div className="step-panel">
      <h2>发布结果</h2>
      <p className="step-desc">{realCount > 0 ? `${realCount} 个平台真实发布` : "发布完成"}{failCount > 0 ? `，${failCount} 个失败` : ""}</p>
      <div className="results-grid">
        {props.drafts.map((draft) => {
          const result = props.results[draft.platform];
          const isReal = !!(result?.raw as Record<string, unknown>)?.realApiCalled;
          const ok = result?.status === "draft_created" || result?.status === "simulated" || result?.status === "assist_opened";
          const hint = result?.errorMessage ? getHint(result.errorMessage) : null;
          return (
            <div key={draft.id} className={`result-card ${ok ? "ok" : "err"}`}>
              <div className="result-top">{ok ? <CheckCircle2 size={20} color="#0e7c66" /> : <XCircle size={20} color="#b13b2e" />}<div><strong>{platformLabels[draft.platform]}</strong><small>{result?.status ?? ""}{isReal ? " · 真实 API" : ""}</small></div></div>
              <p className="result-title">{draft.title}</p>
              {result?.message && <p className="result-msg">{result.message}</p>}
              {platformLinks[draft.platform] && (
                <a href={platformLinks[draft.platform]} target="_blank" rel="noopener noreferrer" className="result-msg" style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <ExternalLink size={14} /> {platformLinkLabels[draft.platform] ?? "前往平台发布"}
                </a>
              )}
              {result?.errorMessage && (
                <div className="result-error-block">
                  <p className="result-msg err">{result.errorMessage}</p>
                  {hint && <p className="result-hint"><Info size={13} /> {hint}</p>}
                </div>
              )}
              <small className="muted">{result ? new Date(result.createdAt).toLocaleString() : ""}</small>
            </div>
          );
        })}
      </div>
      {failCount > 0 && (
        <div className="understand-missing" style={{ marginTop: 14 }}>
          <AlertTriangle size={16} /><div><strong>常见问题</strong><ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13 }}><li>检查凭证和 IP 白名单</li><li>检查已确认后再发布</li></ul></div></div>
      )}
      <div className="step-actions">
        <button type="button" onClick={props.onBackToEdit}><RotateCcw size={17} /> 返回编辑</button>
        <button className="primary-button" type="button" onClick={props.onNewPost}><FileText size={17} /> 新建下一篇内容</button>
      </div>
    </div>
  );
}
