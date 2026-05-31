import { useState, useCallback } from "react";
import type { PlatformDraft, PlatformId, PublishResult } from "@flash-promoter/core";
import { api } from "../api/client.js";
import { VideoInfoStep } from "./steps/VideoInfoStep.js";
import { VideoPlatformSelectStep } from "./steps/VideoPlatformSelectStep.js";
import { VideoGenerateStep } from "./steps/VideoGenerateStep.js";
import { VideoReviewStep } from "./steps/VideoReviewStep.js";
import { VideoValidateStep } from "./steps/VideoValidateStep.js";
import { VideoResultStep } from "./steps/VideoResultStep.js";

const videoSteps = ["上传视频", "选择平台", "生成发布包", "编辑确认", "发布前检查", "发布结果"];

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
  const [highlightsText, setHighlightsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["bilibili", "xhs-assist"]);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult>>({});

  const showMessage = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 4000); }, []);

  function handleAnalyzed(t: string, tp: string, s: string, tags: string[], hl: string[], st: string, sc: string, tt: string) {
    setTitle(t); setTopic(tp); setSummary(s); setTagsText(tt); setHighlightsText(hl.join(", ")); setStyle(st); setScript(sc); setStep(1);
  }

  async function handleGenerate() {
    setStep(2); setBusy(true); setMessage(null);
    try {
      const tags = tagsText.split(/[,，\n]/).map((t) => t.trim()).filter(Boolean);
      const highlights = highlightsText.split(/[,，\n]/).map((h) => h.trim()).filter(Boolean);
      const created = await api.createVideoPost({ title, body: script, summary, tags, topic, script, transcript: "", highlights, style, contentType: "video", inputFormat: "markdown", assets: [] });
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
      <header className="wizard-header"><div><span className="eyebrow">视频发布向导</span><h1>视频内容发布</h1></div></header>
      <div className="stepper stepper-video">{videoSteps.map((label, i) => (<div key={label} className={`stepper-step ${i === step ? "current" : i < step ? "done" : ""}`}><span className="stepper-num">{i < step ? "✓" : i + 1}</span><span className="stepper-label">{label}</span></div>))}</div>
      {message ? <div className="wizard-banner">{message}</div> : null}
      <div className="step-body">
        {step === 0 && <VideoInfoStep videoFile={videoFile} duration={duration} resolution={resolution} onFileChange={setVideoFile} onDurationChange={setDuration} onResolutionChange={setResolution} onAnalyzed={handleAnalyzed} onBack={() => {}} />}
        {step === 1 && <VideoPlatformSelectStep selected={selectedPlatforms} onToggle={(p) => setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])} onBack={() => setStep(0)} onGenerate={handleGenerate} busy={busy} canNext={canNext} />}
        {step === 2 && <VideoGenerateStep selectedPlatforms={selectedPlatforms} busy={busy} />}
        {step === 3 && <VideoReviewStep drafts={drafts} selectedPlatforms={selectedPlatforms} busy={busy} onDraftsChange={setDrafts} onBack={() => setStep(1)} onNext={async () => { setBusy(true); const ok = await handleValidateAll(); setBusy(false); ok ? setStep(4) : setMessage("部分平台校验未通过"); }} canNext={canNext} />}
        {step === 4 && <VideoValidateStep drafts={drafts} busy={busy} onBack={() => setStep(3)} onPublish={handlePublishAll} allValid={drafts.every((d) => d.validation?.ok === true)} />}
        {step === 5 && <VideoResultStep drafts={drafts} results={publishResults} onBackToEdit={() => setStep(3)} onNewPost={() => { setStep(0); setVideoFile(null); setTitle(""); setTopic(""); setDrafts([]); setPublishResults({}); }} />}
      </div>
    </div>
  );
}
