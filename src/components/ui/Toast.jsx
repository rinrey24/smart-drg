import { useEffect, useState } from 'react';
import { CircleCheck, TriangleAlert, CircleX, Info, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const VARIANTS = {
  success: {
    bg: 'bg-[#0E1A2B]',
    border: 'border-[#2E9A5A]',
    icon: CircleCheck,
    iconColor: 'text-[#2E9A5A]',
    bar: 'bg-[#2E9A5A]',
  },
  error: {
    bg: 'bg-[#0E1A2B]',
    border: 'border-[#C8392E]',
    icon: CircleX,
    iconColor: 'text-[#C8392E]',
    bar: 'bg-[#C8392E]',
  },
  warn: {
    bg: 'bg-[#0E1A2B]',
    border: 'border-[#C97A12]',
    icon: TriangleAlert,
    iconColor: 'text-[#C97A12]',
    bar: 'bg-[#C97A12]',
  },
  info: {
    bg: 'bg-[#0E1A2B]',
    border: 'border-[#1E78B8]',
    icon: Info,
    iconColor: 'text-[#1E78B8]',
    bar: 'bg-[#1E78B8]',
  },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const variant = VARIANTS[toast.type] ?? VARIANTS.info;
  const Icon = variant.icon;

  useEffect(() => {
    // Mount → slide in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'relative flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl',
        'min-w-[280px] max-w-[400px] w-full overflow-hidden',
        'transition-all duration-300 ease-out',
        variant.bg,
        variant.border,
        visible && !leaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-8 opacity-0'
      )}
    >
      {/* Accent bar left */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', variant.bar)} />

      {/* Icon */}
      <Icon size={18} className={cn('mt-0.5 shrink-0', variant.iconColor)} />

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-white leading-snug">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="shrink-0 text-slate-400 hover:text-white transition-colors p-0.5 rounded"
        aria-label="Tutup notifikasi"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifikasi"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}
