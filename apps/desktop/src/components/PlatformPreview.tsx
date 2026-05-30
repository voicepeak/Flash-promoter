import { CheckCircle2, FileCheck2, Save, Send, ShieldAlert } from "lucide-react";
import { marked } from "marked";
import type { PlatformDraft, PlatformDraftUpdate, PlatformId, PublishMode, ValidationResult } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { sanitizeHtml } from "./html.js";

type Props = {
  drafts: PlatformDraft[];
  selected: PlatformId;
  modes: Record<string, PublishMode>;
  busy: boolean;
  onSelect: (platform: PlatformId) => void;
  onModeChange: (platform: PlatformId, mode: PublishMode) => void;
  onDraftChange: (draftId: string, update: PlatformDraftUpdate) => void;
  onSaveDraft: (draft: PlatformDraft) => void;
  onConfirmDraft: (draft: PlatformDraft) => void;
  onValidate: (draft: PlatformDraft) => void;
  onPublish: (draft: PlatformDraft, mode: PublishMode) => void;
  onSimulateAll: () => void;
};

export function PlatformPreview(props: Props) {
  const draft = props.drafts.find((item) => item.platform === props.selected) ?? props.drafts[0];

  if (!draft) {
    return (
      <section className="preview-empty">
        <p>尚未生成平台版本</p>
      </section>
    );
  }

  const mode = props.modes[draft.platform] ?? "simulate";

  return (
    <section className="preview-panel">
      <div className="tabs-row">
        {props.drafts.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.platform === draft.platform ? "active" : ""}
            onClick={() => props.onSelect(item.platform)}
          >
            {platformLabels[item.platform]}
          </button>
        ))}
      </div>

      <div className="preview-actions">
        <select value={mode} onChange={(event) => props.onModeChange(draft.platform, event.target.value as PublishMode)}>
          <option value="simulate">simulate</option>
          <option value="copy">copy</option>
          <option value="share">share</option>
          <option value="assist">assist</option>
          <option value="draft">draft</option>
          <option value="submit">submit</option>
          <option value="publish">publish</option>
        </select>
        <button type="button" disabled={props.busy} onClick={() => props.onValidate(draft)}>
          <FileCheck2 size={17} />
          校验
        </button>
        <button type="button" disabled={props.busy} onClick={() => props.onSaveDraft(draft)}>
          <Save size={17} />
          保存版本
        </button>
        <button type="button" disabled={props.busy || draft.userConfirmed} onClick={() => props.onConfirmDraft(draft)}>
          <CheckCircle2 size={17} />
          {draft.userConfirmed ? "已确认" : "确认版本"}
        </button>
        <button className="primary-button" type="button" disabled={props.busy} onClick={() => props.onPublish(draft, mode)}>
          <Send size={17} />
          发布
        </button>
        <button type="button" disabled={props.busy} onClick={props.onSimulateAll}>
          <CheckCircle2 size={17} />
          四平台模拟发布
        </button>
      </div>

      <DraftEditor draft={draft} onDraftChange={props.onDraftChange} />

      <div className={`platform-preview ${draft.platform}`}>
        {renderDraftPreview(draft)}
      </div>

      <ValidationBox validation={draft.validation} />
    </section>
  );
}

function DraftEditor({
  draft,
  onDraftChange
}: {
  draft: PlatformDraft;
  onDraftChange: (draftId: string, update: PlatformDraftUpdate) => void;
}) {
  const body = typeof draft.body === "string" ? draft.body : JSON.stringify(draft.body, null, 2);
  return (
    <div className="draft-editor">
      <div className="field-grid">
        <label>
          <span>平台标题</span>
          <input value={draft.title} onChange={(event) => onDraftChange(draft.id, { title: event.target.value })} />
        </label>
        <label>
          <span>平台摘要</span>
          <input value={draft.summary ?? ""} onChange={(event) => onDraftChange(draft.id, { summary: event.target.value })} />
        </label>
        <label className="wide-field">
          <span>平台标签</span>
          <input
            value={(draft.tags ?? []).join(", ")}
            onChange={(event) => onDraftChange(draft.id, { tags: splitCommaList(event.target.value) })}
          />
        </label>
      </div>
      <label className="wide-field draft-body-field">
        <span>平台正文</span>
        <textarea value={body} onChange={(event) => onDraftChange(draft.id, { body: event.target.value })} />
      </label>
      <PlatformMetaFields draft={draft} onDraftChange={onDraftChange} />
    </div>
  );
}

