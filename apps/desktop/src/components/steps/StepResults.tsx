import type { PlatformDraft, PublishResult } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Info, RotateCcw, XCircle } from "lucide-react";

type Props = {
  drafts: PlatformDraft[];
  results: Record<string, PublishResult>;
  onBackToEdit: () => void;
  onNewPost: () => void;
};

const errorHints: Record<string, string> = {
  "invalid ip": "当前 IP 不在平台的 IP 白名单中。请在平台后台「基本配置」→「IP 白名单」中添加本机出口 IP。",
  "not in whitelist": "IP 白名单校验失败。请前往平台后台添加当前 IP 到白名单。",
  "invalid media_id": "缺少封面图素材。请先在平台素材库中上传一张封面图，或将图片转为 platformAssetId。",
  "invalid credential": "平台凭证无效或已过期。请检查 AppID/AppSecret 是否正确。",
  "draft_confirmation_required": "内容未确认。请返回编辑确认步骤，点击每个平台的「确认当前平台」按钮。",
  "publish_confirmation_required": "真实发布需要二次确认。",
  "errcode": "微信接口返回错误，请检查 AppID/AppSecret 是否正确、IP 是否在白名单中。",
  "ECONNREFUSED": "无法连接平台服务器，请检查网络或 Base URL 配置。",
  "timeout": "请求超时，平台 API 响应过慢或网络不通。",
  "401": "认证失败，凭证无效或已过期。",
  "403": "无权限访问该接口，请检查平台授权范围。",
  "404": "接口地址不存在，请检查 Base URL 配置。"
};

function getHint(msg: string): string | null {
  const lower = msg.toLowerCase();
  for (const [key, hint] of Object.entries(errorHints)) {
    if (lower.includes(key.toLowerCase())) return hint;
  }
  return null;
}

export function StepResults(props: Props) {
  const okCount = Object.values(props.results).filter((r) => r?.status === "draft_created" || r?.status === "simulated").length;
  const failCount = Object.values(props.results).filter((r) => r?.status === "failed").length;
  const realCount = Object.values(props.results).filter((r) => (r?.raw as Record<string, unknown>)?.realApiCalled).length;

  return (
    <div className="step-panel">
      <h2>发布结果</h2>
      <p className="step-desc">
        {realCount > 0 ? `${realCount} 个平台已执行真实发布` : "发布完成"}
        {failCount > 0 ? `，${failCount} 个失败` : ""}
        {okCount > 0 && failCount === 0 ? "，全部成功" : ""}
      </p>

      <div className="results-grid">
        {props.drafts.map((draft) => {
          const result = props.results[draft.platform];
          const raw = result?.raw as Record<string, unknown> | undefined;
          const isReal = !!raw?.realApiCalled;
          const ok = result?.status === "draft_created" || result?.status === "simulated" || result?.status === "assist_opened";
          const hint = result?.errorMessage ? getHint(result.errorMessage) : null;
          return (
            <div key={draft.id} className={`result-card ${ok ? "ok" : "err"}`}>
              <div className="result-top">
                {ok ? <CheckCircle2 size={20} color="#0e7c66" /> : <XCircle size={20} color="#b13b2e" />}
                <div>
                  <strong>{platformLabels[draft.platform]}</strong>
                  <small>
                    {result?.status ?? "未执行"}
                    {isReal ? " · 真实 API" : ok ? "" : " · 失败"}
                  </small>
                </div>
              </div>
              <p className="result-title">{draft.title}</p>
              {result?.message && <p className="result-msg">{result.message}</p>}
              {result?.errorMessage && (
                <div className="result-error-block">
                  <p className="result-msg err">{result.errorMessage}</p>
                  {hint && (
                    <p className="result-hint"><Info size={13} /> {hint}</p>
                  )}
                </div>
              )}
              <small className="muted">{result ? new Date(result.createdAt).toLocaleString() : ""}</small>
            </div>
          );
        })}
      </div>

      {failCount > 0 && (
        <div className="understand-missing" style={{ marginTop: 14 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>常见问题排查</strong>
            <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13 }}>
              <li>IP 白名单：确认本机出口 IP 已加入平台后台白名单</li>
              <li>凭证检查：确认 AppID/AppSecret（或 Key/Token）正确且未过期</li>
              <li>权限范围：确认平台应用已获得内容发布相关权限</li>
              <li>已确认：返回编辑步骤点击「确认当前平台」后重试</li>
            </ul>
          </div>
        </div>
      )}

      <div className="step-actions">
        <button type="button" onClick={props.onBackToEdit}><RotateCcw size={17} /> 返回编辑</button>
        <button className="primary-button" type="button" onClick={props.onNewPost}><FileText size={17} /> 新建下一篇内容</button>
      </div>
    </div>
  );
}
