import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ImageManager } from "../ImageManager.js";

type ImageItem = { id: string; dataUrl: string; filename: string; source: "upload" | "ai" };

type Props = {
  onConfirm: (body: string, images: ImageItem[]) => void;
};

export function StepInput(props: Props) {
  const [body, setBody] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  const canNext = body.trim().length > 10;

  return (
    <div className="step-panel">
      <h2>输入原稿</h2>
      <p className="step-desc">粘贴或输入原始正文，上传配图，然后选择平台进行 AI 润色和发布。</p>

      <textarea
        style={{ width: "100%", height: 320, fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, padding: 14 }}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="在此粘贴或输入你的原始内容…"
      />

      <ImageManager images={images} onImagesChange={setImages} />

      <div className="step-actions">
        <button className="primary-button" type="button" disabled={!canNext} onClick={() => props.onConfirm(body, images)}>
          下一步：选择平台 <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
