import type { PlatformId } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = { selectedPlatforms: PlatformId[]; busy: boolean };

export function VideoGenerateStep(props: Props) {
  const [idx, setIdx] = useState(-1);
  useEffect(() => { if (props.busy) setIdx(0); }, [props.busy]);
  useEffect(() => {
    if (idx < 0 || idx >= props.selectedPlatforms.length) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 600);
    return () => clearTimeout(t);
  }, [idx, props.selectedPlatforms.length]);

  const total = props.selectedPlatforms.length;
  const current = props.busy ? Math.min(idx, total - 1) : total;

  return (
    <div className="step-panel">
      <h2>正在生成视频发布材料</h2>
      <p className="step-desc">系统正在为各平台生成视频发布材料，包括标题、简介、标签、封面文案等。</p>
      <div className="gen-progress">
        <div className="gen-bar-bg"><div className="gen-bar-fill" style={{ width: `${total ? (current / total) * 100 : 0}%` }} /></div>
        <span className="gen-count">{current} / {total}</span>
      </div>
      <div className="gen-list">
        {props.selectedPlatforms.map((p, i) => (
          <div key={p} className={`gen-item ${i < idx ? "done" : i === idx ? "running" : ""}`}>
            {i < idx ? <span className="gen-check">✓</span> : i === idx ? <Loader2 size={16} className="spinner" /> : <span className="gen-dot" />}
            <span>{platformLabels[p]}</span>
            <small>{i < idx ? "已完成" : i === idx ? "生成中…" : "等待中"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
