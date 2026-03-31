import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';

export const TermsPage: React.FC = () => {
  return (
    <MarketingLayout>
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-black text-gray-900">用户协议（初稿）</h1>
        <p className="mt-3 text-gray-500">最近更新：2026-03-30</p>

        <div className="mt-8 space-y-6 text-gray-700 leading-relaxed">
          <p>
            欢迎使用 TodoAgent。本协议是你与 TodoAgent 之间就产品使用所达成的约定。你在注册或使用服务前，
            应当认真阅读并充分理解本协议内容。
          </p>
          <p>
            你应保证注册信息真实、准确并持续有效，不得以任何方式从事违法违规活动，不得利用平台能力侵害他人合法权益。
            对于你的账号行为及其后果，由你自行承担相应责任。
          </p>
          <p>
            TodoAgent 提供以任务管理、上下文协作和 AI 辅助为核心的 SaaS 服务。我们将持续优化产品能力，
            但不对因不可抗力、网络故障或第三方服务中断导致的损失承担无限责任。
          </p>
          <p>
            未经授权，你不得对平台进行反向工程、恶意攻击、数据爬取或其他影响平台稳定性的行为。
            如发生违规，我们有权采取限制功能、暂停或终止服务等措施。
          </p>
          <p>
            本协议为初稿版本，后续将根据业务变化进行更新。更新后的协议在官网发布后生效，
            继续使用服务视为你接受更新条款。
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
};
