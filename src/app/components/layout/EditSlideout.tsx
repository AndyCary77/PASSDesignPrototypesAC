import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '../buttons/Button';

/**
 * The app's edit slide-out shell: a panel sliding in from the right over a
 * dimmed page, with a title and purple close X, a grey scrolling body, and a
 * footer with Cancel on the left and the primary save on the right.
 *
 * Extracted from VisitEditSlideout (customer service agreement), which was the
 * original; Roster Settings uses it too.
 *
 * `children` may be a function so the body can close the panel the animated
 * way (e.g. after a form submit): `{(close) => <form onSubmit={() => close()}>…}`.
 * Either give a `formId` (the Save button submits that form) or an `onSave`.
 */
export function EditSlideout({
  title,
  onClose,
  children,
  formId,
  onSave,
  saveLabel = 'Save changes',
  saveDisabled = false,
  size = 'default',
  width = 'default',
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode | ((close: () => void) => ReactNode);
  formId?: string;
  /** Called when Save is pressed (when there's no `formId`). Should close via the passed `close`. */
  onSave?: (close: () => void) => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  /** `large` gives the title more presence, for settings-style panels. */
  size?: 'default' | 'large';
  /** `wide` for panels holding multi-column tables. */
  width?: 'default' | 'wide';
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  // Escape closes, like any dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const large = size === 'large';

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-300 ${visible ? 'bg-black/30' : 'bg-black/0'}`}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`bg-white ${width === 'wide' ? '!w-[85%] !max-w-[1280px]' : '!w-1/2 !max-w-[960px]'} h-full shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-8 border-b border-gray-200 flex-shrink-0 ${large ? 'py-7' : 'py-5'}`}>
          <h2 className={large ? 'text-xl font-semibold text-gray-900' : 'text-base font-semibold text-gray-900'}>{title}</h2>
          <button
            type="button"
            onClick={close}
            className="p-1 cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'rgb(154, 38, 214)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-gray-50">
          {typeof children === 'function' ? children(close) : children}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 flex items-center justify-between bg-white px-8 py-4 flex-shrink-0">
          <Button type="button" variant="tertiary" size="lg" onClick={close}>Cancel</Button>
          {formId ? (
            <Button type="submit" form={formId} size="lg" disabled={saveDisabled}>{saveLabel}</Button>
          ) : (
            <Button type="button" size="lg" disabled={saveDisabled} onClick={() => onSave?.(close)}>{saveLabel}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
