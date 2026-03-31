import React from 'react';
import { MarketingLayout } from '../components/MarketingLayout';

export const AboutPage: React.FC = () => {
  return (
    <MarketingLayout>
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-black text-gray-900">关于我</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          我在做 TodoAgent 的初衷很简单：希望把 AI 从“偶尔可用的工具”，变成“能长期一起做事的协作伙伴”。
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          在真实工作里，效率问题通常不是缺一个待办软件，而是缺一套能持续运转的注意力系统。TodoAgent 围绕
          Todolist、上下文和协作反馈搭建，就是为了让每次执行都能沉淀为下一次效率提升的基础。
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          如果你也在探索更稳定的人机协作工作流，欢迎使用 TodoAgent，一起把“忙”变成“有节奏地推进”。
        </p>
      </section>
    </MarketingLayout>
  );
};
