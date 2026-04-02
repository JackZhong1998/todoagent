const MOONSHOT_URL = 'https://api.moonshot.cn/v1/chat/completions';

/** 与聊天分开：Todo 正文幽灵补全默认用 turbo。 */
export const DEFAULT_INLINE_MODEL = 'kimi-k2-turbo-preview';

const SYSTEM_PROMPT = `You are an inline text continuation engine for the user's personal task note (plain text / Markdown-style outline).
Output ONLY the characters that should be inserted immediately after the user's cursor. Rules:
- No quotes, no markdown code fences, no labels like "Completion:".
- Do not repeat or re-output any text from the given prefix.
- Match the user's language (Chinese if the note is Chinese, etc.).
- Continue naturally for at most about one short sentence or one list line; stop at a sensible boundary.
- You may output a newline when continuing a bullet/numbered list line.`;

export function getPlainTextBeforeCaret(editor: HTMLElement): string | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const endRange = sel.getRangeAt(0);
  if (!editor.contains(endRange.commonAncestorContainer)) return null;

  const r = document.createRange();
  r.selectNodeContents(editor);
  r.setEnd(endRange.endContainer, endRange.endOffset);
  const frag = r.cloneContents();
  const div = document.createElement('div');
  div.appendChild(frag);
  const text = (div.innerText || div.textContent || '').replace(/\u00a0/g, ' ');
  return text;
}

export function getCaretClientRect(editor: HTMLElement): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;

  let rects = range.getClientRects();
  if (rects.length === 0) {
    const fallback = range.getBoundingClientRect();
    if (fallback.width === 0 && fallback.height === 0) return null;
    return fallback;
  }
  return rects[rects.length - 1];
}

export function stripRedundantOverlap(prefix: string, completion: string): string {
  let out = completion;
  const maxK = Math.min(prefix.length, out.length, 120);
  for (let k = maxK; k >= 1; k--) {
    if (prefix.endsWith(out.slice(0, k))) {
      out = out.slice(k);
      break;
    }
  }
  return out;
}

function trimModelFat(completion: string): string {
  let s = completion.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```[\w]*\n?/, '').replace(/\n?```\s*$/, '');
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s;
}

export async function fetchTodoInlineCompletion(
  prefix: string,
  options: { apiKey: string; signal?: AbortSignal }
): Promise<string> {
  const model = import.meta.env.VITE_MOONSHOT_INLINE_MODEL || DEFAULT_INLINE_MODEL;
  const response = await fetch(MOONSHOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prefix },
      ],
      temperature: 0.35,
      max_tokens: 128,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content ?? '';
  return trimModelFat(raw);
}

export function insertPlainTextAtCaret(text: string): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}
