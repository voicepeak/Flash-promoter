import { useState } from "react";
import { ContentTypeStep } from "./ContentTypeStep.js";
import { ArticleFlowWizard } from "./ArticleFlowWizard.js";
import { VideoFlowWizard } from "./VideoFlowWizard.js";

export function FlowWizard() {
  const [contentType, setContentType] = useState<"article" | "video" | null>(null);

  if (!contentType) {
    return (
      <div className="wizard-shell">
        <header className="wizard-header">
          <div>
            <span className="eyebrow">发布向导</span>
            <h1>新建内容发布</h1>
          </div>
        </header>
        <ContentTypeStep onSelect={setContentType} />
      </div>
    );
  }

  if (contentType === "article") {
    return <ArticleFlowWizard />;
  }

  return <VideoFlowWizard />;
}