function PlatformMetaFields({
  draft,
  onDraftChange
}: {
  draft: PlatformDraft;
  onDraftChange: (draftId: string, update: PlatformDraftUpdate) => void;
}) {
  const updateMeta = (patch: Record<string, unknown>) =>
    onDraftChange(draft.id, { platformMeta: { ...draft.platformMeta, ...patch } });

  if (draft.platform === "wechat") {
    return (
      <div className="meta-editor-grid">
        <label>
          <span>封面文案</span>
          <input value={String(draft.platformMeta.coverText ?? "")} onChange={(event) => updateMeta({ coverText: event.target.value })} />
        </label>
        <label>
          <span>封面提示词</span>
          <input value={String(draft.platformMeta.coverPrompt ?? "")} onChange={(event) => updateMeta({ coverPrompt: event.target.value })} />
        </label>
      </div>
    );
  }

  if (draft.platform === "zhihu-assist") {
    return (
      <div className="meta-editor-grid">
        <label>
          <span>话题</span>
          <input
            value={((draft.platformMeta.topics as string[] | undefined) ?? []).join(", ")}
            onChange={(event) => updateMeta({ topics: splitCommaList(event.target.value) })}
          />
        </label>
        <label>
          <span>发布页</span>
          <input value={String(draft.platformMeta.assistUrl ?? "")} onChange={(event) => updateMeta({ assistUrl: event.target.value })} />
        </label>
      </div>
    );
  }

  if (draft.platform === "bilibili") {
    return (
      <div className="meta-editor-grid">
        <label>
          <span>视频标题</span>
          <input value={String(draft.platformMeta.videoTitle ?? "")} onChange={(event) => updateMeta({ videoTitle: event.target.value })} />
        </label>
        <label>
          <span>分区建议</span>
          <input
            value={String(draft.platformMeta.partitionSuggestion ?? "")}
            onChange={(event) => updateMeta({ partitionSuggestion: event.target.value })}
          />
        </label>
        <label className="wide-field">
          <span>简介</span>
          <textarea
            value={String(draft.platformMeta.description ?? "")}
            onChange={(event) => updateMeta({ description: event.target.value })}
          />
        </label>
        <label className="wide-field">
          <span>置顶评论</span>
          <input
            value={String(draft.platformMeta.pinnedComment ?? "")}
            onChange={(event) => updateMeta({ pinnedComment: event.target.value })}
          />
        </label>
      </div>
    );
  }

  if (draft.platform === "xhs-assist") {
    return (
      <div className="meta-editor-grid">
        <label>
          <span>封面文案</span>
          <input value={String(draft.platformMeta.coverText ?? "")} onChange={(event) => updateMeta({ coverText: event.target.value })} />
        </label>
        <label>
          <span>话题标签</span>
          <input
            value={((draft.platformMeta.hashtags as string[] | undefined) ?? []).join(", ")}
            onChange={(event) => updateMeta({ hashtags: splitCommaList(event.target.value).map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)) })}
          />
        </label>
        <label className="wide-field">
          <span>卡片文案</span>
          <textarea
            value={((draft.platformMeta.cardTexts as string[] | undefined) ?? []).join("\n")}
            onChange={(event) => updateMeta({ cardTexts: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })}
          />
        </label>
      </div>
    );
  }

  return null;
}

