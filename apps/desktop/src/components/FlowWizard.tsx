import { useEffect, useState } from "react";
import { ContentTypeStep } from "./ContentTypeStep.js";
import { ArticleFlowWizard } from "./ArticleFlowWizard.js";
import { VideoFlowWizard } from "./VideoFlowWizard.js";

export type PublishResumeRequest = {
  postId: string;
  contentType: "article" | "video";
  requestId: number;
};

type Props = {
  resumeRequest?: PublishResumeRequest | null;
  onResumeConsumed?: () => void;
};

export function FlowWizard(props: Props) {
  const [contentType, setContentType] = useState<"article" | "video" | null>(null);

  useEffect(() => {
    if (props.resumeRequest) {
      setContentType(props.resumeRequest.contentType);
    }
  }, [props.resumeRequest?.requestId]);

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
    return (
      <ArticleFlowWizard
        resumeRequest={props.resumeRequest?.contentType === "article" ? props.resumeRequest : null}
        onResumeConsumed={props.onResumeConsumed}
      />
    );
  }

  return (
    <VideoFlowWizard
      resumeRequest={props.resumeRequest?.contentType === "video" ? props.resumeRequest : null}
      onResumeConsumed={props.onResumeConsumed}
    />
  );
}
