export type AiActionType =
  | "generate" | "optimize" | "rewrite" | "shorten" | "expand"
  | "extract" | "generateAlternatives" | "generateFromText"
  | "generateFromImage" | "generateFromVideo" | "riskCheck"
  | "analyzeContent";

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
  imageBaseUrl?: string;
  imageApiKey?: string;
  imageModel?: string;
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
  images?: string[];
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
    riskCheck: `请检查以下内容是否存在风险${platform}。\n内容：「${req.currentValue}」\n素材：\n${context}`,
    analyzeContent: req.contentType === "video"
      ? `你是一个专业的视频内容分析专家。请仔细分析提供的视频截图帧和文本描述，深入理解视频的核心内容、主题领域、目标受众和风格特点，提取准确的元数据。

${req.images?.length ? `已提供 ${req.images.length} 张视频截图帧供参考分析。` : ""}

要求：
- title: 生成一个吸引人且准确的标题，包含关键词，30字以内
- topic: 视频所属的具体主题/领域（如：编程教程、美食评测、科技新闻、游戏实况、生活vlog等）
- summary: 100字以内的精炼摘要，概括视频核心内容
- tags: 3-8个精准标签，优先选择热门但有区分度的标签
- highlights: 2-5个视频亮点或看点句子
- style: 从以下选择最匹配的风格：knowledge(知识科普)、tutorial(教程)、review(评测)、vlog(生活记录)、entertainment(娱乐)、news(新闻资讯)、commentary(评论解说)、interview(访谈)
- audience: 目标受众描述
- partitionSuggestion: 对于B站等视频平台的分区建议（如：科技-计算机技术、生活-日常、游戏-单机游戏等，结合视频内容领域推荐）

必须严格按以下 JSON 格式输出，不要输出任何其他文字：

{
  "title": "视频标题",
  "topic": "主题领域",
  "summary": "内容摘要",
  "tags": ["标签1", "标签2", "标签3"],
  "highlights": ["亮点1", "亮点2"],
  "style": "knowledge",
  "audience": "目标受众描述",
  "partitionSuggestion": "分区建议"
}

视频描述文本：
${req.currentValue}`
      : `请分析以下原始内容，提取各项元数据。必须严格按以下 JSON 格式输出，不要输出任何其他文字：

{
  "title": "提取或生成的标题",
  "summary": "简洁的内容摘要",
  "tags": ["标签1", "标签2", "标签3"],
  "keyPoints": ["核心观点1", "核心观点2"],
  "highlights": ["亮点句子1"],
  "suggestedPlatforms": ["wechat", "zhihu"],
  "tone": "内容风格描述"
}

原始内容：
${req.currentValue}`
  };

  return actionPrompts[req.action] ?? actionPrompts.generate;
}
