import type { PlatformId } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  selectedPlatforms: PlatformId[];
  busy: boolean;
};

export function StepGenerate(props: Props) {
  const [genIndex, setGenIndex] = useState(-1);

  useEffect(() => {
    if (!props.busy) return;
    setGenIndex(0);
  }, [props.busy]);

  useEffect(() => {
    if (genIndex < 0 || genIndex >= props.selectedPlatforms.length) return;
    const t = setTimeout(() => setGenIndex((i) => i + 1), 600);
    return () => clearTimeout(t);
  }, [genIndex, props.selectedPlatforms.length]);

  const total = props.selectedPlatforms.length;
  const current = props.busy ? Math.min(genIndex, total - 1) : total;

  return (
    <div className="step-panel">
      <h2>正在生成平台版本</h2>
      <p className="step-desc">系统正在根据原内容为每个平台生成适配版本，请稍候。</p>

      <div className="gen-progress">
        <div className="gen-bar-bg">
          <div className="gen-bar-fill" style={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }} />
        </div>
        <span className="gen-count">{current} / {total}</span>
      </div>

      <div className="gen-list">
        {props.selectedPlatforms.map((p, i) => (
          <div key={p} className={`gen-item ${i < genIndex ? "done" : i === genIndex ? "running" : ""}`}>
            {i < genIndex ? <span className="gen-check">✓</span> : i === genIndex ? <Loader2 size={16} className="spinner" /> : <span className="gen-dot" />}
            <span>{platformLabels[p]}</span>
            <small>{i < genIndex ? "已完成" : i === genIndex ? "生成中…" : "等待中"}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
