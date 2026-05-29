import type { Asset } from "@flash-promoter/core";
import { sanitizeHtml } from "../html.js";
import { ArrowRight, FileImage, Trash2 } from "lucide-react";
import { marked } from "marked";
import { useRef } from "react";

type Props = {
  title: string;
  body: string;
  summary: string;
  tagsText: string;
  inputFormat: "markdown" | "html" | "text";
  assets: Asset[];
  busy: boolean;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onSummaryChange: (v: string) => void;
  onTagsChange: (v: string) => void;
  onInputFormatChange: (v: "markdown" | "html" | "text") => void;
  onAssetsChange: (assets: Asset[]) => void;
  onNext: () => void;
  canNext: boolean;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function StepInput(props: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const previewHtml =
    props.inputFormat === "markdown"
      ? sanitizeHtml(marked.parse(props.body, { async: false }) as string)
      : props.inputFormat === "html"
        ? sanitizeHtml(props.body)
        : sanitizeHtml(props.body.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p)}</p>`).join(""));

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: Asset[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await fileToDataUrl(file);
      next.push({
        id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        type: "image", dataUrl, filename: file.name, mimeType: file.type,
        size: file.size, createdAt: Date.now(), updatedAt: Date.now()
      });
    }
    if (!next.length) return;
    props.onAssetsChange([...props.assets, ...next]);
    if (props.inputFormat === "markdown") {
      const md = next.map((a) => `![${a.filename ?? "image"}](asset:${a.id})`).join("\n\n");
      props.onBodyChange(`${props.body.trim()}\n\n${md}`.trim());
    }
  }

  const titleHint = !props.title.trim() ? "请填写标题" : "";
  const bodyHint = props.body.trim().length < 10 ? "正文内容不能少于 10 个字" : "";

  return (
    <div className="step-panel" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }} onDrop={(e) => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}>
      <h2>输入内容</h2>
      <p className="step-desc">请输入或粘贴要发布的内容。可以使用标题、摘要和标签来组织信息。</p>

      <div className="field-grid">
        <label>
          <span>标题 *</span>
          <input value={props.title} onChange={(e) => props.onTitleChange(e.target.value)} placeholder="输入文章标题" />
          {titleHint ? <small className="field-hint">{titleHint}</small> : null}
        </label>
        <label>
          <span>摘要</span>
          <input value={props.summary} onChange={(e) => props.onSummaryChange(e.target.value)} placeholder="可选，简要描述内容" />
        </label>
        <label className="wide-field">
          <span>标签（逗号分隔）</span>
          <input value={props.tagsText} onChange={(e) => props.onTagsChange(e.target.value)} placeholder="例如：科技, 互联网, AI" />
        </label>
      </div>

      <div className="editor-toolbar">
        <div className="segmented">
          {(["text", "markdown", "html"] as const).map((f) => (
            <button key={f} type="button" className={props.inputFormat === f ? "active" : ""} onClick={() => props.onInputFormatChange(f)}>
              {f === "markdown" ? "Markdown" : f === "html" ? "富文本" : "普通文本"}
            </button>
          ))}
        </div>
        <label className="icon-button file-button" title="上传图片">
          <FileImage size={18} />
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => void handleFiles(e.target.files)} />
        </label>
      </div>

      <div className="editor-split">
        {props.inputFormat === "html" ? (
          <div className="rich-editor" contentEditable suppressContentEditableWarning onInput={(e) => props.onBodyChange(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: props.body }} />
        ) : (
          <textarea value={props.body} onChange={(e) => props.onBodyChange(e.target.value)} placeholder="在此输入正文内容…" />
        )}
        <article className="markdown-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>

      {bodyHint ? <p className="field-hint" style={{ marginTop: 8 }}>{bodyHint}</p> : null}

      {props.assets.length > 0 && (
        <div className="asset-strip">
          {props.assets.map((a) => (
            <div className="asset-chip" key={a.id}>
              {a.dataUrl ? <img src={a.dataUrl} alt={a.filename ?? ""} /> : <span className="asset-placeholder" />}
              <span>{a.filename ?? a.id}</span>
              <button type="button" onClick={() => props.onAssetsChange(props.assets.filter((x) => x.id !== a.id))}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="step-actions">
        <button className="primary-button" type="button" disabled={props.busy || !props.canNext} onClick={props.onNext}>
          下一步：选择平台 <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
