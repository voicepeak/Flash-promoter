import { CheckCircle2, FileCheck2, Send, ShieldAlert } from "lucide-react";
import { marked } from "marked";
import type { PlatformDraft, PlatformId, PublishMode, ValidationResult } from "@flash-promoter/core";
import { platformLabels } from "@flash-promoter/core";
import { sanitizeHtml } from "./html.js";

type Props = {
  drafts: PlatformDraft[];
  selected: PlatformId;
  modes: Record<string, PublishMode>;
  busy: boolean;
  onSelect: (platform: PlatformId) => void;
  onModeChange: (platform: PlatformId, mode: PublishMode) => void;
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
          <option value="draft">draft</option>
          <option value="assist">assist</option>
          <option value="publish">publish</option>
        </select>
        <button type="button" disabled={props.busy} onClick={() => props.onValidate(draft)}>
          <FileCheck2 size={17} />
          校验
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

      <div className={`platform-preview ${draft.platform}`}>
        {renderDraftPreview(draft)}
      </div>

      <ValidationBox validation={draft.validation} />
    </section>
  );
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
