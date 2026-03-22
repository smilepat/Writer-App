import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어(Korean)', en: 'English', ja: '日本語(Japanese)',
  zh: '中文(Chinese)', es: 'Español(Spanish)', fr: 'Français(French)', de: 'Deutsch(German)',
};

const TONE_NAMES: Record<string, string> = {
  formal: '공식적·격식체(Formal)',
  casual: '구어체·친근한(Casual)',
  academic: '학술적·논문체(Academic)',
  creative: '창의적·문학적(Creative)',
};

interface VariantRequest {
  input: string;
  language?: string;
  tones: string[];
  mode?: string;
  apiKey?: string;
}

function buildVariantPrompt(input: string, language: string, tones: string[], mode: string): string {
  const langLabel = LANGUAGE_NAMES[language] ?? language;
  const toneLabels = tones.map(t => TONE_NAMES[t] ?? t);

  return `You are an expert multilingual writing assistant.

**User's Input Text:**
"""
${input}
"""

**Task:** Generate ${tones.length} different versions of the improved text, each in a different tone.
**Target Language:** ${langLabel}
**Mode:** ${mode}

Return ONLY a valid JSON object — no markdown fences, no extra text — with this exact schema:
{
  "variants": [
${toneLabels.map((t, i) => `    { "tone": "${tones[i]}", "toneLabel": "${t}", "improved": "<improved text in ${t} tone in ${langLabel}>", "highlight": "<1 sentence describing what makes this version unique, in ${langLabel}>" }`).join(',\n')}
  ]
}

Strict rules:
- Each variant must be a natural, fluent ${langLabel} text
- Each variant must clearly reflect its designated tone
- The "highlight" should explain how this version differs from the others (in ${langLabel})
- Preserve the original meaning in all variants`;
}

export async function POST(request: NextRequest) {
  try {
    const body: VariantRequest = await request.json();
    const { input, language = 'ko', tones, mode = 'refine', apiKey: clientApiKey } = body;

    if (!input?.trim() || input.trim().length < 5) {
      return Response.json({ error: '텍스트가 너무 짧습니다.', errorType: 'short_input' }, { status: 400 });
    }
    if (!tones || tones.length < 2) {
      return Response.json({ error: '최소 2개의 톤을 선택해주세요.', errorType: 'invalid_tones' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || (typeof clientApiKey === 'string' ? clientApiKey.trim() : '');
    if (!apiKey) {
      return Response.json({ error: 'Gemini API Key가 없습니다.', errorType: 'no_api_key' }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildVariantPrompt(input.trim(), language, tones, mode);

    let lastError = '';
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { maxOutputTokens: 3072, temperature: 0.8 },
        });

        const raw = (response.text ?? '').trim();
        const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const result = JSON.parse(jsonStr);
        return Response.json(result);
      } catch (err: any) {
        lastError = String(err?.message ?? err);
        if (model !== MODELS[MODELS.length - 1]) continue;
        break;
      }
    }

    return Response.json({ error: `AI 처리 실패: ${lastError}`, errorType: 'ai_failure' }, { status: 500 });
  } catch (err: any) {
    return Response.json({ error: String(err?.message ?? '알 수 없는 오류'), errorType: 'unknown' }, { status: 500 });
  }
}
