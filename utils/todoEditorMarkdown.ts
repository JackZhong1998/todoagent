/**
 * Todo 编辑器行首 Markdown：在任意时刻输入整行符合规则的内容时转换（如 `1. 测试`、`- 项`、`# 标题`）。
 */

const BLOCK_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, div';

const H1_CLASS = 'text-3xl font-bold text-black mt-6 mb-4 leading-tight';
const H2_CLASS = 'text-2xl font-semibold text-gray-500 mt-5 mb-3 leading-snug';
const H3_CLASS = 'text-lg font-medium text-gray-600 mt-4 mb-2';
const HR_CLASS = 'my-6 border-0 border-t border-gray-200';

function findContentBlock(node: Node | null, editor: HTMLElement): HTMLElement {
  let el: HTMLElement | null =
    node?.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement | null) : (node as HTMLElement | null);
  while (el && editor.contains(el)) {
    if (el !== editor && el.matches(BLOCK_SELECTORS)) return el;
    el = el.parentElement;
  }
  return editor;
}

function blockFlatText(block: HTMLElement): string {
  const r = document.createRange();
  r.selectNodeContents(block);
  return r.toString();
}

function caretOffsetInBlock(block: HTMLElement, focusNode: Node, focusOffset: number): number {
  const r = document.createRange();
  try {
    r.setStart(block, 0);
    r.setEnd(focusNode, focusOffset);
    return r.toString().length;
  } catch {
    return 0;
  }
}

/** 将「与 blockFlatText / Range.toString 一致」的字符偏移映射为 Range 端点。 */
function boundaryAtFlatOffset(block: HTMLElement, offset: number, flatLen: number): { node: Node; offset: number } {
  if (offset <= 0) {
    const r = document.createRange();
    r.selectNodeContents(block);
    r.collapse(true);
    return { node: r.startContainer, offset: r.startOffset };
  }
  if (offset >= flatLen) {
    const r = document.createRange();
    r.selectNodeContents(block);
    r.collapse(false);
    return { node: r.startContainer, offset: r.startOffset };
  }

  let acc = 0;
  function walk(n: Node): { node: Node; offset: number } | null {
    if (n.nodeType === Node.TEXT_NODE) {
      const t = n as Text;
      const len = t.length;
      if (acc + len >= offset) return { node: t, offset: offset - acc };
      acc += len;
      return null;
    }
    if (n.nodeName === 'BR') {
      if (acc === offset) {
        const p = n.parentNode!;
        return { node: p, offset: Array.prototype.indexOf.call(p.childNodes, n) };
      }
      if (acc + 1 >= offset) {
        const p = n.parentNode!;
        const idx = Array.prototype.indexOf.call(p.childNodes, n);
        return { node: p, offset: idx + 1 };
      }
      acc += 1;
      return null;
    }
    for (let i = 0; i < n.childNodes.length; i++) {
      const hit = walk(n.childNodes[i]);
      if (hit) return hit;
    }
    return null;
  }

  const hit = walk(block);
  if (hit) return hit;
  const r = document.createRange();
  r.selectNodeContents(block);
  r.collapse(false);
  return { node: r.startContainer, offset: r.startOffset };
}

function flatRangeForLine(block: HTMLElement, flat: string, caret: number): Range | null {
  const lineStart = flat.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
  const nextNl = flat.indexOf('\n', caret);
  const lineEnd = nextNl === -1 ? flat.length : nextNl;
  if (lineStart >= lineEnd) return null;

  const start = boundaryAtFlatOffset(block, lineStart, flat.length);
  const end = boundaryAtFlatOffset(block, lineEnd, flat.length);
  const range = document.createRange();
  try {
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range;
  } catch {
    return null;
  }
}

type FullMatch =
  | { kind: 'h1' | 'h2' | 'h3'; content: string }
  | { kind: 'ul' | 'ol'; content: string }
  | { kind: 'todo'; content: string }
  | { kind: 'code' }
  | { kind: 'hr' };

