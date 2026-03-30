import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoginModal } from '../components/LoginModal';

export const Privacy: React.FC = () => {
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
              {t.privacy.title}
            </h1>
            <p className="text-gray-500">{t.privacy.lastUpdated}</p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '1. 我们收集的信息' : '1. Information We Collect'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '我们收集您在使用我们的服务时提供的信息，包括但不限于您的姓名、电子邮件地址和使用数据。'
                : 'We collect information you provide when using our services, including but not limited to your name, email address, and usage data.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '2. 我们如何使用您的信息' : '2. How We Use Your Information'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '我们使用收集的信息来提供、维护和改进我们的服务，处理您的交易，与您沟通，并确保服务安全。'
                : 'We use the information we collect to provide, maintain, and improve our services, process your transactions, communicate with you, and ensure the security of our services.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '3. 信息共享' : '3. Information Sharing'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '我们不会出售您的个人信息。我们可能会与服务提供商共享您的信息，以帮助我们提供服务。'
                : 'We do not sell your personal information. We may share your information with service providers to help us provide our services.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '4. 数据安全' : '4. Data Security'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '我们采用行业标准的安全措施来保护您的个人信息免受未经授权的访问、使用或泄露。'
                : 'We employ industry-standard security measures to protect your personal information from unauthorized access, use, or disclosure.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '5. 您的权利' : '5. Your Rights'}
            </h2>
            <p className="mb-4">
              {isZh
                ? '您有权访问、更正或删除您的个人信息。如需行使这些权利，请联系我们。'
                : 'You have the right to access, correct, or delete your personal information. Please contact us to exercise these rights.'}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
              {isZh ? '6. 联系我们' : '6. Contact Us'}
            </h2>
            <p>
              {isZh
                ? '如果您对本隐私政策有任何疑问，请通过 privacy@todoagent.com 联系我们。'
                : 'If you have any questions about this Privacy Policy, please contact us at privacy@todoagent.com.'}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
