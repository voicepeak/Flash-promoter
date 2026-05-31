import { useRef } from "react";
import { ArrowLeft, ArrowRight, Upload, FileVideo } from "lucide-react";

type Props = {
  videoFile: File | null; duration: string; resolution: string;
  onFileChange: (f: File | null) => void; onDurationChange: (v: string) => void; onResolutionChange: (v: string) => void;
  script: string; onScriptChange: (v: string) => void;
  onNext: () => void; onBack: () => void;
};

export function VideoInfoStep(props: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const canNext = (props.script.trim().length > 0 || props.videoFile !== null);

  return (
    <div className="step-panel">
      <h2>填写视频信息</h2>
      <p className="step-desc">选择视频文件，可选粘贴脚本或内容描述。AI 将通过截图帧识别视频画面内容，并基于选择的平台进行分析。</p>

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
        value={props.script} onChange={(e) => props.onScriptChange(e.target.value)}
        placeholder="粘贴视频脚本、字幕文本或内容描述…" />

      <div className="step-actions" style={{ marginTop: 16, border: 0, padding: 0 }}>
        <button type="button" onClick={props.onBack}><ArrowLeft size={17} /> 上一步</button>
        <button className="primary-button" type="button" disabled={!canNext} onClick={props.onNext}>确认并继续 <ArrowRight size={17} /></button>
      </div>
    </div>
  );
}

function formatSize(b: number): string { return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`; }