function matchFullLine(line: string): FullMatch | null {
  const s = line.replace(/\u00a0/g, ' ');
  if (/^###\s+(.+)$/.test(s)) return { kind: 'h3', content: RegExp.$1 };
  if (/^##\s+(.+)$/.test(s)) return { kind: 'h2', content: RegExp.$1 };
  if (/^#\s+(.+)$/.test(s)) return { kind: 'h1', content: RegExp.$1 };
  if (/^\d+\.\s+(.+)$/.test(s)) return { kind: 'ol', content: RegExp.$1 };
  if (/^\d+\.\s+$/.test(s)) return { kind: 'ol', content: '' };
  if (/^[-*]\s+(.+)$/.test(s)) return { kind: 'ul', content: RegExp.$1 };
  if (/^[-*]\s+$/.test(s)) return { kind: 'ul', content: '' };
  if (/^\[\]\s*(.*)$/.test(s)) return { kind: 'todo', content: RegExp.$1 };
  if (/^```\s*\w*\s*$/.test(s)) return { kind: 'code' };
  if (/^---+\s*$/.test(s)) return { kind: 'hr' };
  return null;
}

const TODO_LINE_HTML =
  '<p class="flex items-start gap-2 my-1"><span class="todo-md-check" data-todo-check="1" data-todo-checked="0" contenteditable="false"></span><span class="todo-md-content">\u00A0</span></p>';

function createTodoParagraph(content: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.innerHTML = TODO_LINE_HTML;
  const p = wrap.firstElementChild as HTMLElement;
  if (!p) throw new Error('todo template');
  const textSpan = p.querySelector('.todo-md-content');
  if (textSpan) textSpan.textContent = content === '' ? '\u00A0' : content;
  return p;
}

function makeHeading(tag: 'h1' | 'h2' | 'h3', content: string): HTMLElement {
  const el = document.createElement(tag);
  if (tag === 'h1') el.className = H1_CLASS;
  else if (tag === 'h2') el.className = H2_CLASS;
  else el.className = H3_CLASS;
  el.textContent = content;
  return el;
}

function makeList(ordered: boolean, content: string): HTMLElement {
  const list = document.createElement(ordered ? 'ol' : 'ul');
  const li = document.createElement('li');
  if (content) li.textContent = content;
  else li.appendChild(document.createElement('br'));
  list.appendChild(li);
  return list;
}

function listStartNumber(ol: HTMLOListElement): number {
  const raw = Number(ol.getAttribute('start') || '1');
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}

function getPreviousOrderedListLastNumber(editor: HTMLElement, currentList: HTMLOListElement): number | null {
  const orderedLists = Array.from(editor.querySelectorAll('ol')) as HTMLOListElement[];
  const idx = orderedLists.indexOf(currentList);
  if (idx <= 0) return null;
  for (let i = idx - 1; i >= 0; i -= 1) {
    const prev = orderedLists[i];
    const lis = prev.querySelectorAll(':scope > li');
    if (!lis.length) continue;
    return listStartNumber(prev) + lis.length - 1;
  }
  return null;
}

function maybeContinueOrderedList(editor: HTMLElement, list: HTMLElement) {
  if (list.tagName !== 'OL') return;
  const ol = list as HTMLOListElement;
  const prevLast = getPreviousOrderedListLastNumber(editor, ol);
  if (prevLast !== null) {
    ol.setAttribute('start', String(prevLast + 1));
  }
}

function insertCodeBlock(): HTMLElement {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.appendChild(document.createElement('br'));
  pre.appendChild(code);
  pre.className =
    'bg-gray-50 text-gray-800 p-4 rounded-lg my-3 font-mono text-sm border border-gray-100 overflow-x-auto block';
  return pre;
}

function collapseCaretAfter(node: Node) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  const name = node.nodeName;
  if (name === 'HR') {
    r.setStartAfter(node);
    r.collapse(true);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const todoSpan = el.querySelector('.todo-md-check')?.nextElementSibling;
    if (todoSpan) {
      r.selectNodeContents(todoSpan);
      r.collapse(false);
    } else {
      const li = el.querySelector('li');
      const code = el.querySelector('code');
      const target = li ?? code ?? el;
      r.selectNodeContents(target);
      r.collapse(false);
    }
  } else {
    r.setStartAfter(node);
    r.collapse(true);
  }
  sel.removeAllRanges();
  sel.addRange(r);
}

function applyFullLine(range: Range, m: FullMatch): boolean {
  range.deleteContents();
  let inserted: Node;
  switch (m.kind) {
    case 'h1':
      inserted = makeHeading('h1', m.content);
      break;
    case 'h2':
      inserted = makeHeading('h2', m.content);
      break;
    case 'h3':
      inserted = makeHeading('h3', m.content);
      break;
    case 'ol':
      inserted = makeList(true, m.content);
      break;
    case 'ul':
      inserted = makeList(false, m.content);
      break;
    case 'todo':
      inserted = createTodoParagraph(m.content);
      break;
    case 'code':
      inserted = insertCodeBlock();
      break;
    case 'hr': {
      const hr = document.createElement('hr');
      hr.className = HR_CLASS;
      inserted = hr;
      break;
    }
    default:
      return false;
  }
  range.insertNode(inserted);
  if (inserted.nodeType === Node.ELEMENT_NODE) {
    const root = (inserted as HTMLElement).closest('[data-todo-editor="1"]') as HTMLElement | null;
    if (root && (inserted as HTMLElement).tagName === 'OL') {
      maybeContinueOrderedList(root, inserted as HTMLElement);
    }
  }
  collapseCaretAfter(inserted);
  return true;
}

/**
 * 当前行从行首起匹配 Markdown 规则时，用对应 HTML 替换整行。
 */
function getTextSplitAtCaret(container: HTMLElement, focusNode: Node, focusOffset: number): { before: string; after: string } {
  const rBefore = document.createRange();
  rBefore.selectNodeContents(container);
  try {
    rBefore.setEnd(focusNode, focusOffset);
  } catch {
    return { before: container.textContent ?? '', after: '' };
  }
  const rAfter = document.createRange();
  rAfter.selectNodeContents(container);
  try {
    rAfter.setStart(focusNode, focusOffset);
  } catch {
    return { before: container.textContent ?? '', after: '' };
  }
  return { before: rBefore.toString(), after: rAfter.toString() };
}

function findTodoSubtaskParagraph(editor: HTMLElement, node: Node | null): HTMLElement | null {
  let n: Node | null = node;
  while (n && n !== editor) {
    if (n.nodeType === Node.ELEMENT_NODE) {
      const el = n as HTMLElement;
      if (el.tagName === 'P' && el.querySelector('.todo-md-check')) return el;
    }
    n = n.parentNode;
  }
  return null;
}

/** 光标不在 content span 内时（常见于 WebKit 把选区落在 `<p>` 尾部），用边界比较推断 before/after。 */
function resolveTodoSubtaskSplit(
  todoLine: HTMLElement,
  contentSpan: HTMLElement,
  focusNode: Node,
  focusOffset: number,
): { before: string; after: string } {
  const check = todoLine.querySelector('.todo-md-check');
  if (check?.contains(focusNode)) {
    const full = contentSpan.textContent ?? '';
    return { before: '', after: full };
  }
  if (contentSpan.contains(focusNode)) {
    return getTextSplitAtCaret(contentSpan, focusNode, focusOffset);
  }

  const rCaret = document.createRange();
  try {
    rCaret.setStart(focusNode, focusOffset);
    rCaret.collapse(true);
  } catch {
    const full = contentSpan.textContent ?? '';
    return { before: full, after: '' };
  }

  const rStart = document.createRange();
  rStart.selectNodeContents(contentSpan);
  rStart.collapse(true);
  const rEnd = document.createRange();
  rEnd.selectNodeContents(contentSpan);
  rEnd.collapse(false);

  const full = contentSpan.textContent ?? '';
  if (rCaret.compareBoundaryPoints(Range.START_TO_START, rStart) <= 0) {
    return { before: '', after: full };
  }
  if (rCaret.compareBoundaryPoints(Range.START_TO_START, rEnd) >= 0) {
    return { before: full, after: '' };
  }
  return { before: full, after: '' };
}

/**
 * 在子任务行按 Enter：当前行在光标处截断，下方插入新的子任务行并把光标落入新行正文。
 */
export function handleTodoSubtaskEnter(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed || !sel.focusNode || !editor.contains(sel.focusNode)) return false;

  const todoLine = findTodoSubtaskParagraph(editor, sel.focusNode);
  if (!todoLine) return false;

  const contentSpan = todoLine.querySelector('.todo-md-content') as HTMLElement | null;
  if (!contentSpan || !editor.contains(contentSpan)) return false;

  const { before, after } = resolveTodoSubtaskSplit(todoLine, contentSpan, sel.focusNode, sel.focusOffset);

  contentSpan.textContent = before === '' ? '\u00A0' : before;

  const newP = createTodoParagraph(after);
  todoLine.parentNode?.insertBefore(newP, todoLine.nextSibling);

  const newContent = newP.querySelector('.todo-md-content') as HTMLElement;
  const r = document.createRange();
  let tn = newContent.firstChild;
  if (!tn || tn.nodeType !== Node.TEXT_NODE) {
    newContent.textContent = after === '' ? '\u00A0' : after;
    tn = newContent.firstChild;
  }
  if (tn && tn.nodeType === Node.TEXT_NODE) {
    r.setStart(tn, 0);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
  return true;
}

/** 在空子任务行按 Backspace：删除当前行并把光标并到上一行，避免需要多次删除。 */
export function handleTodoSubtaskBackspace(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed || !sel.focusNode || !editor.contains(sel.focusNode)) return false;

  const todoLine = findTodoSubtaskParagraph(editor, sel.focusNode);
  if (!todoLine) return false;
  const contentSpan = todoLine.querySelector('.todo-md-content') as HTMLElement | null;
  if (!contentSpan) return false;

  const content = (contentSpan.textContent || '').replace(/\u00A0/g, '').trim();
  if (content.length > 0) return false;

  const prev = todoLine.previousElementSibling as HTMLElement | null;
  if (!prev) return false;

  todoLine.remove();

  const target = (prev.querySelector('.todo-md-content') as HTMLElement | null) || prev;
  const r = document.createRange();
  r.selectNodeContents(target);
  r.collapse(false);
  sel.removeAllRanges();
  sel.addRange(r);
  return true;
}

export function getPreviousOrderedListNextStart(editor: HTMLElement, currentList: HTMLOListElement): number | null {
  const prevLast = getPreviousOrderedListLastNumber(editor, currentList);
  return prevLast === null ? null : prevLast + 1;
}

export function applyMarkdownLineTriggers(editor: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel?.focusNode || !editor.contains(sel.focusNode) || !sel.isCollapsed) return false;

  const block = findContentBlock(sel.focusNode, editor);
  const flat = blockFlatText(block);
  const caret = caretOffsetInBlock(block, sel.focusNode, sel.focusOffset);
  const lineStart = flat.lastIndexOf('\n', Math.max(0, caret - 1)) + 1;
  const nextNl = flat.indexOf('\n', caret);
  const lineEnd = nextNl === -1 ? flat.length : nextNl;
  const lineText = flat.slice(lineStart, lineEnd);
  const m = matchFullLine(lineText);
  if (!m) return false;

  const lineRange = flatRangeForLine(block, flat, caret);
  if (!lineRange) return false;
  return applyFullLine(lineRange, m);
}

export function selectionHtmlInsideEditor(editor: HTMLElement): string | null {
  const sel = window.getSelection();
  if (!sel?.rangeCount || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  if (!editor.contains(r.commonAncestorContainer)) return null;
  const div = document.createElement('div');
  div.appendChild(r.cloneContents());
  return div.innerHTML;
}
