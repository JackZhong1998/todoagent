import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => Promise<{ ok: boolean; detail?: string }>;
};

export const PaywallModal: React.FC<PaywallModalProps> = ({ open, onClose, onUpgrade }) => {
  const { t } = useLanguage();
  const b = t.billing;
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { ok, detail } = await onUpgrade();
      if (!ok) window.alert(detail ? `${b.checkoutError}\n\n${detail}` : b.checkoutError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          aria-label={t.chat.closeTooltip}
        >
          <X size={18} />
        </button>
        <h2 id="paywall-title" className="pr-10 text-lg font-bold text-stone-900">
          {b.paywallTitle}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{b.paywallBody}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {b.maybeLater}
          </button>
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            {b.upgrade}
          </button>
        </div>
      </div>
    </div>
  );
};
