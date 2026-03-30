import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LoginModal } from '../components/LoginModal';
import { Zap, CheckCircle2, Star, Sparkles, Users, Shield, BarChart3, Clock, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { setShowLoginModal } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LoginModal />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">
                {t.hero.badge}
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
              {t.hero.title}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center"
              >
                {t.hero.ctaPrimary}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                {t.hero.ctaSecondary}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              {t.hero.features.map((feature, index) => (
                <div key={index} className="p-6 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    {index === 0 && <Sparkles className="w-6 h-6 text-white" />}
                    {index === 1 && <Star className="w-6 h-6 text-white" />}
                    {index === 2 && <Users className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.items.map((feature, index) => (
              <div key={index} className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                  {index === 0 && <CheckCircle2 className="w-7 h-7 text-blue-600" />}
                  {index === 1 && <Zap className="w-7 h-7 text-blue-600" />}
                  {index === 2 && <Clock className="w-7 h-7 text-blue-600" />}
                  {index === 3 && <Sparkles className="w-7 h-7 text-blue-600" />}
                  {index === 4 && <BarChart3 className="w-7 h-7 text-blue-600" />}
                  {index === 5 && <Shield className="w-7 h-7 text-blue-600" />}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
