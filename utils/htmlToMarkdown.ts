/**
 * Best-effort HTML → Markdown for todo rich text (subset of tags).
 * Used for clipboard plain text so pasting elsewhere keeps Markdown shape.
 */
function escapeMd(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\*/g, '\\*');
}

function walk(node: Node, lines: string[], listDepth: number): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent ?? '';
    if (t) lines.push(t);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  const blockEnd = () => {
    if (lines.length && !lines[lines.length - 1].endsWith('\n')) lines.push('\n');
  };

  switch (tag) {
    case 'br':
      lines.push('\n');
      return;
    case 'h1':
      blockEnd();
      lines.push('# ');
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('\n\n');
      return;
    case 'h2':
      blockEnd();
      lines.push('## ');
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('\n\n');
      return;
    case 'h3':
      blockEnd();
      lines.push('### ');
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('\n\n');
      return;
    case 'p':
      blockEnd();
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('\n\n');
      return;
    case 'hr':
      blockEnd();
      lines.push('---\n\n');
      return;
    case 'div':
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      return;
    case 'strong':
    case 'b':
      lines.push('**');
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('**');
      return;
    case 'em':
    case 'i':
      lines.push('*');
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('*');
      return;
    case 's':
    case 'del':
    case 'strike':
      lines.push('~~');
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      lines.push('~~');
      return;
    case 'code':
      if (el.parentElement?.tagName.toLowerCase() === 'pre') {
        el.childNodes.forEach((c) => walk(c, lines, listDepth));
      } else {
        lines.push('`');
        lines.push(escapeMd((el.textContent ?? '').replace(/\n/g, ' ')));
        lines.push('`');
      }
      return;
    case 'pre': {
      blockEnd();
      const code = el.querySelector('code');
      const body = (code?.textContent ?? el.textContent ?? '').replace(/\n$/, '');
      lines.push('```\n', body, '\n```\n\n');
      return;
    }
    case 'blockquote':
      blockEnd();
      const inner: string[] = [];
      el.childNodes.forEach((c) => walk(c, inner, listDepth));
      const text = inner.join('').trim().split('\n').map((l) => `> ${l}`).join('\n');
      lines.push(text, '\n\n');
      return;
    case 'ul':
      blockEnd();
      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
          lines.push(`${'  '.repeat(listDepth)}- `);
          const li = child as HTMLElement;
          const buf: string[] = [];
          li.childNodes.forEach((c) => walk(c, buf, listDepth + 1));
          lines.push(buf.join('').trim(), '\n');
        } else walk(child, lines, listDepth);
      });
      lines.push('\n');
      return;
    case 'ol': {
      blockEnd();
      let i = 1;
      el.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName.toLowerCase() === 'li') {
          lines.push(`${'  '.repeat(listDepth)}${i}. `);
          i += 1;
          const li = child as HTMLElement;
          const buf: string[] = [];
          li.childNodes.forEach((c) => walk(c, buf, listDepth + 1));
          lines.push(buf.join('').trim(), '\n');
        } else walk(child, lines, listDepth);
      });
      lines.push('\n');
      return;
    }
    case 'li':
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      return;
    case 'img': {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      lines.push(`![${alt.replace(/]/g, '')}](${src})`);
      return;
    }
    case 'input': {
      if (el.getAttribute('type') === 'checkbox') {
        const input = el as HTMLInputElement;
        lines.push(input.checked ? '[x] ' : '[ ] ');
      }
      return;
    }
    case 'span':
      if (el.classList.contains('todo-md-check') || el.dataset.todoCheck === '1') {
        lines.push(el.dataset.todoChecked === '1' ? '[x] ' : '[ ] ');
        return;
      }
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
      return;
    default:
      el.childNodes.forEach((c) => walk(c, lines, listDepth));
  }
}

export function htmlToMarkdown(html: string): string {
  if (!html.trim()) return '';
  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = html;
  const lines: string[] = [];
  doc.body.childNodes.forEach((n) => walk(n, lines, 0));
  return lines
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
