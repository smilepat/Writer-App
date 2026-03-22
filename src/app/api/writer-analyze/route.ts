import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const LANGUAGE_NAMES: Record<string, string> = {
  ko: '한국어(Korean)',
  en: 'English',
  ja: '日本語(Japanese)',
  zh: '中文(Chinese)',
  es: 'Español(Spanish)',
  fr: 'Français(French)',
  de: 'Deutsch(German)',
};

const TONE_NAMES: Record<string, string> = {
  formal: '공식적·격식체(Formal)',
  casual: '구어체·친근한(Casual)',
  academic: '학술적·논문체(Academic)',
  creative: '창의적·문학적(Creative)',
};

const MODE_DESCRIPTIONS: Record<string, string> = {
  refine: '문장 다듬기 — 사용자의 의도를 최대한 살리면서 더 명확하고 간결하게 개선',
  summarize: '요약 — 핵심 내용만 압축하여 간결하게 정리',
  expand: '확장 — 더 풍부하고 상세하게, 구체적 예시 추가',
  translate: '번역 — 지정된 언어로 자연스럽게 번역',
};

function buildPrompt(
  input: string,
  language: string,
  tone: string,
  mode: string
): string {
  const langLabel = LANGUAGE_NAMES[language] ?? language;
  const toneLabel = TONE_NAMES[tone] ?? tone;
  const modeLabel = MODE_DESCRIPTIONS[mode] ?? mode;

  return `You are an expert multilingual writing assistant with deep language skills.

**User's Input Text:**
"""
${input}
"""

**Task:** ${modeLabel}
**Target Language:** ${langLabel}
**Writing Tone:** ${toneLabel}

Return ONLY a valid JSON object — no markdown fences, no extra text — with this exact schema:
{
  "improved": "<the final processed text in ${langLabel} with ${toneLabel} tone>",
  "changes": [
    "<specific improvement or change #1 in ${langLabel}>",
    "<specific improvement or change #2 in ${langLabel}>"
  ],
  "keywords": [
    { "word": "<important keyword from the text>", "definition": "<brief 1-sentence definition in ${langLabel}>" }
  ],
  "concepts": [
    {
      "title": "<name of a complex or important concept>",
      "explanation": "<clear 2–4 sentence explanation in ${langLabel}>",
      "relatedTerms": ["<related term 1>", "<related term 2>"]
    }
  ],
  "contextExpansion": "<2–3 sentences expanding broader context, background, or related ideas in ${langLabel}>",
  "writingScore": {
    "overall": <0–100 integer>,
    "readability": <0–100 integer>,
    "complexity": <0–100 integer>,
    "vocabularyDiversity": <0–100 integer>,
    "toneConsistency": <0–100 integer>,
    "suggestions": [
      "<1-sentence actionable suggestion to improve writing quality in ${langLabel}>",
      "<another suggestion in ${langLabel}>"
    ]
  }
}

Strict rules:
- "improved": must be fluent, natural ${langLabel} text in ${toneLabel} tone
- "keywords": extract 3–6 important keywords from the input; focus on substantive/domain words
- "concepts": identify 1–3 complex, technical, or nuanced concepts worth explaining clearly
- "changes": list 2–4 concrete improvements made (be specific, not vague), in ${langLabel}
- "contextExpansion": provide enriching background or connective ideas — NOT a summary
- "writingScore": evaluate the ORIGINAL input text (not the improved version). overall = weighted average. readability = how easy to read (100=very clear). complexity = appropriate sentence structure (100=well-balanced). vocabularyDiversity = variety of word choices (100=very diverse). toneConsistency = how consistent the tone is (100=perfectly consistent). suggestions = 2–3 specific, actionable tips to improve the original text, in ${langLabel}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, language = 'ko', tone = 'formal', mode = 'refine', apiKey: clientApiKey } = body;

    if (!input?.trim()) {
      return Response.json({ error: '입력 텍스트가 없습니다.', errorType: 'empty_input' }, { status: 400 });
    }
    if (input.trim().length < 5) {
      return Response.json({ error: '텍스트가 너무 짧습니다. 10자 이상 입력해주세요.', errorType: 'short_input' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || (typeof clientApiKey === 'string' ? clientApiKey.trim() : '');
    if (!apiKey) {
      return Response.json(
        { error: 'Gemini API Key가 없습니다. 상단 메뉴의 API Key 버튼에서 설정해주세요.', errorType: 'no_api_key' },
        { status: 401 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(input.trim(), language, tone, mode);

    let lastError = '';
    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { maxOutputTokens: 2048, temperature: 0.7 },
        });

        const raw = (response.text ?? '').trim();
        // Strip possible markdown code fences from LLM response
        const jsonStr = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const result = JSON.parse(jsonStr);
        return Response.json(result);
      } catch (err: any) {
        lastError = String(err?.message ?? err);
        if (model !== MODELS[MODELS.length - 1]) continue;
        break;
      }
    }

    const errorType = lastError.includes('rate') || lastError.includes('429') ? 'rate_limit'
      : lastError.includes('API key') || lastError.includes('401') ? 'api_key_invalid'
      : 'ai_failure';
    return Response.json({ error: `AI 처리 실패: ${lastError}`, errorType }, { status: 500 });
  } catch (err: any) {
    const msg = String(err?.message ?? '알 수 없는 오류가 발생했습니다.');
    const errorType = msg.includes('fetch') || msg.includes('network') ? 'network' : 'unknown';
    return Response.json(
      { error: msg, errorType },
      { status: 500 }
    );
  }
}
