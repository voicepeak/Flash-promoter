export type AiActionType =
  | "generate" | "optimize" | "rewrite" | "shorten" | "expand"
  | "extract" | "generateAlternatives" | "generateFromText"
  | "generateFromImage" | "generateFromVideo" | "riskCheck";

export type LlmModelCapabilities = {
  text: boolean;
  image: boolean;
  videoFrame: boolean;
  structuredOutput: boolean;
  longContext: boolean;
};

export type LlmConfig = {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  apiKeyEncrypted: string;
  model: string;
  temperature: number;
  timeoutMs: number;
  maxTokens?: number;
  capabilities: LlmModelCapabilities;
  createdAt: number;
  updatedAt: number;
};

export type AiActionRequest = {
  contentId: string;
  packageId?: string;
  slotKey?: string;
  action: AiActionType;
  platform?: string;
  contentType: "article" | "video";
  fieldLabel?: string;
  currentValue: string;
  inputContext: Record<string, unknown>;
};

export type AiActionResult = {
  id: string;
  action: AiActionType;
  candidates: string[];
  model: string;
  createdAt: number;
};

export function createLlmConfig(overrides: Partial<LlmConfig> = {}): LlmConfig {
  return {
    enabled: false,
    provider: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    apiKeyEncrypted: "",
    model: "gpt-4o",
    temperature: 0.7,
    timeoutMs: 30000,
    maxTokens: 4096,
    capabilities: { text: true, image: false, videoFrame: false, structuredOutput: true, longContext: true },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };
}

export function buildAiPrompt(req: AiActionRequest): string {
  const context = JSON.stringify(req.inputContext, null, 2);
  const current = req.currentValue ? `\n当前内容：「${req.currentValue}」` : "";
  const field = req.fieldLabel ?? req.slotKey ?? "内容";
  const platform = req.platform ? `，目标平台：${req.platform}` : "";

  const actionPrompts: Record<string, string> = {
    generate: `请为以下内容生成${field}。${platform}\n素材：\n${context}${current}`,
    optimize: `请优化以下${field}内容${platform}。\n当前内容：「${req.currentValue}」\n素材：\n${context}`,
    rewrite: `请改写以下${field}内容${platform}。\n当前内容：「${req.currentValue}」\n素材：\n${context}`,
    shorten: `请缩短以下${field}内容，保持核心信息。\n当前内容：「${req.currentValue}」`,
    expand: `请扩写以下${field}内容${platform}。\n当前内容：「${req.currentValue}」\n素材：\n${context}`,
    extract: `请从以下素材中提取${field}。\n素材：\n${context}`,
    generateAlternatives: `请为以下内容生成 3 个候选${field}${platform}。\n素材：\n${context}${current}`,
    generateFromText: `请根据以下正文生成${field}${platform}。\n正文：\n${context}`,
    generateFromImage: `请根据图片内容生成${field}。\n素材：\n${context}`,
    generateFromVideo: `请根据视频信息生成${field}。\n素材：\n${context}`,
    riskCheck: `请检查以下内容是否存在风险${platform}。\n内容：「${req.currentValue}」\n素材：\n${context}`
  };

  return actionPrompts[req.action] ?? actionPrompts.generate;
}
