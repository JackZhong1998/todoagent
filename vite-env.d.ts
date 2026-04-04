/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 为 true 时经 /api/moonshot/completions 调用 Kimi，并在服务端校验订阅与每日免费次数 */
  readonly VITE_MOONSHOT_USE_PROXY?: string;
  readonly VITE_MOONSHOT_API_KEY?: string;
  readonly VITE_MOONSHOT_MODEL?: string;
  readonly VITE_SITE_URL?: string;
}