function renderDraftPreview(draft: PlatformDraft) {
  if (draft.platform === "wechat") {
    return <WechatPreview draft={draft} />;
  }
  if (draft.platform === "bilibili") {
    return <BilibiliPreview draft={draft} />;
  }
  if (draft.platform === "zhihu-assist") {
    return <ZhihuPreview draft={draft} />;
  }
  if (draft.platform === "xhs-assist") {
    return <XhsPreview draft={draft} />;
  }
  return <ArticlePreview draft={draft} />;
}

function splitCommaList(value: string): string[] {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ArticlePreview({ draft }: { draft: PlatformDraft }) {
  return (
    <article className="article-preview">
      <h1>{draft.title}</h1>
      {draft.summary ? <p className="summary">{draft.summary}</p> : null}
      <MarkdownBody body={draft.body} />
      <TagList tags={draft.tags} />
    </article>
  );
}

function WechatPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <article className="wechat-preview">
      <div className="cover-block">
        <span>{String(draft.platformMeta.coverText ?? draft.title)}</span>
      </div>
      <h1>{draft.title}</h1>
      <p className="byline">flash-promoter</p>
      {draft.summary ? <p className="summary">{draft.summary}</p> : null}
      <MarkdownBody body={draft.body} />
    </article>
  );
}

function ZhihuPreview({ draft }: { draft: PlatformDraft }) {
  return (
    <article className="zhihu-preview">
      <h1>{draft.title}</h1>
      <TagList tags={(draft.platformMeta.topics as string[] | undefined) ?? draft.topics ?? draft.tags} />
      <MarkdownBody body={draft.body} />
      <MetaList title="结构提示" items={(draft.platformMeta.logicHints as string[] | undefined) ?? []} />
    </article>
  );
}

function BilibiliPreview({ draft }: { draft: PlatformDraft }) {
  const tags = (draft.platformMeta.tags as string[] | undefined) ?? draft.tags ?? [];
  return (
    <article className="bilibili-preview">
      <h1>{String(draft.platformMeta.videoTitle ?? draft.title)}</h1>
      <p className="summary">{String(draft.platformMeta.description ?? draft.summary ?? "")}</p>
      <div className="meta-line">分区建议：{String(draft.platformMeta.partitionSuggestion ?? "未选择")}</div>
      <TagList tags={tags} />
      <MarkdownBody body={draft.body} />
      <MetaList title="置顶评论" items={[String(draft.platformMeta.pinnedComment ?? "")].filter(Boolean)} />
    </article>
  );
}

function XhsPreview({ draft }: { draft: PlatformDraft }) {
  const hashtags = (draft.platformMeta.hashtags as string[] | undefined) ?? [];
  const cards = (draft.platformMeta.cardTexts as string[] | undefined) ?? [];
  return (
    <article className="xhs-preview">
      <div className="xhs-phone">
        <div className="xhs-cover">{String(draft.platformMeta.coverText ?? draft.title)}</div>
        <h1>{draft.title}</h1>
        <MarkdownBody body={draft.body} />
        <TagList tags={hashtags} />
      </div>
      <div className="card-grid">
        {cards.map((text, index) => (
          <div className="xhs-card" key={`${text}-${index}`}>
            <span>{index + 1}</span>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function MarkdownBody({ body }: { body: PlatformDraft["body"] }) {
  const markdown = typeof body === "string" ? body : body.map((block) => ("text" in block ? block.text : "")).join("\n\n");
  const html = sanitizeHtml(marked.parse(markdown, { async: false }) as string);
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

function TagList({ tags }: { tags?: string[] }) {
  if (!tags?.length) {
    return null;
  }
  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function MetaList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <div className="meta-list">
      <strong>{title}</strong>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function ValidationBox({ validation }: { validation?: ValidationResult }) {
  if (!validation) {
    return null;
  }
  return (
    <div className={`validation-box ${validation.ok ? "ok" : "error"}`}>
      <div className="validation-title">
        <ShieldAlert size={17} />
        {validation.ok ? "校验通过" : "校验未通过"}
      </div>
      {[...validation.errors, ...validation.warnings].map((issue) => (
        <p key={`${issue.code}-${issue.message}`}>{issue.message}</p>
      ))}
    </div>
  );
}
