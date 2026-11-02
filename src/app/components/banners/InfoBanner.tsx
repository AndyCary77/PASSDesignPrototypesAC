import type { ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { Button } from '../buttons/Button';

export type InfoBannerSize = 'sm' | 'md';

const SIZE: Record<InfoBannerSize, { box: string; icon: string; text: string }> = {
  // Icon sits level with the first line of text (not centred on a multi-line message), 20px to match the app's other info icons.
  sm: { box: 'gap-2.5 px-3 py-2 rounded-lg items-start', icon: 'w-5 h-5 mt-0.5', text: 'text-body' },
  md: { box: 'gap-3 px-5 py-3.5 rounded-md items-start', icon: 'w-6 h-6', text: 'text-body' },
};

/**
 * Blue-tinted informational banner: an Info icon beside a short message.
 * `sm` is the compact inline hint, `md` the roomier note used in dialogs.
 * Pass `onDismiss` to add a close button inside the banner, for a message that should go away once read.
 */
export function InfoBanner({
  size = 'sm',
  className = '',
  onDismiss,
  children,
}: {
  size?: InfoBannerSize;
  className?: string;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  const s = SIZE[size];
  return (
    <div
      className={`flex border border-[#2f77b7] bg-[#f0f8fd] text-gray-900 ${s.box} ${s.text} ${className}`.trim()}
    >
      <Info className={`${s.icon} shrink-0 text-[#2f77b7]`} aria-hidden="true" />
      <div className={onDismiss ? 'flex-1' : undefined}>{children}</div>
      {onDismiss && (
        // Negative margins so the button doesn't make the banner taller than its text needs. Tinted from
        // the banner's own blue (a shade darker than its fill; the X matches the info icon), not the
        // grey tertiary, which reads as a foreign colour on the blue. `!` because the variant sets bg/text too.
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          aria-label="Dismiss message"
          className="-my-1 -mr-2 shrink-0 bg-[#dbeaf6]! text-[#2f77b7]! hover:bg-[#c8def0]!"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
