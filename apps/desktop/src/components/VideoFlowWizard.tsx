import { useState, useCallback, useEffect } from "react";
import type { CanonicalPost, PlatformDraft, PlatformId, PublishResult } from "@flash-promoter/core";
import { blocksToMarkdown } from "@flash-promoter/core";
import { api } from "../api/client.js";
import { VideoInfoStep } from "./steps/VideoInfoStep.js";
import { VideoPlatformSelectStep } from "./steps/VideoPlatformSelectStep.js";
import { VideoGenerateStep } from "./steps/VideoGenerateStep.js";
import { VideoReviewStep } from "./steps/VideoReviewStep.js";
import { VideoValidateStep } from "./steps/VideoValidateStep.js";
import { VideoResultStep } from "./steps/VideoResultStep.js";
import type { PublishResumeRequest } from "./FlowWizard.js";
import { Home } from "lucide-react";

const videoSteps = ["上传视频", "选择平台", "生成发布包", "编辑确认", "发布前检查", "发布结果"];

const videoPlatforms: PlatformId[] = ["bilibili", "xhs-assist", "zhihu-assist", "wechat"];

type Props = {
  resumeRequest?: PublishResumeRequest | null;
  onResumeConsumed?: () => void;
  onReset?: () => void;
};

export function VideoFlowWizard(props: Props = {}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState("");
  const [resolution, setResolution] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [style, setStyle] = useState("knowledge");
  const [script, setScript] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [partitionSuggestion, setPartitionSuggestion] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["bilibili", "xhs-assist"]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});

  const showMessage = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 4000); }, []);

  useEffect(() => {
    const request = props.resumeRequest;
    if (!request) return;
    const postId = request.postId;

    let cancelled = false;
    async function resumePost() {
      setBusy(true);
      setMessage(null);
      try {
        const result = await api.post(postId);
        if (cancelled) return;

        const activeDrafts = result.drafts.filter((draft) => videoPlatforms.includes(draft.platform));
        const platforms = activeDrafts.map((draft) => draft.platform);

        hydrateVideoPost(result.post, {
          setTitle,
          setTopic,
          setSummary,
          setStyle,
          setScript,
          setTagsText,
          setHighlightsText
        });
        setCurrentPostId(result.post.id);
        setSelectedPlatforms(platforms.length > 0 ? platforms : ["bilibili", "xhs-assist"]);
        setDrafts(activeDrafts);
        setPublishResults({});
        setStep(activeDrafts.length > 0 ? 3 : 1);
        showMessage(activeDrafts.length > 0 ? "已载入历史视频，可继续编辑平台版本" : "已载入历史视频，请重新生成平台版本");
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "载入历史视频失败");
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
          props.onResumeConsumed?.();
        }
      }
    }

    void resumePost();
    return () => { cancelled = true; };
  }, [props.resumeRequest?.requestId, showMessage]);

  async function handleGenerate() {
    setStep(2); setBusy(true); setMessage(null);
    try {
      const tags = tagsText.split(/[,，\n]/).map((t) => t.trim()).filter(Boolean);
      const highlights = highlightsText.split(/[,，\n]/).map((h) => h.trim()).filter(Boolean);

      let finalTitle = title;
      let finalTopic = topic;
      let finalSummary = summary;
      let finalTags = tags;
      let finalHighlights = highlights;
      let finalStyle = style;

      // Fallback: use video filename if no title
      if (!finalTitle.trim() && videoFile) {
        finalTitle = videoFile.name.replace(/\.[^.]+$/, "");
      }

      // Only run AI analysis if there's meaningful text content
      const hasContent = script.trim().length > 5 || finalSummary.trim().length > 5 || finalTitle.trim().length > 0;
      let llmAvailable = false;
      try {
        const cfg = await api.getLlmConfig();
        const hasKey = !!(cfg?.config?.apiKeyEncrypted);
        llmAvailable = !!(cfg?.config?.enabled && hasKey);
      } catch { llmAvailable = false; }

      if (llmAvailable && hasContent) {
        try {
          const scriptText = script.trim() || finalSummary || `${finalTitle}\n时长：${duration}\n分辨率：${resolution}`;
          const analysis = await api.aiAction({
            contentId: "generate-stage", action: "analyzeContent", contentType: "video",
            currentValue: scriptText, slotKey: "video", fieldLabel: "视频分析",
            inputContext: { platforms: selectedPlatforms, duration, resolution, videoFile: videoFile?.name ?? "" }
          });
          const json = tryParse(analysis.candidates[0] ?? "");
          if (json) {
            finalTitle = String(json.title ?? finalTitle);
            finalTopic = String(json.topic ?? finalTopic);
            finalSummary = String(json.summary ?? finalSummary);
            finalTags = Array.isArray(json.tags) ? json.tags.map(String) : finalTags;
            finalHighlights = Array.isArray(json.highlights) ? json.highlights.map(String) : finalHighlights;
            finalStyle = String(json.style ?? finalStyle);
            if (json.partitionSuggestion) {
              setPartitionSuggestion(String(json.partitionSuggestion));
            }
          }
        } catch { /* LLM unavailable, use manual fields */ }
      }

      setTitle(finalTitle);
      setTopic(finalTopic);
      setSummary(finalSummary);
      setTagsText(finalTags.join(", "));
      setHighlightsText(finalHighlights.join(", "));
      setStyle(finalStyle);

      const created = await api.createVideoPost({
        title: finalTitle, body: script || finalSummary, summary: finalSummary, tags: finalTags,
        topic: finalTopic, script, transcript: "", highlights: finalHighlights,
        style: finalStyle, contentType: "video", inputFormat: "markdown", assets: []
      });
      setCurrentPostId(created.id);
      const generated = await api.generateVideoDrafts(created.id, selectedPlatforms);
      setDrafts(generated.items); setStep(3); showMessage("视频发布材料已生成");
    } catch (error) {
      setStep(1);
      const msg = error instanceof TypeError && error.message === "Failed to fetch"
        ? "生成失败，请确认 API 服务已启动"
        : error instanceof Error ? error.message : "生成失败";
      setMessage(msg);
    } finally { setBusy(false); }
  }

  async function handlePublishAll() {
    setBusy(true); setMessage(null);
    const results: Record<string, PublishResult> = {};
    let realCount = 0;
    for (const d of drafts) {
      try {
        const r = await api.publishDraft(d.id, "simulate", false);
        if (r.result) { results[d.platform] = r.result; if ((r.result.raw as Record<string, unknown>)?.realApiCalled) realCount++; }
      } catch {
        results[d.platform] = { platform: d.platform, mode: "simulate", status: "failed", message: "发布失败", createdAt: Date.now() };
      }
    }
    setPublishResults(results); setStep(5);
    showMessage(realCount > 0 ? `${realCount} 个平台真实发布完成` : "发布完成");
    setBusy(false);
  }

  async function handleValidateAll(): Promise<boolean> {
    let ok = true; const u = [...drafts];
    for (let i = 0; i < u.length; i++) { try { const r = await api.validateDraft(u[i].id); u[i] = r.draft; if (!r.ok) ok = false; } catch { ok = false; } }
    setDrafts(u); return ok;
  }

  const canNext = (() => { switch (step) { case 1: return selectedPlatforms.length > 0; case 3: return drafts.every((d) => d.userConfirmed); default: return true; } })();

  return (
    <div className="wizard-shell">
      <header className="wizard-header"><div><span className="eyebrow">视频发布向导</span><h1>视频内容发布</h1></div>{props.onReset ? <button type="button" className="text-button" onClick={props.onReset} title="返回首页"><Home size={18} /> 返回首页</button> : null}</header>
      <div className="stepper stepper-video">{videoSteps.map((label, i) => (<div key={label} className={`stepper-step ${i === step ? "current" : i < step ? "done" : ""}`}><span className="stepper-num">{i < step ? "✓" : i + 1}</span><span className="stepper-label">{label}</span></div>))}</div>
      {message ? <div className="wizard-banner">{message}</div> : null}
      <div className="step-body">
        {step === 0 && <VideoInfoStep videoFile={videoFile} duration={duration} resolution={resolution} onFileChange={setVideoFile} onDurationChange={setDuration} onResolutionChange={setResolution} script={script} onScriptChange={setScript} onNext={() => setStep(1)} onBack={() => {}} />}
        {step === 1 && <VideoPlatformSelectStep selected={selectedPlatforms} onToggle={(p) => setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])} onBack={() => setStep(0)} onGenerate={handleGenerate} busy={busy} canNext={canNext} />}
        {step === 2 && <VideoGenerateStep selectedPlatforms={selectedPlatforms} busy={busy} />}
        {step === 3 && <VideoReviewStep drafts={drafts} selectedPlatforms={selectedPlatforms} busy={busy} onDraftsChange={setDrafts} onBack={() => setStep(1)} onNext={async () => { setBusy(true); const ok = await handleValidateAll(); setBusy(false); ok ? setStep(4) : setMessage("部分平台校验未通过"); }} canNext={canNext} />}
        {step === 4 && <VideoValidateStep drafts={drafts} busy={busy} onBack={() => setStep(3)} onPublish={handlePublishAll} allValid={drafts.every((d) => d.validation?.ok === true)} />}
        {step === 5 && <VideoResultStep drafts={drafts} results={publishResults} onBackToEdit={() => setStep(3)} onNewPost={() => { setStep(0); setVideoFile(null); setTitle(""); setTopic(""); setSummary(""); setScript(""); setHighlightsText(""); setTagsText(""); setPartitionSuggestion(""); setCurrentPostId(null); setDrafts([]); setPublishResults({}); }} />}
      </div>
    </div>
  );
}

type VideoHydrationSetters = {
  setTitle: (value: string) => void;
  setTopic: (value: string) => void;
  setSummary: (value: string) => void;
  setStyle: (value: string) => void;
  setScript: (value: string) => void;
  setTagsText: (value: string) => void;
  setHighlightsText: (value: string) => void;
};

function hydrateVideoPost(post: CanonicalPost, setters: VideoHydrationSetters) {
  const raw = post as CanonicalPost & Record<string, unknown>;
  const highlights = Array.isArray(raw.highlights) ? raw.highlights.map(String) : [];

  setters.setTitle(post.title);
  setters.setTopic(String(raw.topic ?? post.summary ?? ""));
  setters.setSummary(post.summary ?? "");
  setters.setStyle(String(raw.style ?? "knowledge"));
  setters.setScript(String(raw.script ?? blocksToMarkdown(post.body)));
  setters.setTagsText(post.tags.join(", "));
  setters.setHighlightsText(highlights.join(", "));
}

function tryParse(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()) as Record<string, unknown>; } catch { return null; }
}
