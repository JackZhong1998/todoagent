import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoginModal } from '../components/LoginModal';

export const Terms: React.FC = () => {
  const { language, t } = useLanguage();
  const isZh = language === 'zh';

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LoginModal />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t.terms.title}
            </h1>
            <p className="text-gray-500">{t.terms.lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '1. 服务接受' : '1. Acceptance of Service'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '通过访问和使用 TodoAgent，您同意受这些服务条款的约束。'
                : 'By accessing and using TodoAgent, you agree to be bound by these Terms of Service.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '2. 用户账户' : '2. User Accounts'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '您有责任维护您账户的安全，并对账户下的所有活动负责。'
                : 'You are responsible for maintaining the security of your account and for all activities under your account.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '3. 可接受的使用' : '3. Acceptable Use'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '您同意不以任何非法或未经授权的方式使用我们的服务。'
                : 'You agree not to use our services in any unlawful or unauthorized manner.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '4. 知识产权' : '4. Intellectual Property'}
            </h2>
            <p className="mb-4">
              {isZh
                ? 'TodoAgent 及其原始内容、功能和设计是 TodoAgent 的专有财产。'
                : 'TodoAgent and its original content, features, and design are the exclusive property of TodoAgent.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '5. 终止' : '5. Termination'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '我们可以随时终止或暂停您对服务的访问，无需事先通知。'
                : 'We may terminate or suspend your access to the service at any time without prior notice.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '6. 责任限制' : '6. Limitation of Liability'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '在任何情况下，TodoAgent 不对任何间接、附带、特殊、后果性或惩罚性损害承担责任。'
                : 'In no event shall TodoAgent be liable for any indirect, incidental, special, consequential, or punitive damages.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '7. 联系我们' : '7. Contact Us'}
            </h2>
            <p>
              {isZh
                ? '如果您对这些服务条款有任何疑问，请通过 legal@todoagent.com 联系我们。'
                : 'If you have any questions about these Terms of Service, please contact us at legal@todoagent.com.'}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
