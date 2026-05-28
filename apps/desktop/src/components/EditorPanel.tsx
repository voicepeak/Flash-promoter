import { FileImage, Sparkles, Trash2 } from "lucide-react";
import { marked } from "marked";
import type { Asset } from "@flash-promoter/core";
import { sanitizeHtml } from "./html.js";

type Props = {
  title: string;
  body: string;
  summary: string;
  tagsText: string;
  inputFormat: "markdown" | "html" | "text";
  assets: Asset[];
  busy: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onInputFormatChange: (value: "markdown" | "html" | "text") => void;
  onAssetsChange: (assets: Asset[]) => void;
  onGenerate: () => void;
};

export function EditorPanel(props: Props) {
  const previewHtml =
    props.inputFormat === "markdown"
      ? sanitizeHtml(marked.parse(props.body, { async: false }) as string)
      : props.inputFormat === "html"
        ? sanitizeHtml(props.body)
        : sanitizeHtml(
            props.body
              .split(/\n{2,}/)
              .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
              .join("")
          );

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const nextAssets: Asset[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      const asset: Asset = {
        id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        type: "image",
        dataUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      nextAssets.push(asset);
    }

    if (!nextAssets.length) {
      return;
    }

    props.onAssetsChange([...props.assets, ...nextAssets]);
    if (props.inputFormat === "markdown") {
      const imageMarkdown = nextAssets.map((asset) => `![${asset.filename ?? "image"}](asset:${asset.id})`).join("\n\n");
      props.onBodyChange(`${props.body.trim()}\n\n${imageMarkdown}`.trim());
    }
  }

  return (
    <section className="editor-panel">
      <div className="field-grid">
        <label>
          <span>标题</span>
          <input value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} />
        </label>
        <label>
          <span>摘要</span>
          <input value={props.summary} onChange={(event) => props.onSummaryChange(event.target.value)} />
        </label>
        <label className="wide-field">
          <span>标签</span>
          <input value={props.tagsText} onChange={(event) => props.onTagsChange(event.target.value)} />
        </label>
      </div>

      <div className="editor-toolbar">
        <div className="segmented" aria-label="输入格式">
          {(["markdown", "html", "text"] as const).map((format) => (
            <button
              key={format}
              type="button"
              className={props.inputFormat === format ? "active" : ""}
              onClick={() => props.onInputFormatChange(format)}
            >
              {format === "markdown" ? "Markdown" : format === "html" ? "富文本" : "纯文本"}
            </button>
          ))}
        </div>
        <label className="icon-button file-button" title="图片上传">
          <FileImage size={18} />
          <input type="file" accept="image/*" multiple onChange={(event) => void handleFiles(event.target.files)} />
        </label>
        <button className="primary-button" type="button" disabled={props.busy} onClick={props.onGenerate}>
          <Sparkles size={18} />
          生成平台版本
        </button>
      </div>

      <div className="editor-split">
        {props.inputFormat === "html" ? (
          <div
            className="rich-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => props.onBodyChange(event.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: props.body }}
          />
        ) : (
          <textarea value={props.body} onChange={(event) => props.onBodyChange(event.target.value)} />
        )}
        <article className="markdown-preview" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>

      <div className="asset-strip">
        {props.assets.map((asset) => (
          <div className="asset-chip" key={asset.id}>
            {asset.dataUrl ? <img src={asset.dataUrl} alt={asset.filename ?? "asset"} /> : <span className="asset-placeholder" />}
            <span>{asset.filename ?? asset.id}</span>
            <button
              type="button"
              title="移除图片"
              onClick={() => props.onAssetsChange(props.assets.filter((item) => item.id !== asset.id))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </section>
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
