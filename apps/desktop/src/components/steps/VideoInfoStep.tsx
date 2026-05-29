import { videoStyleLabels } from "@flash-promoter/core";
import type { VideoStyle } from "@flash-promoter/core";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  title: string; topic: string; summary: string; style: string;
  script: string; transcript: string; highlightsText: string; tagsText: string;
  busy: boolean;
  onTitleChange: (v: string) => void; onTopicChange: (v: string) => void; onSummaryChange: (v: string) => void;
  onStyleChange: (v: string) => void; onScriptChange: (v: string) => void; onTranscriptChange: (v: string) => void;
  onHighlightsChange: (v: string) => void; onTagsChange: (v: string) => void;
  onBack: () => void; onNext: () => void; canNext: boolean;
};

export function VideoInfoStep(props: Props) {
  const titleHint = !props.title.trim() ? "请填写视频标题" : "";
  const topicHint = !props.topic.trim() ? "请填写视频主题" : "";

  return (
    <div className="step-panel">
      <h2>填写视频信息</h2>
      <p className="step-desc">填写视频的标题、主题和详细信息，系统将基于这些信息生成各平台发布材料。</p>

      <div className="field-grid">
        <label><span>视频标题 *</span>
          <input value={props.title} onChange={(e) => props.onTitleChange(e.target.value)} placeholder="输入视频标题" />
          {titleHint ? <small className="field-hint">{titleHint}</small> : null}
        </label>
        <label><span>视频主题 *</span>
          <input value={props.topic} onChange={(e) => props.onTopicChange(e.target.value)} placeholder="视频的核心主题" />
          {topicHint ? <small className="field-hint">{topicHint}</small> : null}
        </label>
        <label className="wide-field"><span>视频简介</span>
          <input value={props.summary} onChange={(e) => props.onSummaryChange(e.target.value)} placeholder="简要描述视频内容" />
        </label>
        <label><span>风格</span>
          <select value={props.style} onChange={(e) => props.onStyleChange(e.target.value)}>
            {(Object.keys(videoStyleLabels) as VideoStyle[]).map((s) => (
              <option key={s} value={s}>{videoStyleLabels[s]}</option>
            ))}
          </select>
        </label>
        <label><span>标签（逗号分隔）</span>
          <input value={props.tagsText} onChange={(e) => props.onTagsChange(e.target.value)} placeholder="例如：教程, 技术, AI" />
        </label>
        <label className="wide-field"><span>视频脚本（可选）</span>
          <textarea style={{ height: 120 }} value={props.script} onChange={(e) => props.onScriptChange(e.target.value)} placeholder="视频脚本内容…" />
        </label>
        <label className="wide-field"><span>字幕文本（可选）</span>
          <textarea style={{ height: 100 }} value={props.transcript} onChange={(e) => props.onTranscriptChange(e.target.value)} placeholder="字幕或解说文本…" />
        </label>
        <label className="wide-field"><span>主要看点（逗号分隔，可选）</span>
          <input value={props.highlightsText} onChange={(e) => props.onHighlightsChange(e.target.value)} placeholder="例如：核心功能介绍, 实战演示, 常见问题解答" />
        </label>
      </div>

      <div className="step-actions">
        <button type="button" disabled={props.busy} onClick={props.onBack}><ArrowLeft size={17} /> 上一步</button>
        <button className="primary-button" type="button" disabled={props.busy || !props.canNext} onClick={props.onNext}>
          下一步：选择平台 <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
