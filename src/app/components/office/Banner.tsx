import { Info, AlertTriangle, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type BannerVariant = 'info' | 'warning' | 'critical';

const VARIANT: Record<BannerVariant, { box: string; icon: string; title: string }> = {
  // Matches the purple info banner in CareBridgePage.
  info: { box: 'border-purple-200 bg-purple-50', icon: 'text-[rgb(154,38,214)]', title: 'text-purple-900' },
  // Matches the amber warning banners in SchedulePage / VisitSlideout / EmployeeContractScreen.
  warning: { box: 'border-amber-200 bg-amber-50', icon: 'text-amber-500', title: 'text-amber-900' },
  // Matches the red "overriding conflicts" banner in SchedulePage.
  critical: { box: 'border-red-200 bg-red-50', icon: 'text-red-500', title: 'text-red-900' },
};

interface BannerProps {
  variant: BannerVariant;
  children: ReactNode;
  onDismiss?: () => void;
}

export function Banner({ variant, children, onDismiss }: BannerProps) {
  const v = VARIANT[variant];
  const Icon = variant === 'info' ? Info : AlertTriangle;
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border ${v.box} px-4 py-3`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${v.icon}`} />
      <div className={`text-body flex-1 space-y-2 ${v.title}`}>{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} className={`flex-shrink-0 ${v.icon} hover:opacity-70`} aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
