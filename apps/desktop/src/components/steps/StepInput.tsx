import { useState } from "react";
import { api } from "../../api/client.js";
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { AiFieldButton } from "../AiFieldButton.js";

type Analyzed = {
  title: string; summary: string; tags: string[]; keyPoints: string[];
  highlights: string[]; suggestedPlatforms: string[]; tone: string;
};

type Props = {
  onAnalyzed: (body: string, analyzed: Analyzed, tagsText: string) => void;
};

export function StepInput(props: Props) {
  const [body, setBody] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<Analyzed | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!body.trim()) return;
    setAnalyzing(true); setError(null);
    try {
      const res = await api.aiAction({
        contentId: "input-stage", action: "analyzeContent", contentType: "article",
        currentValue: body, slotKey: "body", fieldLabel: "内容分析",
        inputContext: {}
      });
      const json = tryParse(res.candidates[0] ?? "");
      if (json) {
        setAnalyzed({ title: String(json.title ?? ""), summary: String(json.summary ?? ""), tags: asStrings(json.tags), keyPoints: asStrings(json.keyPoints), highlights: asStrings(json.highlights), suggestedPlatforms: asStrings(json.suggestedPlatforms), tone: String(json.tone ?? "") });
      } else {
        setError("AI 返回格式异常，请重试");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败");
      setAnalyzed(null);
    } finally { setAnalyzing(false); }
  }

  function confirm() {
    if (!analyzed) return;
    props.onAnalyzed(body, analyzed, analyzed.tags.join(", "));
  }

  const canAnalyze = body.trim().length > 10;

  return (
    <div className="step-panel">
      <h2>输入原稿</h2>
      <p className="step-desc">粘贴或输入原始正文，点击「AI 分析」让系统自动提取标题、摘要、标签等信息。</p>

      <textarea
        style={{ width: "100%", height: 260, fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, padding: 14 }}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="在此粘贴或输入你的原始内容…"
      />

      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
        <button className="primary-button" type="button" disabled={!canAnalyze || analyzing} onClick={analyze}>
          {analyzing ? <Loader2 size={17} className="spinner" /> : <Sparkles size={17} />}
          {analyzing ? "正在分析…" : "AI 分析"}
        </button>
        {error && <span style={{ color: "var(--danger)", fontSize: 13 }}>{error}</span>}
        {analyzed && !analyzing && (
          <span style={{ color: "#0e7c66", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={14} /> 分析完成
          </span>
        )}
      </div>

      {analyzed && (
        <div className="analyze-result" style={{ marginTop: 18, padding: 18, border: "2px solid var(--accent)", borderRadius: 12, background: "#f6fcf9" }}>
          <h3 style={{ margin: "0 0 14px" }}>📋 AI 分析结果 — 请检查并编辑</h3>

          <div className="analyze-grid">
            <label>
              <span className="field-label-row">标题 <AiFieldButton slotKey="title" fieldLabel="标题" currentValue={analyzed.title} contentType="article" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, title: m === "append" ? `${analyzed.title} ${v}` : v })} inputContext={{ body }} /></span>
              <input value={analyzed.title} onChange={(e) => setAnalyzed({ ...analyzed, title: e.target.value })} />
            </label>
            <label>
              <span className="field-label-row">摘要 <AiFieldButton slotKey="summary" fieldLabel="摘要" currentValue={analyzed.summary} contentType="article" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, summary: m === "append" ? `${analyzed.summary} ${v}` : v })} inputContext={{ body, title: analyzed.title }} /></span>
              <input value={analyzed.summary} onChange={(e) => setAnalyzed({ ...analyzed, summary: e.target.value })} />
            </label>
            <label className="wide-field">
              <span className="field-label-row">标签 <AiFieldButton slotKey="tags" fieldLabel="标签" currentValue={analyzed.tags.join(", ")} contentType="article" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, tags: [...analyzed.tags, ...(m === "replace" ? v.split(/[,，\n]/).map((s: string) => s.trim()).filter(Boolean) : [v])] })} inputContext={{ body, title: analyzed.title }} /></span>
              <input value={analyzed.tags.join(", ")} onChange={(e) => setAnalyzed({ ...analyzed, tags: e.target.value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean) })} />
            </label>
          </div>

          {analyzed.keyPoints.length > 0 && (
            <div style={{ marginTop: 12, padding: "10px 0 0", borderTop: "1px solid var(--line)" }}>
              <strong style={{ fontSize: 13, color: "var(--muted)" }}>核心观点</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{analyzed.keyPoints.map((p, i) => <li key={i} style={{ fontSize: 14 }}>{p}</li>)}</ul>
            </div>
          )}
          {analyzed.highlights.length > 0 && (
            <div style={{ marginTop: 8, padding: "10px 0 0", borderTop: "1px solid var(--line)" }}>
              <strong style={{ fontSize: 13, color: "var(--muted)" }}>亮点句</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{analyzed.highlights.map((h, i) => <li key={i} style={{ fontSize: 14 }}>{h}</li>)}</ul>
            </div>
          )}
          {analyzed.tone && (
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>风格：{analyzed.tone}</div>
          )}

          <div className="step-actions" style={{ marginTop: 16, border: 0, padding: 0 }}>
            <button className="primary-button" type="button" onClick={confirm}>
              确认并继续 <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function tryParse(raw: string): Record<string, unknown> | null {
  try { const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim(); return JSON.parse(cleaned) as Record<string, unknown>; }
  catch { return null; }
}
function asStrings(v: unknown): string[] { return Array.isArray(v) ? v.map(String) : []; }
