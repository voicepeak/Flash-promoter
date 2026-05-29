import { FileText, Video } from "lucide-react";
import { useState } from "react";

type Props = {
  onSelect: (type: "article" | "video") => void;
};

export function ContentTypeStep({ onSelect }: Props) {
  const [choice, setChoice] = useState<"article" | "video" | null>(null);

  return (
    <div className="step-panel">
      <h2>选择内容类型</h2>
      <p className="step-desc">请选择你要发布的内容类型，不同内容类型将进入不同的发布流程。</p>

      <div className="type-grid">
        <div
          className={`type-card ${choice === "article" ? "selected" : ""}`}
          onClick={() => { setChoice("article"); onSelect("article"); }}
        >
          <div className="type-card-icon"><FileText size={32} /></div>
          <h3>图文 / 推文</h3>
          <p>适合公众号文章、知乎回答、小红书图文笔记、B站专栏等内容。</p>
          <span className="type-card-badge">经典流程</span>
        </div>

        <div
          className={`type-card ${choice === "video" ? "selected" : ""}`}
          onClick={() => { setChoice("video"); onSelect("video"); }}
        >
          <div className="type-card-icon"><Video size={32} /></div>
          <h3>视频</h3>
          <p>适合 B站视频、小红书视频、知乎视频回答、公众号视频介绍等内容。</p>
          <span className="type-card-badge">新流程</span>
        </div>
      </div>
    </div>
  );
}
