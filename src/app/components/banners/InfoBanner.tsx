import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

export type InfoBannerSize = 'sm' | 'md';

const SIZE: Record<InfoBannerSize, { box: string; icon: string; text: string }> = {
  // Icon sits level with the first line of text (not centred on a multi-line message), 20px to match the app's other info icons.
  sm: { box: 'gap-2.5 px-3 py-2 rounded-lg items-start', icon: 'w-5 h-5 mt-0.5', text: 'text-body' },
  md: { box: 'gap-3 px-5 py-3.5 rounded-md items-start', icon: 'w-6 h-6', text: 'text-body' },
};

/**
 * Blue-tinted informational banner: an Info icon beside a short message.
 * `sm` is the compact inline hint, `md` the roomier note used in dialogs.
 */
export function InfoBanner({
  size = 'sm',
  className = '',
  children,
}: {
  size?: InfoBannerSize;
  className?: string;
  children: ReactNode;
}) {
  const s = SIZE[size];
  return (
    <div
      className={`flex border border-[#2f77b7] bg-[#f0f8fd] text-gray-900 ${s.box} ${s.text} ${className}`.trim()}
    >
      <Info className={`${s.icon} shrink-0 text-[#2f77b7]`} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
