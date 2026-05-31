import { useState } from "react";
import type { PlatformDraft, PlatformId } from "@flash-promoter/core";
import { platformLabels, renderPlatformDraft } from "@flash-promoter/core";
import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react";
import { api } from "../../api/client.js";

type Props = {
  drafts: PlatformDraft[]; selectedPlatforms: PlatformId[]; busy: boolean;
  onDraftsChange: (d: PlatformDraft[]) => void; onBack: () => void; onNext: () => void; canNext: boolean;
};

export function VideoReviewStep(props: Props) {
  const [active, setActive] = useState<PlatformId>(props.drafts[0]?.platform ?? props.selectedPlatforms[0]);
  const draft = props.drafts.find((d) => d.platform === active);

  function update(draftId: string, patch: Record<string, unknown>) {
    props.onDraftsChange(props.drafts.map((d) => d.id === draftId ? { ...d, ...patch, userConfirmed: false, updatedAt: Date.now() } : d));
  }

  async function save(d: PlatformDraft) {
    try { const s = await api.updateDraft(d.id, d); props.onDraftsChange(props.drafts.map((x) => x.id === d.id ? s.draft : x)); } catch {}
  }
  async function confirm(d: PlatformDraft) {
    try { const s = await api.updateDraft(d.id, { userConfirmed: true }); props.onDraftsChange(props.drafts.map((x) => x.id === d.id ? s.draft : x)); } catch {}
  }

  const confirmedCount = props.drafts.filter((d) => d.userConfirmed).length;

  return (
    <div className="step-panel">
      <h2>编辑确认视频发布材料</h2>
      <p className="step-desc">逐个平台检查生成的视频发布材料，编辑后点击「确认当前平台」。已确认 {confirmedCount}/{props.drafts.length} 个平台。</p>
      <div className="tabs-row">
        {props.selectedPlatforms.map((p) => {
          const d = props.drafts.find((x) => x.platform === p);
          return <button key={p} className={`${p === active ? "active" : ""} ${d?.userConfirmed ? "confirmed-tab" : ""}`} onClick={() => setActive(p)}>{platformLabels[p]}{d?.userConfirmed ? " ✓" : ""}</button>;
        })}
      </div>
      {draft ? (
        <div className="edit-split">
          <div className="edit-left">
            <div className="field-grid">
              <label><span>视频标题</span><input value={draft.title} onChange={(e) => update(draft.id, { title: e.target.value })} /></label>
              <label><span>简介</span><input value={draft.summary ?? ""} onChange={(e) => update(draft.id, { summary: e.target.value })} /></label>
              <label className="wide-field"><span>标签</span><input value={(draft.tags ?? []).join(", ")} onChange={(e) => update(draft.id, { tags: e.target.value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean) })} /></label>
            </div>
            <label className="wide-field" style={{ marginTop: 10 }}>
              <span>视频描述</span>
              <textarea style={{ height: 160 }} value={typeof draft.body === "string" ? draft.body : (draft.summary ?? "")}
                onChange={(e) => update(draft.id, { body: e.target.value })} />
            </label>

            <div className="edit-meta">
              {(draft.platform === "bilibili") && (
                <>
                  <label><span>分区建议</span><input value={String(draft.platformMeta.partitionSuggestion ?? "")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, partitionSuggestion: e.target.value } })} /></label>
                  <label><span>置顶评论</span><input value={String(draft.platformMeta.pinnedComment ?? "")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, pinnedComment: e.target.value } })} /></label>
                </>
              )}
              {draft.platform === "xhs-assist" && (
                <>
                  <label><span>封面文案</span><input value={String(draft.platformMeta.coverText ?? "")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, coverText: e.target.value } })} /></label>
                  <label><span>话题标签</span><input value={((draft.platformMeta.hashtags as string[] | undefined) ?? []).join(", ")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, hashtags: e.target.value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean) } })} /></label>
                </>
              )}
              {draft.platform === "zhihu-assist" && (
                <>
                  <label><span>回答导语</span><input value={String((draft.platformMeta as Record<string, unknown>).answerIntro ?? "")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, answerIntro: e.target.value } })} /></label>
                  <label><span>话题</span><input value={((draft.platformMeta.topics as string[] | undefined) ?? []).join(", ")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, topics: e.target.value.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean) } })} /></label>
                </>
              )}
              {draft.platform === "wechat" && (
                <label><span>封面文案</span><input value={String(draft.platformMeta.coverText ?? "")} onChange={(e) => update(draft.id, { platformMeta: { ...draft.platformMeta, coverText: e.target.value } })} /></label>
              )}
            </div>

            <div className="step-actions" style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <button type="button" disabled={props.busy} onClick={() => save(draft)}><Save size={17} /> 保存当前版本</button>
              <button type="button" disabled={props.busy || draft.userConfirmed} onClick={() => confirm(draft)}><CheckCircle2 size={17} /> {draft.userConfirmed ? "已确认" : "确认当前平台"}</button>
            </div>
          </div>
          <div className="edit-right"><h3>预览</h3><div className="platform-preview"><DraftPreview draft={draft} /></div></div>
        </div>
      ) : <p className="muted">请选择一个平台开始编辑。</p>}

      <div className="step-actions">
        <button type="button" disabled={props.busy} onClick={props.onBack}><ArrowLeft size={17} /> 上一步</button>
        <button className="primary-button" type="button" disabled={props.busy || !props.canNext} onClick={props.onNext}>下一步：校验发布 <ArrowRight size={17} /></button>
      </div>
    </div>
  );
}

function DraftPreview({ draft }: { draft: PlatformDraft }) {
  const html = renderPlatformDraft(draft, { target: "preview" }).previewHtml;
  return (
    <div style={{ padding: 20 }}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
