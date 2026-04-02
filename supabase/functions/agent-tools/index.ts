// @ts-nocheck — 本文件在 Supabase Edge（Deno）中运行，勿用根目录 Node/Vite 的 TS 校验
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "npm:jose@5";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isPrivateOrBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0") return true;
  if (h.endsWith(".localhost") || h.endsWith(".local")) return true;
  if (h === "127.0.0.1" || h.startsWith("127.")) return true;
  if (h === "::1") return true;
  if (h === "169.254.169.254" || h.endsWith(".internal")) return true;
  if (h.startsWith("10.")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h.startsWith("172.")) {
    const p = h.split(".");
    const n = parseInt(p[1] ?? "", 10);
    if (!Number.isNaN(n) && n >= 16 && n <= 31) return true;
  }
  return false;
}

function assertFetchableUrl(urlStr: string): URL {
  let u: URL;
  try {
    u = new URL(urlStr.trim());
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  if (isPrivateOrBlockedHost(u.hostname)) {
    throw new Error("URL host is not allowed");
  }
  return u;
}

const MAX_FETCH_CHARS = 120_000;
const FETCH_TIMEOUT_MS = 15_000;

async function fetchTextWithTimeout(url: string, headers: Record<string, string>): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "TodoAgent-AgentTools/1.0",
        ...headers,
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    if (text.length > MAX_FETCH_CHARS) {
      return text.slice(0, MAX_FETCH_CHARS) + "\n\n[truncated]";
    }
    return text;
  } finally {
    clearTimeout(t);
  }
}

/** Free tier: Jina Reader — https://jina.ai/reader */
async function fetchViaJina(targetUrl: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;
  return await fetchTextWithTimeout(jinaUrl, {
    Accept: "text/plain",
  });
}

function stripHtmlToText(html: string): string {
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = noScripts.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text;
}

async function fetchUrlDirect(targetUrl: string): Promise<string> {
  const raw = await fetchTextWithTimeout(targetUrl, {
    Accept: "text/html,text/plain;q=0.9,*/*;q=0.8",
  });
  const lower = targetUrl.toLowerCase();
  if (lower.endsWith(".md") || lower.includes("raw.githubusercontent.com")) {
    return raw;
  }
  if (raw.trimStart().startsWith("<")) {
    return stripHtmlToText(raw);
  }
  return raw;
}

async function handleFetchUrl(url: string): Promise<{ markdown: string; source: string }> {
  assertFetchableUrl(url);
  try {
    const md = await fetchViaJina(url);
    if (md && md.length > 50) {
      return { markdown: md, source: "jina_reader" };
    }
  } catch {
    // fall through
  }
  const text = await fetchUrlDirect(url);
  return { markdown: text, source: "direct" };
}

async function handleWebSearch(query: string): Promise<unknown> {
  const key = Deno.env.get("BRAVE_API_KEY")?.trim();
  if (!key) {
    throw new Error("BRAVE_API_KEY is not set on the Edge Function (supabase secrets)");
  }
  const q = query.trim();
  if (!q) throw new Error("Empty query");

  const params = new URLSearchParams({ q, count: "10", search_lang: "en" });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": key,
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brave API ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string; snippet?: string }> };
    news?: { results?: Array<{ title?: string; url?: string; description?: string; snippet?: string }> };
  };
  const fromWeb = data.web?.results ?? [];
  const fromNews = data.news?.results ?? [];
  const merged = [...fromWeb, ...fromNews].map((r) => ({
    title: String(r.title ?? ""),
    url: String(r.url ?? ""),
    description: String(r.description ?? r.snippet ?? ""),
  }));
  const results = merged.filter((r) => r.title || r.url).slice(0, 12);
  console.log("[agent-tools] brave results", { query: q, count: results.length });
  return { results };
}

/** Clerk JWT（如 supabase 模板）不是 Supabase session，auth.getUser 会失败；改用 JWKS 验签。 */
const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksForIssuer(issuer: string) {
  const base = issuer.replace(/\/$/, "");
  let jwks = jwksByIssuer.get(base);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${base}/.well-known/jwks.json`));
    jwksByIssuer.set(base, jwks);
  }
  return jwks;
}

async function verifyClerkSessionJwt(token: string): Promise<{ sub: string } | null> {
  const allowedIss = Deno.env.get("CLERK_JWT_ISSUER")?.trim();
  if (!allowedIss) {
    console.error("[agent-tools] Set secret CLERK_JWT_ISSUER to your Clerk Frontend API URL, e.g. https://xxx.clerk.accounts.dev");
    return null;
  }

  let issFromToken: string;
  try {
    const p = decodeJwt(token);
    issFromToken = typeof p.iss === "string" ? p.iss : "";
  } catch {
    return null;
  }

  if (issFromToken !== allowedIss) {
    console.error("[agent-tools] JWT iss mismatch", { issFromToken, allowedIss });
    return null;
  }

  const audience = Deno.env.get("CLERK_JWT_AUDIENCE")?.trim();
  try {
    const { payload } = await jwtVerify(token, jwksForIssuer(allowedIss), {
      issuer: allowedIss,
      ...(audience ? { audience } : {}),
    });
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    return sub ? { sub } : null;
  } catch (e) {
    console.error("[agent-tools] jwtVerify:", e instanceof Error ? e.message : e);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ ok: false, error: "Missing Authorization" }, 401);
  }

  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return json({ ok: false, error: "Missing bearer token" }, 401);
  }

  const clerkUser = await verifyClerkSessionJwt(jwt);
  if (!clerkUser) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: { action?: string; query?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const action = body.action;
  try {
    if (action === "web_search") {
      const out = await handleWebSearch(String(body.query ?? ""));
      return json({ ok: true, ...out });
    }
    if (action === "fetch_url") {
      const url = String(body.url ?? "");
      const { markdown, source } = await handleFetchUrl(url);
      return json({ ok: true, markdown, source });
    }
    return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, error: msg }, 200);
  }
});
