export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

/**
 * Simple word-level diff between two strings.
 * Uses a basic LCS (Longest Common Subsequence) approach on word tokens.
 */
export function computeWordDiff(oldText: string, newText: string): DiffSegment[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);

  const lcs = buildLCS(oldTokens, newTokens);
  const segments: DiffSegment[] = [];

  let oi = 0;
  let ni = 0;
  let li = 0;

  while (oi < oldTokens.length || ni < newTokens.length) {
    if (li < lcs.length && oi < oldTokens.length && ni < newTokens.length && oldTokens[oi] === lcs[li] && newTokens[ni] === lcs[li]) {
      pushSegment(segments, 'equal', oldTokens[oi]);
      oi++;
      ni++;
      li++;
    } else if (li < lcs.length && ni < newTokens.length && newTokens[ni] === lcs[li] && (oi >= oldTokens.length || oldTokens[oi] !== lcs[li])) {
      pushSegment(segments, 'delete', oldTokens[oi]);
      oi++;
    } else if (li < lcs.length && oi < oldTokens.length && oldTokens[oi] === lcs[li] && (ni >= newTokens.length || newTokens[ni] !== lcs[li])) {
      pushSegment(segments, 'insert', newTokens[ni]);
      ni++;
    } else {
      // Neither matches LCS next
      if (oi < oldTokens.length) {
        pushSegment(segments, 'delete', oldTokens[oi]);
        oi++;
      }
      if (ni < newTokens.length) {
        pushSegment(segments, 'insert', newTokens[ni]);
        ni++;
      }
    }
  }

  return mergeSegments(segments);
}

function tokenize(text: string): string[] {
  // Split into words and whitespace tokens, preserving whitespace
  return text.match(/\S+|\s+/g) || [];
}

function buildLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // For very long texts, limit to avoid performance issues
  if (m * n > 500000) {
    return simpleLCS(a, b);
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

// Simplified LCS for very long texts - uses greedy matching
function simpleLCS(a: string[], b: string[]): string[] {
  const result: string[] = [];
  let j = 0;
  for (let i = 0; i < a.length && j < b.length; i++) {
    const idx = b.indexOf(a[i], j);
    if (idx !== -1) {
      result.push(a[i]);
      j = idx + 1;
    }
  }
  return result;
}

function pushSegment(segments: DiffSegment[], type: DiffSegment['type'], text: string) {
  segments.push({ type, text });
}

function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return segments;
  const merged: DiffSegment[] = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    if (last.type === segments[i].type) {
      last.text += segments[i].text;
    } else {
      merged.push({ ...segments[i] });
    }
  }
  return merged;
}
