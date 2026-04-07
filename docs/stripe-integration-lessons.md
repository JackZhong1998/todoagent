# Stripe 接入踩坑与经验总结（Vercel Serverless + Clerk + Supabase）

本文档基于本仓库（Vite 前端 + Vercel `api/**/*.ts` 服务端）接入 **Stripe Checkout 订阅**、**Webhook**、**权益判定** 时遇到的问题，供后续项目或二次集成时对照。

---

## 1. Vercel / Node ESM：相对路径必须带 `.js` 扩展名

**现象**：部署后 `FUNCTION_INVOCATION_FAILED`，日志里 `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/auth'`，引用来自 `create-checkout-session.js` 等。

**原因**：TypeScript 编译为 ESM 后，`import '../_lib/auth'` 在 Node 下**不会**自动补全 `.js`；运行时解析失败，进程直接退出。参见 [Vercel：FUNCTION_INVOCATION_FAILED](https://vercel.com/docs/errors/FUNCTION_INVOCATION_FAILED)。

**做法**：

- 在 **`api/` 下所有相对路径 import** 写 **`../_lib/xxx.js`**（源码仍是 `xxx.ts`，TypeScript 会解析到对应 `.ts` 文件）。
- 用 `npx tsc --noEmit -p api/tsconfig.json` 做 API 侧类型检查。

---

## 2. `customer_creation` 不能与 `mode: 'subscription'` 同时使用

**现象**：创建 Checkout Session 返回 400，Stripe 报错：`` `customer_creation` can only be used in `payment` mode ``；前端看到 502 / `stripe_checkout_failed`。

**原因**：`customer_creation` **仅适用于**一次性收款的 **`payment`** 模式；**订阅**应省略该字段。

**做法**：

- 订阅场景：有历史 `stripe_customer_id` 时传 `customer`；**没有时不要传 `customer_creation`**，Checkout 会在完成订阅流程时自动创建 Customer。

---

## 3. 支付成功 ≠ 业务侧「已订阅」：Webhook 与数据库必须闭环

**现象**：用户付完款回到站点，`/api/billing/entitlement` 仍返回 `isPaid: false`（数据库 `todoagent_user_billing` 无正确行或未更新）。

**常见原因**：

| 原因 | 说明 |
|------|------|
| Webhook 未配置或 URL 错误 | 未指向 `https://你的域名/api/stripe/webhook` |
| 签名密钥环境不一致 | `STRIPE_WEBHOOK_SECRET` 与 `STRIPE_SECRET_KEY` 必须同为 **test** 或 **live** |
| 事件类型不全 | 至少处理 `checkout.session.completed`；建议同时处理 `customer.subscription.created` / `updated` / `deleted` |
| 静默跳过逻辑 | 若写死 `typeof session.subscription === 'string'`，当 Stripe 载荷里为**展开对象**时会失败，应统一用「字符串或 `{ id }`」解析 |

**做法**：

- Dashboard 配置 Webhook，并核对 Vercel 环境变量。
- Webhook 内对 `customer`、`subscription` 做 **ID 归一化**（见本仓库 `api/_lib/stripeBillingUpsert.ts` 中的 `stripeExpandableId`）。
- **强烈建议**：在 `success_url` 中加入 `{CHECKOUT_SESSION_ID}`，回站后由服务端 **再拉一次 Session 并 upsert**（本仓库 `POST /api/stripe/confirm-checkout-session`），作为 Webhook 延迟或漏发时的兜底。

---

## 4. `success_url` 里用 `{CHECKOUT_SESSION_ID}` 做兜底同步

**经验**：仅依赖 Webhook 时，用户回跳往往早于 Webhook 落库，或 Webhook 失败，体验上会一直卡在「已付钱但仍像免费用户」。

**做法**：

- `success_url` 示例：`https://example.com/app?billing=success&session_id={CHECKOUT_SESSION_ID}`（占位符由 Stripe 替换）。
- 前端检测到 `billing=success` 且存在 `session_id` 时，调用仅服务端可执行的确认接口：`retrieve` Session → 校验 `payment_status`、`mode`、`client_reference_id`（或 metadata）与当前登录用户一致 → 拉取 Subscription → **upsert** 与用户 id 绑定的计费表。

---

## 5. 权益判定与 Stripe 状态字段要对齐

**经验**：业务「是否会员」应对齐 Stripe 常用状态，例如：

- `subscription_status` 为 **`active`** 或 **`trialing`**，且 `current_period_end`（若使用）未过期，再视为付费。
- `canceled` / `incomplete` / `past_due` 等需按产品策略分别处理，避免误放行或误拦截。

数据库字段与 RPC（如 `agent_moonshot_precheck`）应使用**同一套**判定规则，避免「页面显示有额度、接口仍扣费失败」之类不一致。

---

## 6. Vercel 函数配置

**坑**：在 `vercel.json` 的 `functions` 里写非法的 `"runtime": "nodejs20.x"` 可能导致构建/部署失败（以当前 Vercel 文档为准）。

**做法**：用 `package.json` 的 `engines.node` 声明 Node 版本；在 `vercel.json` 中仅配置 `memory`、`maxDuration` 等支持的项。

---

## 7. Serverless 运行时环境差异

**经验**（本仓库曾遇到的相关问题）：

- 避免依赖 **`Buffer`** 等在某些边缘场景行为不一致的 API 处理 JSON；优先 `JSON.stringify` / `TextEncoder` 等更稳妥的写法。
- 响应写入前注意 **`headersSent` / `writableEnded`**：若错误分支提前 `return` 且未写 body，前端只能看到笼统 5xx，难以排查。

---

## 8. Stripe API 版本

**做法**：服务端初始化 Stripe 时使用**固定** `apiVersion`（本仓库与 `package.json` 中 `stripe` 包匹配），避免默认版本漂移导致字段类型或行为变化。

---

## 9. 安全与幂等

- **Webhook**：必须用 **`stripe.webhooks.constructEvent`** 验签；`bodyParser: false` + 原始 body（如 `micro` 的 `buffer`）再验签。
- **确认 Session 接口**：必须校验 Session 归属（`client_reference_id` 或 metadata 中的用户 id 与当前 JWT 用户一致），防止用别人的 `session_id` 给自己写订阅。
- **upsert**：以业务主键（如 `user_id`）`onConflict` 更新，Webhook 与确认接口多次调用应幂等。

---

## 10. 排查清单（上线前 / 出问题时）

1. **创建 Session**：订阅模式不传 `customer_creation`；`success_url` / `cancel_url` 使用可访问的生产域名（或 `SITE_URL`）。
2. **环境变量**：`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`STRIPE_PRICE_ID`、Supabase `SUPABASE_SERVICE_ROLE_KEY` 等与当前 Stripe 模式（test/live）一致。
3. **Webhook**：Stripe Dashboard → 事件投递成功；Vercel Functions 日志无验签错误。
4. **回站**：URL 是否带 `session_id`；确认接口是否 200；Supabase 表是否出现对应 `user_id` 行。
5. **权益接口**：`/api/billing/entitlement` 是否与数据库一致；前端是否在回站后重新拉取（避免仅用本地状态）。

---

## 相关代码位置（本仓库）

| 能力 | 路径 |
|------|------|
| 创建 Checkout | `api/stripe/create-checkout-session.ts` |
| Webhook | `api/stripe/webhook.ts` |
| 回站兜底确认 | `api/stripe/confirm-checkout-session.ts` |
| 订阅 upsert 与 ID 解析 | `api/_lib/stripeBillingUpsert.ts` |
| 权益 JSON | `api/billing/entitlement.ts` |
| 回站触发确认 | `components/AppShell.tsx`（`billing=success`） |

---

*文档随项目演进可继续补充；若 Stripe / Vercel 行为变更，以官方文档为准。*
