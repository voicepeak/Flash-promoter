import { useState, useCallback } from "react";
import type { PlatformDraft, PlatformId, PublishResult } from "@flash-promoter/core";
import { api } from "../api/client.js";
import { VideoSelectStep } from "./steps/VideoSelectStep.js";
import { VideoInfoStep } from "./steps/VideoInfoStep.js";
import { VideoPlatformSelectStep } from "./steps/VideoPlatformSelectStep.js";
import { VideoGenerateStep } from "./steps/VideoGenerateStep.js";
import { VideoReviewStep } from "./steps/VideoReviewStep.js";
import { VideoValidateStep } from "./steps/VideoValidateStep.js";
import { VideoResultStep } from "./steps/VideoResultStep.js";

const videoSteps = ["选择视频", "填写信息", "选择平台", "生成材料", "编辑确认", "校验发布", "发布结果"];

export function VideoFlowWizard() {
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
  const [transcript, setTranscript] = useState("");
  const [highlightsText, setHighlightsText] = useState("");
  const [tagsText, setTagsText] = useState("");

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["bilibili", "xhs-assist"]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }, []);

  async function handleGenerate() {
    setStep(3);
    setBusy(true);
    setMessage(null);
    try {
      const tags = tagsText.split(/[,，\n]/).map((t) => t.trim()).filter(Boolean);
      const highlights = highlightsText.split(/[,，\n]/).map((h) => h.trim()).filter(Boolean);
      const created = await api.createVideoPost({
        title, body: script, summary, tags, topic, script, transcript, highlights, style,
        contentType: "video" as const,
        inputFormat: "markdown" as const,
        assets: []
      });
      setCurrentPostId(created.id);
      const generated = await api.generateVideoDrafts(created.id, selectedPlatforms);
      setDrafts(generated.items);
      setStep(4);
      showMessage("视频发布材料已生成");
    } catch (error) {
      setStep(2);
      setMessage(error instanceof Error ? error.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishAll() {
    setBusy(true);
    setMessage(null);
    const results: Record<string, PublishResult> = {};
    for (const draft of drafts) {
      try {
        const res = await api.publishDraft(draft.id, "simulate", false);
        if (res.result) results[draft.platform] = res.result;
      } catch {
        results[draft.platform] = { platform: draft.platform, mode: "simulate", status: "failed", message: "模拟发布失败", createdAt: Date.now() };
      }
    }
    setPublishResults(results);
    setStep(6);
    showMessage("视频模拟发布完成");
    setBusy(false);
  }

  async function handleValidateAll(): Promise<boolean> {
    let allOk = true;
    const updated = [...drafts];
    for (let i = 0; i < updated.length; i++) {
      try {
        const result = await api.validateDraft(updated[i].id);
        updated[i] = result.draft;
        if (!result.ok) allOk = false;
      } catch { allOk = false; }
    }
    setDrafts(updated);
    return allOk;
  }

  const canNext = (() => {
    switch (step) {
      case 0: return videoFile !== null;
      case 1: return title.trim().length > 0 && topic.trim().length > 0;
      case 2: return selectedPlatforms.length > 0;
      case 4: return drafts.every((d) => d.userConfirmed);
      default: return true;
    }
  })();

  return (
    <div className="wizard-shell">
      <header className="wizard-header">
        <div>
          <span className="eyebrow">视频发布向导</span>
          <h1>视频内容发布</h1>
        </div>
      </header>

      <div className="stepper stepper-video">
        {videoSteps.map((label, i) => (
          <div key={label} className={`stepper-step ${i === step ? "current" : i < step ? "done" : ""}`}>
            <span className="stepper-num">{i < step ? "✓" : i + 1}</span>
            <span className="stepper-label">{label}</span>
          </div>
        ))}
      </div>

      {message ? <div className="wizard-banner">{message}</div> : null}

      <div className="step-body">
        {step === 0 && (
          <VideoSelectStep
            videoFile={videoFile} duration={duration} resolution={resolution}
            onFileChange={setVideoFile} onDurationChange={setDuration} onResolutionChange={setResolution}
            onNext={() => setStep(1)} canNext={canNext}
          />
        )}
        {step === 1 && (
          <VideoInfoStep
            title={title} topic={topic} summary={summary} style={style} script={script}
            transcript={transcript} highlightsText={highlightsText} tagsText={tagsText} busy={busy}
            onTitleChange={setTitle} onTopicChange={setTopic} onSummaryChange={setSummary}
            onStyleChange={setStyle} onScriptChange={setScript} onTranscriptChange={setTranscript}
            onHighlightsChange={setHighlightsText} onTagsChange={setTagsText}
            onBack={() => setStep(0)} onNext={() => setStep(2)} canNext={canNext}
          />
        )}
        {step === 2 && (
          <VideoPlatformSelectStep
            selected={selectedPlatforms}
            onToggle={(p) => setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
            onBack={() => setStep(1)} onGenerate={handleGenerate} busy={busy} canNext={canNext}
          />
        )}
        {step === 3 && <VideoGenerateStep selectedPlatforms={selectedPlatforms} busy={busy} />}
        {step === 4 && (
          <VideoReviewStep
            drafts={drafts} selectedPlatforms={selectedPlatforms} busy={busy}
            onDraftsChange={setDrafts} onBack={() => setStep(2)}
            onNext={async () => { setBusy(true); const ok = await handleValidateAll(); setBusy(false); ok ? setStep(5) : setMessage("部分平台校验未通过"); }}
            canNext={canNext}
          />
        )}
        {step === 5 && (
          <VideoValidateStep drafts={drafts} busy={busy} onBack={() => setStep(4)} onPublish={handlePublishAll}
            allValid={drafts.every((d) => d.validation?.ok === true)}
          />
        )}
        {step === 6 && (
          <VideoResultStep drafts={drafts} results={publishResults}
            onBackToEdit={() => setStep(4)}
            onNewPost={() => { setStep(0); setVideoFile(null); setTitle(""); setTopic(""); setDrafts([]); setPublishResults({}); }}
          />
        )}
      </div>
    </div>
  );
}
