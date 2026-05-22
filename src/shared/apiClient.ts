import { dataUrlToMimeAndBase64 } from './imageData';
import { parsePromptAnalysis } from './jsonRepair';
import type { AppSettings, PromptAnalysis } from './types';

interface OpenAiContentPart {
  type?: string;
  text?: string;
}

export function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('Base URL is required.');
  if (trimmed.endsWith('/chat/completions')) return trimmed;
  return `${trimmed}/chat/completions`;
}

export async function analyzeImageWithApi(input: {
  settings: AppSettings;
  imageDataUrl: string;
  promptText: string;
}): Promise<PromptAnalysis> {
  const { mime, base64 } = dataUrlToMimeAndBase64(input.imageDataUrl);
  const response = await fetch(normalizeChatCompletionsUrl(input.settings.baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: input.settings.model,
      temperature: 0.18,
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: input.promptText },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
          ]
        }
      ]
    })
  });

  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(extractApiError(payload) || `API request failed: ${response.status}`);
  }

  return parsePromptAnalysis(extractAssistantText(payload));
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

function extractAssistantText(payload: unknown): string {
  const record = payload as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const first = choices[0] as Record<string, unknown> | undefined;
  const message = first?.message as Record<string, unknown> | undefined;
  const content = message?.content;

  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        const typedPart = part as OpenAiContentPart;
        return typedPart.type === 'text' || typedPart.text ? typedPart.text || '' : '';
      })
      .join('');
  }

  throw new Error('API response did not include assistant content.');
}

function extractApiError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.error === 'string') return record.error;
  if (record.error && typeof record.error === 'object') {
    const error = record.error as Record<string, unknown>;
    if (typeof error.message === 'string') return error.message;
  }
  return undefined;
}
