import { ArrowRight, Upload, FileVideo } from "lucide-react";
import { useRef } from "react";

type Props = {
  videoFile: File | null;
  duration: string;
  resolution: string;
  onFileChange: (f: File | null) => void;
  onDurationChange: (v: string) => void;
  onResolutionChange: (v: string) => void;
  onNext: () => void;
  canNext: boolean;
};

export function VideoSelectStep(props: Props) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="step-panel">
      <h2>选择视频</h2>
      <p className="step-desc">选择要发布的视频文件。可以手动补填视频时长和分辨率。</p>

      <div className="video-dropzone" onClick={() => ref.current?.click()}>
        <input ref={ref} type="file" accept="video/*" style={{ display: "none" }}
          onChange={(e) => props.onFileChange(e.target.files?.[0] ?? null)} />
        {props.videoFile ? (
          <div className="video-file-info">
            <FileVideo size={28} />
            <div>
              <strong>{props.videoFile.name}</strong>
              <small>{formatSize(props.videoFile.size)} · {props.videoFile.type || "未知格式"}</small>
            </div>
            <button type="button" className="text-button" onClick={(e) => { e.stopPropagation(); props.onFileChange(null); }}>移除</button>
          </div>
        ) : (
          <div className="video-drop-hint">
            <Upload size={32} />
            <strong>点击选择视频文件</strong>
            <small>支持常见视频格式（MP4、MOV、AVI 等）</small>
          </div>
        )}
      </div>

      <div className="field-grid" style={{ marginTop: 16 }}>
        <label>
          <span>视频时长（可选）</span>
          <input placeholder="例如：3:25 或 205" value={props.duration} onChange={(e) => props.onDurationChange(e.target.value)} />
        </label>
        <label>
          <span>分辨率（可选）</span>
          <input placeholder="例如：1920×1080" value={props.resolution} onChange={(e) => props.onResolutionChange(e.target.value)} />
        </label>
      </div>

      <div className="step-actions">
        <button className="primary-button" type="button" disabled={!props.canNext} onClick={props.onNext}>
          下一步：填写信息 <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
