declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** 在 SPA 路由切换后上报页面浏览（需在 gtag config 里关闭自动 send_page_view）。 */
export function trackPageView(): void {
  if (typeof window.gtag !== 'function') return;
  const pagePath = window.location.pathname + window.location.search;
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: window.location.href,
  });
}

/** 自定义事件埋点，例如 gtagEvent('sign_up', { method: 'clerk' }) */
export function gtagEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
