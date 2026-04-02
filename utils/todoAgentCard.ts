/** 旧版：整块卡片（兼容已存 HTML） */
export const TODO_AGENT_CARD_CLASS = 'todo-agent-card';

/** 新版：普通正文行容器 + 行尾状态点 */
export const TODO_AGENT_LINE_CLASS = 'todo-agent-line';

/** 行尾状态文案胶囊（loading/answered） */
export const TODO_AGENT_STATUS_TEXT_CLASS = 'todo-agent-status-text';

function isAgentMarkerEl(n: HTMLElement, conversationId: string): boolean {
  if (n.getAttribute('data-conversation-id') !== conversationId) return false;
  return (
    n.classList.contains(TODO_AGENT_STATUS_TEXT_CLASS) ||
    n.classList.contains(TODO_AGENT_CARD_CLASS)
  );
}

/**
 * 将选中内容包成「普通正文 + 行尾状态标签」，不改变正文颜色/底纹。
 */
export function wrapSelectionInAgentCard(
  editor: HTMLElement,
  conversationId: string,
  labels: { thinking: string; answered: string }
): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  const row = document.createElement('span');
  row.className = TODO_AGENT_LINE_CLASS;
  row.setAttribute('data-todo-agent-row', '1');

  const textWrap = document.createElement('span');
  textWrap.className = 'todo-agent-line-text';

  const status = document.createElement('span');
  status.className = TODO_AGENT_STATUS_TEXT_CLASS;
  status.setAttribute('data-conversation-id', conversationId);
  status.setAttribute('data-agent-state', 'loading');
  status.setAttribute('data-label-thinking', labels.thinking);
  status.setAttribute('data-label-answered', labels.answered);
  status.setAttribute('contenteditable', 'false');
  status.setAttribute('role', 'button');
  status.setAttribute('tabindex', '0');
  status.setAttribute('title', labels.thinking);
  status.textContent = labels.thinking;

  const frag = range.extractContents();
  textWrap.appendChild(frag);

  row.appendChild(textWrap);
  row.appendChild(status);
  range.insertNode(row);

  sel.removeAllRanges();
  const endRange = document.createRange();
  endRange.setStartAfter(row);
  endRange.collapse(true);
  sel.addRange(endRange);

  return true;
}

/** 持久 HTML 中更新对应会话状态（新结构在 status 上；旧数据在 card 上） */
export function setAgentCardStateInHtml(
  html: string,
  conversationId: string,
  state: 'loading' | 'answered'
): string {
  if (!html || !conversationId) return html;
  const host = document.createElement('div');
  host.innerHTML = html;
  const nodes = host.querySelectorAll<HTMLElement>(`[data-conversation-id]`);
  let targetEl: HTMLElement | null = null;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (isAgentMarkerEl(n, conversationId)) {
      targetEl = n;
      break;
    }
  }
  if (!targetEl) return html;
  targetEl.setAttribute('data-agent-state', state);
  if (targetEl.classList.contains(TODO_AGENT_STATUS_TEXT_CLASS)) {
    const next =
      state === 'answered'
        ? targetEl.getAttribute('data-label-answered') || targetEl.textContent || ''
        : targetEl.getAttribute('data-label-thinking') || targetEl.textContent || '';
    targetEl.textContent = next;
    targetEl.setAttribute('title', next);
  }
  return host.innerHTML;
}

/** 批量更新 HTML 中所有 Agent 状态标签的双语文本。 */
export function setAgentCardLabelsInHtml(
  html: string,
  labels: { thinking: string; answered: string }
): string {
  if (!html) return html;
  const host = document.createElement('div');
  host.innerHTML = html;
  const nodes = host.querySelectorAll<HTMLElement>(`[data-conversation-id].${TODO_AGENT_STATUS_TEXT_CLASS}`);
  if (!nodes.length) return html;
  nodes.forEach((el) => {
    el.setAttribute('data-label-thinking', labels.thinking);
    el.setAttribute('data-label-answered', labels.answered);
    const state = el.getAttribute('data-agent-state');
    const text = state === 'answered' ? labels.answered : labels.thinking;
    el.textContent = text;
    el.setAttribute('title', text);
  });
  return host.innerHTML;
}

/**
 * 聚焦编辑器时：把正文里 Agent 状态从 canonical HTML 同步到当前 DOM（只改 data-agent-state）。
 */
export function syncAgentCardStatesInEditor(editor: HTMLElement, canonicalHtml: string): void {
  if (!canonicalHtml) return;
  const host = document.createElement('div');
  host.innerHTML = canonicalHtml;
  const stateById = new Map<string, string>();
  const labelById = new Map<string, { thinking?: string; answered?: string }>();
  host.querySelectorAll<HTMLElement>(`[data-conversation-id]`).forEach((el) => {
    if (!el.classList.contains(TODO_AGENT_STATUS_TEXT_CLASS) && !el.classList.contains(TODO_AGENT_CARD_CLASS)) {
      return;
    }
    const id = el.getAttribute('data-conversation-id');
    const st = el.getAttribute('data-agent-state');
    if (id && st) {
      stateById.set(id, st);
      labelById.set(id, {
        thinking: el.getAttribute('data-label-thinking') || undefined,
        answered: el.getAttribute('data-label-answered') || undefined,
      });
    }
  });
  if (stateById.size === 0) return;

  editor.querySelectorAll<HTMLElement>(`[data-conversation-id]`).forEach((el) => {
    if (!el.classList.contains(TODO_AGENT_STATUS_TEXT_CLASS) && !el.classList.contains(TODO_AGENT_CARD_CLASS)) {
      return;
    }
    const id = el.getAttribute('data-conversation-id');
    if (!id) return;
    const want = stateById.get(id);
    if (want && el.getAttribute('data-agent-state') !== want) {
      el.setAttribute('data-agent-state', want);
    }
    const labels = labelById.get(id);
    if (labels?.thinking) el.setAttribute('data-label-thinking', labels.thinking);
    if (labels?.answered) el.setAttribute('data-label-answered', labels.answered);
    if (el.classList.contains(TODO_AGENT_STATUS_TEXT_CLASS)) {
      const text =
        want === 'answered'
          ? labels?.answered || el.getAttribute('data-label-answered') || ''
          : labels?.thinking || el.getAttribute('data-label-thinking') || '';
      if (text) {
        el.textContent = text;
        el.setAttribute('title', text);
      }
    }
  });
}
