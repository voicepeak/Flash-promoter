import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, Settings, UploadCloud } from "lucide-react";
import type { Asset, CanonicalPost, PlatformDraft, PlatformDraftUpdate, PlatformId, PublishJob, PublishLog, PublishMode } from "@flash-promoter/core";
import { blocksToMarkdown, defaultPublishMode, platformLabels } from "@flash-promoter/core";
import { api } from "./api/client.js";
import { EditorPanel } from "./components/EditorPanel.js";
import { PlatformPreview } from "./components/PlatformPreview.js";
import { RightPanel } from "./components/RightPanel.js";
import "./styles.css";

const defaultPlatforms: PlatformId[] = ["mock", "wechat", "bilibili", "zhihu-assist", "xhs-assist"];

const sampleBody = `## 核心观点

本地优先的内容发布工具应该先解决统一内容模型、平台预览、发布前校验和发布日志。

### 为什么先做 MVP

- 真实发布涉及账号、验证码、审核和风控。
- 模拟发布可以验证流程。
- 插件化 adapter 可以让后续平台接入保持边界清晰。

> 不绕过登录、验证码或平台风控，是辅助发布的基本边界。

\`\`\`ts
type PublishMode = "simulate" | "draft" | "assist" | "publish";
\`\`\`
`;

export default function App() {
  const [title, setTitle] = useState("flash-promoter MVP 发布流程");
  const [summary, setSummary] = useState("统一内容输入，多平台生成预览，发布前校验，并记录模拟发布日志。");
  const [tagsText, setTagsText] = useState("内容创作, MVP, 发布工具");
  const [body, setBody] = useState(sampleBody);
  const [inputFormat, setInputFormat] = useState<"markdown" | "html" | "text">("markdown");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [posts, setPosts] = useState<Array<CanonicalPost & { status: string }>>([]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("wechat");
  const [modes, setModes] = useState<Record<string, PublishMode>>({
    mock: "simulate",
    wechat: defaultPublishMode.wechat,
    bilibili: defaultPublishMode.bilibili,
    "zhihu-assist": defaultPublishMode["zhihu-assist"],
    "xhs-assist": defaultPublishMode["xhs-assist"]
  });
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [logs, setLogs] = useState<PublishLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const generatedPlatforms = useMemo(() => new Set(drafts.map((draft) => draft.platform)), [drafts]);

  useEffect(() => {
    void refreshSideData();
  }, []);

  async function handleGenerate() {
    setBusy(true);
    setMessage(null);
    try {
      const tags = tagsText
        .split(/[,，\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
      const created = await api.createPost({
        title,
        body,
        summary,
        tags,
        inputFormat,
        assets
      });
      setCurrentPostId(created.id);
      const generated = await api.generateDrafts(created.id, defaultPlatforms);
      setDrafts(generated.items);
      setSelectedPlatform(generated.items.find((draft) => draft.platform !== "mock")?.platform ?? "mock");
      setMessage("平台版本已生成");
      await refreshSideData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleValidate(draft: PlatformDraft) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.validateDraft(draft.id);
      setDrafts((current) => current.map((item) => (item.id === draft.id ? result.draft : item)));
      setMessage(result.ok ? `${platformLabels[draft.platform]} 校验通过` : `${platformLabels[draft.platform]} 校验未通过`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "校验失败");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(draft: PlatformDraft, mode: PublishMode) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await api.publishDraft(draft.id, mode, false);
      if (mode === "assist" && response.result?.url) {
        window.open(response.result.url, "_blank", "noopener,noreferrer");
        await copyAssistPackage(response.result.raw);
      }
      await refreshSideData();
      setMessage(`${platformLabels[draft.platform]} 发布任务已完成`);
    } catch (error) {
      await refreshSideData();
      setMessage(error instanceof Error ? error.message : "发布失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulateAll() {
    const publishable = drafts.filter((draft) => draft.platform !== "mock");
    if (!publishable.length) {
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      for (const draft of publishable) {
        await api.publishDraft(draft.id, "simulate", false);
      }
      await refreshSideData();
      setMessage("四平台模拟发布已完成");
    } catch (error) {
      await refreshSideData();
      setMessage(error instanceof Error ? error.message : "模拟发布失败");
    } finally {
      setBusy(false);
    }
  }

  function handleDraftChange(draftId: string, update: PlatformDraftUpdate) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              ...update,
              platformMeta: update.platformMeta ?? draft.platformMeta,
              userConfirmed: update.userConfirmed ?? false,
              validation: undefined,
              updatedAt: Date.now()
            }
          : draft
      )
    );
  }

  async function handleSaveDraft(draft: PlatformDraft) {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await api.updateDraft(draft.id, draft);
      setDrafts((current) => current.map((item) => (item.id === draft.id ? saved.draft : item)));
      setMessage(`${platformLabels[draft.platform]} 平台版本已保存`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存平台版本失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmDraft(draft: PlatformDraft) {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await api.updateDraft(draft.id, { ...draft, userConfirmed: true });
      setDrafts((current) => current.map((item) => (item.id === draft.id ? saved.draft : item)));
      setMessage(`${platformLabels[draft.platform]} 平台版本已确认`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "确认平台版本失败");
    } finally {
      setBusy(false);
    }
  }

  async function handleLoadPost(postId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.post(postId);
      setCurrentPostId(result.post.id);
      setTitle(result.post.title);
      setSummary(result.post.summary ?? "");
      setTagsText(result.post.tags.join(", "));
      setBody(blocksToMarkdown(result.post.body));
      setInputFormat("markdown");
      setAssets(result.post.assets);
      setDrafts(result.drafts);
      setSelectedPlatform(result.drafts.find((draft) => draft.platform !== "mock")?.platform ?? "wechat");
      setMessage("本地草稿已载入");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "载入本地草稿失败");
    } finally {
      setBusy(false);
    }
  }

  async function refreshSideData() {
    const [postResult, jobResult, logResult] = await Promise.all([api.posts(), api.jobs(), api.logs()]);
    setPosts(postResult.posts);
    setJobs(jobResult.jobs);
    setLogs(logResult.logs);
  }

  async function copyAssistPackage(raw: unknown) {
    const packageText = JSON.stringify(raw, null, 2);
    if (!navigator.clipboard || !packageText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(packageText);
    } catch {
      // Clipboard permission is browser-controlled; assist publish still returns the package in logs.
    }
  }

  return (
    <div className="app-shell">
      <nav className="side-nav">
        <div className="brand-mark">flash-promoter</div>
        <button className="active" type="button">
          <FileText size={18} />
          新建内容
        </button>
        <button type="button">
          <UploadCloud size={18} />
          发布任务
        </button>
        <button type="button">
          <Settings size={18} />
          设置
        </button>
      </nav>

      <main className="workspace">
        <header className="top-bar">
          <div>
            <span className="eyebrow">本地 MVP</span>
            <h1>内容适配工作台</h1>
          </div>
          <div className="platform-pills">
            {defaultPlatforms.map((platform) => (
              <span key={platform} className={generatedPlatforms.has(platform) ? "ready" : ""}>
                {platformLabels[platform]}
              </span>
            ))}
          </div>
        </header>

        {message ? (
          <div className="status-banner">
            <AlertCircle size={16} />
            {message}
          </div>
        ) : null}

        <div className="work-grid">
          <div className="left-stack">
            <EditorPanel
              title={title}
              body={body}
              summary={summary}
              tagsText={tagsText}
              inputFormat={inputFormat}
              assets={assets}
              busy={busy}
              onTitleChange={setTitle}
              onBodyChange={setBody}
              onSummaryChange={setSummary}
              onTagsChange={setTagsText}
              onInputFormatChange={setInputFormat}
              onAssetsChange={setAssets}
              onGenerate={handleGenerate}
            />
            <PlatformPreview
              drafts={drafts}
              selected={selectedPlatform}
              modes={modes}
              busy={busy}
              onSelect={setSelectedPlatform}
              onModeChange={(platform, mode) => setModes((current) => ({ ...current, [platform]: mode }))}
              onDraftChange={handleDraftChange}
              onSaveDraft={(draft) => void handleSaveDraft(draft)}
              onConfirmDraft={(draft) => void handleConfirmDraft(draft)}
              onValidate={(draft) => void handleValidate(draft)}
              onPublish={(draft, mode) => void handlePublish(draft, mode)}
              onSimulateAll={() => void handleSimulateAll()}
            />
          </div>
          <RightPanel
            assets={assets}
            jobs={jobs}
            logs={logs}
            posts={posts}
            currentPostId={currentPostId}
            onLoadPost={(postId) => void handleLoadPost(postId)}
          />
        </div>
      </main>
    </div>
  );
}
