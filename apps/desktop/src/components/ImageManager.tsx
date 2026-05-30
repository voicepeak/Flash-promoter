import { useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Trash2, Upload, X } from "lucide-react";
import { api } from "../api/client.js";

type ImageItem = { id: string; dataUrl: string; filename: string; source: "upload" | "ai" };

type Props = {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
};

export function ImageManager({ images, onImagesChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [genPrompt, setGenPrompt] = useState("");
  const [genSize, setGenSize] = useState("1024x1024");
  const [genCount, setGenCount] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showGen, setShowGen] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(file);
      next.push({ id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, dataUrl, filename: file.name, source: "upload" });
    }
    if (next.length) onImagesChange([...images, ...next]);
  }

  async function generate() {
    if (!genPrompt.trim()) return;
    setGenerating(true); setGenError(null);
    try {
      const res = await api.generateImage(genPrompt, genCount, genSize);
      const newImages: ImageItem[] = (res.images ?? []).map((img: { url?: string; b64Json?: string }, i: number) => ({
        id: `ai_${Date.now()}_${i}`,
        dataUrl: img.url ?? `data:image/png;base64,${img.b64Json ?? ""}`,
        filename: `AI生成_${genPrompt.slice(0, 20)}`,
        source: "ai"
      }));
      if (newImages.length) onImagesChange([...images, ...newImages]);
      else setGenError("未生成图片，请检查模型能力或 API 配额");
      setShowGen(false); setGenPrompt("");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "生成失败");
    } finally { setGenerating(false); }
  }

  function remove(id: string) { onImagesChange(images.filter((i) => i.id !== id)); }

  return (
    <div className="image-manager">
      <div className="image-toolbar">
        <span className="muted" style={{ fontSize: 13 }}>素材图片 ({images.length})</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="ai-cmd-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={13} /> 上传
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          <button type="button" className="ai-cmd-btn" onClick={() => setShowGen(!showGen)}>
            <Sparkles size={13} /> AI 生成
          </button>
        </div>
      </div>

      {showGen && (
        <div className="image-gen-box">
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="settings-input" style={{ flex: 1 }} value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} placeholder="描述你要生成的图片…" />
            <select className="settings-input" style={{ width: 120 }} value={genSize} onChange={(e) => setGenSize(e.target.value)}>
              <option value="1024x1024">1024×1024</option>
              <option value="1792x1024">1792×1024</option>
              <option value="1024x1792">1024×1792</option>
            </select>
            <select className="settings-input" style={{ width: 60 }} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}>
              <option value={1}>1</option><option value={2}>2</option><option value={4}>4</option>
            </select>
          </div>
          {genError && <p style={{ color: "var(--danger)", fontSize: 12, margin: "0 0 6px" }}>{genError}</p>}
          <button className="primary-button" type="button" disabled={generating || !genPrompt.trim()} onClick={generate}>
            {generating ? <Loader2 size={14} className="spinner" /> : <Sparkles size={14} />}
            {generating ? "生成中…" : "生成图片"}
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="image-strip">
          {images.map((img) => (
            <div key={img.id} className="image-thumb">
              <img src={img.dataUrl} alt={img.filename} />
              <span className="image-badge">{img.source === "ai" ? "AI" : "UP"}</span>
              <button type="button" className="image-remove" onClick={() => remove(img.id)}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
