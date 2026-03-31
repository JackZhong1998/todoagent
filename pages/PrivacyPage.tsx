import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';

export const PrivacyPage: React.FC = () => {
  return (
    <MarketingLayout>
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-black text-gray-900">隐私协议（初稿）</h1>
        <p className="mt-3 text-gray-500">最近更新：2026-03-30</p>

        <div className="mt-8 space-y-6 text-gray-700 leading-relaxed">
          <p>
            欢迎使用 TodoAgent。我们重视你的个人信息与数据安全。本协议用于说明我们如何收集、使用、存储及保护你的信息。
            你使用本服务即表示你已阅读并同意本协议。
          </p>
          <p>
            我们会收集用于账号登录与服务运行的必要信息，包括但不限于账号标识、基础资料、任务内容、协作记录及设备日志信息，
            仅用于身份验证、产品优化、问题排查和服务安全。
          </p>
          <p>
            我们不会在未经你授权的情况下向第三方出售你的个人信息。仅在法律法规要求、保护你或平台合法权益、
            或实现核心服务功能所需（如云服务托管）时，才会进行必要的数据处理。
          </p>
          <p>
            你有权访问、更正、删除你的个人信息，并可通过退出登录、停止使用或联系我们处理相关请求。
            我们将根据适用法律在合理期限内响应。
          </p>
          <p>
            本协议为初稿版本，后续将根据产品能力与监管要求持续更新。重大变更将通过官网或应用内公告通知你。
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
};
