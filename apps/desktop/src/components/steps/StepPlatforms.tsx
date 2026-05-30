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

const platformInfo: { id: PlatformId; name: string; desc: string; modeLabel: string }[] = [
  { id: "wechat", name: "微信公众号", desc: "适合长文内容，支持封面文案生成", modeLabel: "生成草稿" },
  { id: "bilibili", name: "B站", desc: "视频或专栏标题、分区建议和标签", modeLabel: "模拟发布" },
  { id: "zhihu-assist", name: "知乎", desc: "问答风格，自动匹配话题标签", modeLabel: "辅助发布" },
  { id: "xhs-assist", name: "小红书", desc: "笔记正文、话题标签和图文卡片", modeLabel: "辅助发布" },
  { id: "wordpress", name: "WordPress", desc: "博客文章，REST API 创建草稿/发布", modeLabel: "创建草稿" }
];

export function StepPlatforms(props: Props) {
  const count = props.selected.length;

  return (
    <div className="step-panel">
      <h2>选择平台</h2>
      <p className="step-desc">选择需要生成适配版本的平台，可多选。已选择 {count} 个平台。</p>

      <div className="platform-grid">
        {platformInfo.map((p) => {
          const isSelected = props.selected.includes(p.id);
          return (
            <div key={p.id} className={`platform-card ${isSelected ? "selected" : ""}`} onClick={() => !props.busy && props.onToggle(p.id)}>
              <div className="platform-card-top">
                <div className="platform-toggle">
                  <span className={`toggle-dot ${isSelected ? "on" : ""}`} />
                </div>
                <h3>{p.name}</h3>
              </div>
              <p>{p.desc}</p>
              <span className="platform-mode">{p.modeLabel}</span>
            </div>
          );
        })}
      </div>

      <div className="step-actions">
        <button type="button" disabled={props.busy} onClick={props.onBack}>
          <ArrowLeft size={17} /> 上一步
        </button>
        <button className="primary-button" type="button" disabled={props.busy || !props.canNext} onClick={props.onGenerate}>
          <Sparkles size={17} /> 生成平台版本
        </button>
      </div>
    </div>
  );
}
