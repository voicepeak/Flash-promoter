import type { PlatformId } from "@flash-promoter/core";
import { ArrowLeft, Sparkles } from "lucide-react";

type Props = {
  selected: PlatformId[];
  onToggle: (platform: PlatformId) => void;
  onBack: () => void;
  onGenerate: () => void;
  busy: boolean;
  canNext: boolean;
};

const videoPlatforms: { id: PlatformId; name: string; desc: string; modeLabel: string }[] = [
  { id: "bilibili", name: "B站", desc: "视频标题、简介、分区建议、置顶评论和时间轴", modeLabel: "生成视频投稿材料" },
  { id: "xhs-assist", name: "小红书", desc: "短视频标题、文案、话题标签和首评建议", modeLabel: "生成短视频笔记文案" },
  { id: "zhihu-assist", name: "知乎", desc: "视频回答标题、导语、说明文案和话题", modeLabel: "生成视频回答材料" },
  { id: "wechat", name: "公众号", desc: "视频介绍图文、摘要、正文和封面文案", modeLabel: "生成视频介绍图文" }
];

export function VideoPlatformSelectStep(props: Props) {
  const count = props.selected.length;
  return (
    <div className="step-panel">
      <h2>选择平台</h2>
      <p className="step-desc">选择视频的目标发布平台，已选择 {count} 个平台。默认选中 B站和小红书。</p>
      <div className="platform-grid">
        {videoPlatforms.map((p) => {
          const isSelected = props.selected.includes(p.id);
          return (
            <div key={p.id} className={`platform-card ${isSelected ? "selected" : ""}`} onClick={() => !props.busy && props.onToggle(p.id)}>
              <div className="platform-card-top">
                <div className="platform-toggle"><span className={`toggle-dot ${isSelected ? "on" : ""}`} /></div>
                <h3>{p.name}</h3>
              </div>
              <p>{p.desc}</p>
              <span className="platform-mode">{p.modeLabel}</span>
            </div>
          );
        })}
      </div>
      <div className="step-actions">
        <button type="button" disabled={props.busy} onClick={props.onBack}><ArrowLeft size={17} /> 上一步</button>
        <button className="primary-button" type="button" disabled={props.busy || !props.canNext} onClick={props.onGenerate}>
          <Sparkles size={17} /> 生成视频发布材料
        </button>
      </div>
    </div>
  );
}
