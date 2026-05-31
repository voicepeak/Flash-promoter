import type { AiActionRequest, AiActionResult, LlmConfig } from "../ai/llm.js";
import { buildAiPrompt } from "../ai/llm.js";
import { createId, now } from "../models.js";

export async function callLlm(config: LlmConfig, req: AiActionRequest): Promise<AiActionResult> {
  const prompt = buildAiPrompt(req);
  const images = req.images ?? [];

  const userContent: unknown[] = [{ type: "text", text: prompt }];
  for (const img of images) {
    userContent.push({ type: "image_url", image_url: { url: img, detail: "low" } });
  }

  const body = JSON.stringify({
    model: config.model,
    messages: [
      { role: "system", content: "你是一个专业的内容创作助手，请只输出内容结果，不要添加解释。" },
      { role: "user", content: images.length > 0 ? userContent : prompt }
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens ?? 2048
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKeyEncrypted}` },
      body,
      signal: controller.signal
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`LLM 调用失败 (${res.status}): ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content ?? "";
    const candidates: string[] = raw
      .split(/\n---\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      id: createId("ai"),
      action: req.action,
      candidates: candidates.length ? candidates : [raw.trim()],
      model: config.model,
      createdAt: now()
    };
  } finally {
    clearTimeout(timer);
  }
}
