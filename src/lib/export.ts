import type { AnalysisResult } from '@/app/writer/page';

function resultToMarkdown(result: AnalysisResult): string {
  let md = `## 개선된 텍스트\n\n${result.improved}\n`;

  if (result.changes?.length) {
    md += `\n## 개선 사항\n\n`;
    result.changes.forEach((c, i) => { md += `${i + 1}. ${c}\n`; });
  }

  if (result.keywords?.length) {
    md += `\n## 핵심 키워드\n\n`;
    result.keywords.forEach(k => { md += `- **${k.word}**: ${k.definition}\n`; });
  }

  if (result.concepts?.length) {
    md += `\n## 개념 설명\n\n`;
    result.concepts.forEach(c => {
      md += `### ${c.title}\n\n${c.explanation}\n`;
      if (c.relatedTerms?.length) md += `\n관련 개념: ${c.relatedTerms.join(', ')}\n`;
      md += '\n';
    });
  }

  if (result.contextExpansion) {
    md += `## 맥락 확장\n\n${result.contextExpansion}\n`;
  }

  return md;
}

function resultToPlainText(result: AnalysisResult): string {
  let text = `[개선된 텍스트]\n${result.improved}\n`;

  if (result.changes?.length) {
    text += `\n[개선 사항]\n`;
    result.changes.forEach((c, i) => { text += `${i + 1}. ${c}\n`; });
  }

  if (result.keywords?.length) {
    text += `\n[핵심 키워드]\n`;
    result.keywords.forEach(k => { text += `• ${k.word}: ${k.definition}\n`; });
  }

  if (result.contextExpansion) {
    text += `\n[맥락 확장]\n${result.contextExpansion}\n`;
  }

  return text;
}

function resultToHTML(result: AnalysisResult): string {
  let html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>SmartWriter AI 결과</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1e293b}
h2{color:#2563eb;border-bottom:2px solid #e2e8f0;padding-bottom:4px}h3{color:#7c3aed}
.keyword{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:12px;margin:2px;font-size:0.9em}
.change{margin:4px 0}</style></head><body>\n`;

  html += `<h2>개선된 텍스트</h2><p>${result.improved.replace(/\n/g, '<br>')}</p>\n`;

  if (result.changes?.length) {
    html += `<h2>개선 사항</h2><ol>`;
    result.changes.forEach(c => { html += `<li class="change">${c}</li>`; });
    html += `</ol>\n`;
  }

  if (result.keywords?.length) {
    html += `<h2>핵심 키워드</h2><p>`;
    result.keywords.forEach(k => { html += `<span class="keyword" title="${k.definition}">${k.word}</span> `; });
    html += `</p>\n`;
  }

  if (result.contextExpansion) {
    html += `<h2>맥락 확장</h2><p>${result.contextExpansion}</p>\n`;
  }

  html += `</body></html>`;
  return html;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportResult(result: AnalysisResult, format: 'md' | 'txt' | 'html') {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
  switch (format) {
    case 'md':
      downloadFile(resultToMarkdown(result), `smartwriter-${timestamp}.md`, 'text/markdown');
      break;
    case 'txt':
      downloadFile(resultToPlainText(result), `smartwriter-${timestamp}.txt`, 'text/plain');
      break;
    case 'html':
      downloadFile(resultToHTML(result), `smartwriter-${timestamp}.html`, 'text/html');
      break;
  }
}
