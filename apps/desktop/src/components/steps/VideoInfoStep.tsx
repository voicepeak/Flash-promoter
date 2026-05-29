import { useState, useRef } from "react";
import { videoStyleLabels } from "@flash-promoter/core";
import type { VideoStyle } from "@flash-promoter/core";
import { api } from "../../api/client.js";
import { Sparkles, Loader2, ArrowLeft, ArrowRight, CheckCircle2, Upload, FileVideo } from "lucide-react";
import { AiFieldButton } from "../AiFieldButton.js";

type AnalyzedVideo = {
  title: string; topic: string; summary: string; tags: string[];
  highlights: string[]; style: string; audience: string;
};

type Props = {
  videoFile: File | null; duration: string; resolution: string;
  onFileChange: (f: File | null) => void; onDurationChange: (v: string) => void; onResolutionChange: (v: string) => void;
  onAnalyzed: (title: string, topic: string, summary: string, tags: string[], highlights: string[], style: string, script: string, tagsText: string) => void;
  onBack: () => void;
};

export function VideoInfoStep(props: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [script, setScript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<AnalyzedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    const text = script.trim();
    if (!text && !props.videoFile) return;
    setAnalyzing(true); setError(null);
    try {
      const res = await api.aiAction({
        contentId: "input-stage", action: "analyzeContent", contentType: "video",
        currentValue: text || `视频文件：${props.videoFile?.name ?? "未知"}\n时长：${props.duration}\n分辨率：${props.resolution}`,
        slotKey: "video", fieldLabel: "视频分析", inputContext: {}
      });
      const json = tryParse(res.candidates[0] ?? "");
      if (json) {
        setAnalyzed({ title: String(json.title ?? ""), topic: String(json.topic ?? ""), summary: String(json.summary ?? ""), tags: asStrs(json.tags), highlights: asStrs(json.highlights), style: String(json.style ?? "knowledge"), audience: String(json.audience ?? "") });
      } else {
        setError("AI 返回格式异常，请重试");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败"); setAnalyzed(null);
    } finally { setAnalyzing(false); }
  }

  function confirm() {
    if (!analyzed) return;
    props.onAnalyzed(analyzed.title, analyzed.topic, analyzed.summary, analyzed.tags, analyzed.highlights, analyzed.style, script, analyzed.tags.join(", "));
  }

  const canAnalyze = script.trim().length > 5 || props.videoFile !== null;

  return (
    <div className="step-panel">
      <h2>填写视频信息</h2>
      <p className="step-desc">选择视频文件，粘贴脚本或说明文字，点击「AI 分析」让系统提取视频元数据。</p>

      <div className="video-dropzone" style={{ marginBottom: 14 }} onClick={() => ref.current?.click()}>
        <input ref={ref} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => props.onFileChange(e.target.files?.[0] ?? null)} />
        {props.videoFile ? (
          <div className="video-file-info"><FileVideo size={28} /><div><strong>{props.videoFile.name}</strong><small>{formatSize(props.videoFile.size)} · {props.videoFile.type || "未知格式"}</small></div><button type="button" className="text-button" onClick={(e) => { e.stopPropagation(); props.onFileChange(null); }}>移除</button></div>
        ) : (
          <div className="video-drop-hint"><Upload size={32} /><strong>点击选择视频文件</strong><small>支持 MP4、MOV 等格式</small></div>
        )}
      </div>

      <div className="field-grid" style={{ marginBottom: 14 }}>
        <label><span>时长（可选）</span><input value={props.duration} onChange={(e) => props.onDurationChange(e.target.value)} placeholder="3:25" /></label>
        <label><span>分辨率（可选）</span><input value={props.resolution} onChange={(e) => props.onResolutionChange(e.target.value)} placeholder="1920×1080" /></label>
      </div>

      <textarea style={{ width: "100%", height: 200, fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, padding: 14 }}
        value={script} onChange={(e) => setScript(e.target.value)}
        placeholder="粘贴视频脚本、字幕文本或内容描述…" />

      <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
        <button className="primary-button" type="button" disabled={!canAnalyze || analyzing} onClick={analyze}>
          {analyzing ? <Loader2 size={17} className="spinner" /> : <Sparkles size={17} />}
          {analyzing ? "正在分析…" : "AI 分析"}
        </button>
        {error && <span style={{ color: "var(--danger)", fontSize: 13 }}>{error}</span>}
        {analyzed && !analyzing && <span style={{ color: "#0e7c66", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={14} /> 分析完成</span>}
      </div>

      {analyzed && (
        <div className="analyze-result" style={{ marginTop: 18, padding: 18, border: "2px solid var(--accent)", borderRadius: 12, background: "#f6fcf9" }}>
          <h3 style={{ margin: "0 0 14px" }}>📋 AI 分析结果 — 请检查并编辑</h3>
          <div className="analyze-grid">
            <label><span className="field-label-row">视频标题 <AiFieldButton slotKey="title" fieldLabel="标题" currentValue={analyzed.title} contentType="video" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, title: m === "append" ? `${analyzed.title} ${v}` : v })} inputContext={{ script }} /></span><input value={analyzed.title} onChange={(e) => setAnalyzed({ ...analyzed, title: e.target.value })} /></label>
            <label><span className="field-label-row">视频主题 <AiFieldButton slotKey="topic" fieldLabel="主题" currentValue={analyzed.topic} contentType="video" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, topic: m === "append" ? `${analyzed.topic} ${v}` : v })} inputContext={{ script }} /></span><input value={analyzed.topic} onChange={(e) => setAnalyzed({ ...analyzed, topic: e.target.value })} /></label>
            <label className="wide-field"><span className="field-label-row">简介 <AiFieldButton slotKey="summary" fieldLabel="简介" currentValue={analyzed.summary} contentType="video" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, summary: m === "append" ? `${analyzed.summary} ${v}` : v })} inputContext={{ script }} /></span><input value={analyzed.summary} onChange={(e) => setAnalyzed({ ...analyzed, summary: e.target.value })} /></label>
            <label><span className="field-label-row">标签 <AiFieldButton slotKey="tags" fieldLabel="标签" currentValue={analyzed.tags.join(", ")} contentType="video" onApply={(v: string, m: string) => setAnalyzed({ ...analyzed, tags: [...analyzed.tags, ...(m === "replace" ? v.split(/[,，\n]/).map((s: string) => s.trim()).filter(Boolean) : [v])] })} inputContext={{ script }} /></span><input value={analyzed.tags.join(", ")} onChange={(e) => setAnalyzed({ ...analyzed, tags: e.target.value.split(/[,，\n]/).map((s: string) => s.trim()).filter(Boolean) })} /></label>
            <label><span>风格</span><select value={analyzed.style} onChange={(e) => setAnalyzed({ ...analyzed, style: e.target.value })}>{(Object.keys(videoStyleLabels) as VideoStyle[]).map((s) => <option key={s} value={s}>{videoStyleLabels[s]}</option>)}</select></label>
          </div>
          {analyzed.highlights.length > 0 && <div style={{ marginTop: 12, padding: "10px 0 0", borderTop: "1px solid var(--line)" }}><strong style={{ fontSize: 13, color: "var(--muted)" }}>主要看点</strong><ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{analyzed.highlights.map((h, i) => <li key={i} style={{ fontSize: 14 }}>{h}</li>)}</ul></div>}
          <div className="step-actions" style={{ marginTop: 16, border: 0, padding: 0 }}>
            <button type="button" onClick={props.onBack}><ArrowLeft size={17} /> 上一步</button>
            <button className="primary-button" type="button" onClick={confirm}>确认并继续 <ArrowRight size={17} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function tryParse(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()) as Record<string, unknown>; } catch { return null; }
}
function asStrs(v: unknown): string[] { return Array.isArray(v) ? v.map(String) : []; }
function formatSize(b: number): string { return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`; }
