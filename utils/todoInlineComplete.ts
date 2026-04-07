const MOONSHOT_URL = 'https://api.moonshot.cn/v1/chat/completions';

/** 与聊天分开：Todo 正文幽灵补全默认用 turbo。 */
export const DEFAULT_INLINE_MODEL = 'kimi-k2-turbo-preview';

const SYSTEM_PROMPT = `You are a tiny inline phrase suggester for the user's personal task note (plain text / Markdown-style outline).
Output ONLY the next few characters that fit immediately after the cursor — enough to nudge the user forward, NOT to finish the whole sentence or line.
Rules:
- Output at most 10 characters (same script as the note; count letters/CJK chars, no long runs).
- No quotes, no markdown fences, no labels like "Completion:".
- Do not repeat any suffix of the given context.
- Match the user's language (Chinese if the note is Chinese, etc.).
- Prefer a natural phrase tail (e.g. 的下一步、；以便) rather than a full stop or newline unless the prefix clearly ends a list marker.`;

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

/** 光标后的纯文本（从光标到编辑器末尾）。用于判断是否在「句末/插入点末端」避免在句中编辑时触发补全。 */
export function getPlainTextAfterCaret(editor: HTMLElement): string | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const startRange = sel.getRangeAt(0);
  if (!editor.contains(startRange.commonAncestorContainer)) return null;

  const r = document.createRange();
  r.selectNodeContents(editor);
  r.setStart(startRange.startContainer, startRange.startOffset);
  const frag = r.cloneContents();
  const div = document.createElement('div');
  div.appendChild(frag);
  return (div.innerText || div.textContent || '').replace(/\u00a0/g, ' ');
}

/**
 * 仅当光标在「可续写边缘」时请求补全：后面没有非空白内容（不在句中点选修改）。
 * 送入模型的仍是：从文档开头到光标的全文 `prefix`（system + user 消息）；未另传标题或其它字段。
 */
export function shouldRequestTodoInlineCompletion(editor: HTMLElement): boolean {
  const after = getPlainTextAfterCaret(editor);
  if (after === null) return false;
  return after.trim().length === 0;
}

const MAX_COMPLETION_GRAPHEMES = 10;

function limitCompletionGraphemes(text: string, max: number): string {
  const t = text.trim();
  if (!t || max <= 0) return '';
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const parts: string[] = [];
    let n = 0;
    for (const { segment } of seg.segment(t)) {
      parts.push(segment);
      n += 1;
      if (n >= max) break;
    }
    return parts.join('');
  } catch {
    return [...t].slice(0, max).join('');
  }
}

/** 截断并去掉可能的多余句末标点，避免模型一次输出整句 */
export function finalizeTodoInlineCompletion(completion: string): string {
  let s = limitCompletionGraphemes(completion, MAX_COMPLETION_GRAPHEMES);
  s = s.replace(/[。！？.!?]+$/g, '');
  return s.trim();
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
      max_tokens: 32,
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
