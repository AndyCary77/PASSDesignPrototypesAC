import { forwardRef, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render as a square icon-only button (pass icon as children) */
  iconOnly?: boolean;
  /** Leading icon rendered before the label */
  icon?: ReactNode;
  /** Optional count badge (primary variant only) */
  badge?: number;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all ' +
  'disabled:pointer-events-none disabled:opacity-50 cursor-pointer outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50 rounded-full ' +
  '[&_svg]:pointer-events-none [&_svg]:shrink-0';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-[rgb(154,38,214)] text-white hover:bg-[rgb(130,28,190)]',
  secondary:
    'border-2 border-[rgb(154,38,214)] text-[rgb(154,38,214)] bg-white ' +
    'hover:bg-[rgba(154,38,214,0.05)]',
  tertiary:
    'bg-[#EDECF1] text-gray-700 border-0 hover:bg-[#DCD9E4]',
};

const SIZE_LABEL: Record<ButtonSize, string> = {
  sm: 'h-8 px-4 text-sm',
  md: 'h-9 px-5 text-sm',
  lg: 'h-10 px-6 text-sm',
};

const SIZE_ICON: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 p-0 text-sm',
  md: 'h-9 w-9 p-0 text-sm',
  lg: 'h-10 w-10 p-0 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      iconOnly = false,
      icon,
      badge,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    const sizeClass = iconOnly ? SIZE_ICON[size] : SIZE_LABEL[size];

    return (
      <button
        ref={ref}
        className={`${BASE} ${VARIANT[variant]} ${sizeClass} ${className}`.trim()}
        {...props}
      >
        {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
        {!iconOnly && children}
        {badge !== undefined && (
          <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-semibold">
            {badge}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
