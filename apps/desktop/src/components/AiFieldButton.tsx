import { useState, useCallback, useEffect } from "react";
import type { AiActionResult, AiActionRequest, AiActionType, PlatformDraft } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { api } from "../api/client.js";
import { Sparkles, Loader2, Check, X, Wand2 } from "lucide-react";

type Props = {
  slotKey: string;
  fieldLabel: string;
  currentValue: string;
  contentType: "article" | "video";
  onApply: (value: string, mode: "replace" | "append") => void;
  // optional: when editing platform drafts
  draft?: PlatformDraft;
  // optional: when at input stage (no draft yet), provide raw context
  inputContext?: Record<string, unknown>;
};

const actionLabels: Record<string, string> = {
  generate: "生成", optimize: "优化", rewrite: "改写",
  shorten: "缩短", expand: "扩写", extract: "提取",
  generateAlternatives: "更多标题", generateFromText: "根据正文生成",
  riskCheck: "检查风险"
};

export function AiFieldButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions: AiActionType[] = [
    "generate", "optimize", "generateAlternatives",
    ...(props.slotKey === "title" ? ["shorten" as AiActionType] : []),
    ...(props.slotKey === "tags" || props.slotKey === "highlightsText" || props.slotKey === "hashtags" ? ["extract" as AiActionType] : []),
    ...(props.slotKey === "body" || props.slotKey === "script" ? ["rewrite" as AiActionType] : [])
  ];

  const doAction = useCallback(async (action: AiActionType) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const context = props.draft
        ? { title: props.draft.title, body: typeof props.draft.body === "string" ? props.draft.body : "", summary: props.draft.summary, tags: props.draft.tags, platform: platformLabels[props.draft.platform] }
        : (props.inputContext ?? {});
      const req: AiActionRequest = {
        contentId: props.draft?.postId ?? "input-stage",
        slotKey: props.slotKey, action,
        platform: props.draft?.platform,
        contentType: props.contentType, fieldLabel: props.fieldLabel,
        currentValue: props.currentValue,
        inputContext: context
      };
      const res = await api.aiAction(req);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI 调用失败");
    } finally { setLoading(false); }
  }, [props.currentValue, props.draft, props.slotKey, props.fieldLabel, props.contentType, props.inputContext]);

  useEffect(() => { if (!open) { setResult(null); setError(null); } }, [open]);

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button type="button" className="ai-field-trigger" onClick={() => setOpen(!open)} title={`AI ${props.fieldLabel}`}>
        <Wand2 size={14} />
      </button>
      {open && (
        <div className="ai-popover">
          <div className="ai-popover-header">
            <span>AI 辅助：{props.fieldLabel}</span>
            <button type="button" className="text-button" onClick={() => setOpen(false)}><X size={14} /></button>
          </div>
          {!result && !loading && (
            <div className="ai-popover-actions">
              {actions.map((a) => (
                <button key={a} type="button" className="ai-cmd-btn" onClick={() => doAction(a)}>
                  <Sparkles size={12} /> {actionLabels[a] ?? a}
                </button>
              ))}
            </div>
          )}
          {loading && <div className="ai-loading"><Loader2 size={16} className="spinner" /> 正在调用 AI…</div>}
          {error && <div className="ai-error">{error}</div>}
          {result && (
            <div className="ai-results">
              {result.candidates.map((c, i) => (
                <div key={i} className="ai-candidate">
                  <p>{c.slice(0, 500)}</p>
                  <div className="ai-candidate-actions">
                    <button type="button" className="primary-button" onClick={() => { props.onApply(c, "replace"); setOpen(false); }}><Check size={14} /> 替换</button>
                    <button type="button" onClick={() => { props.onApply(c, "append"); setOpen(false); }}>追加</button>
                  </div>
                </div>
              ))}
              <button type="button" className="text-button" style={{ marginTop: 6 }} onClick={() => setResult(null)}>返回操作菜单</button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
