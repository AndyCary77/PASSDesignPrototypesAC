import { AllergiesIcon, DnacprIcon, DolsIcon, FlagChipIcon } from '../customer-menu/src/menuIcons'

// The customer "flags" shown on a compact customer card: the legal chips (Allergies, DNACPR,
// DoLS), the purple Reasonable Adjustments chip, the solid HIGH RISK badge and the key-safe key.
// Pair with customer-flags.css. Same look as the chips on mobile/customer-menu's profile header
// and the Customers list — one place to build them on a new screen.

const CHIP_ICONS = { allergies: AllergiesIcon, dnacpr: DnacprIcon, dols: DolsIcon, adjustments: FlagChipIcon }

export const KeyIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
  </svg>
)

export function HighRiskBadge({ className = '' }) {
  return <span className={`flag-high-risk${className ? ' ' + className : ''}`}>HIGH RISK</span>
}

/**
 * The standard chip set for a customer, in the order every screen uses: their legal chips,
 * then Adjustments when they have a Reasonable Adjustment Flag. `adjustmentsHref` makes that
 * chip a link into the Reasonable adjustments screen; leave it off for a plain, inert chip.
 */
export function buildFlagChips({ legalChips = [], hasAdjustments = false, adjustmentsHref } = {}) {
  return [
    ...legalChips.map(c => ({ id: c.id, label: c.label })),
    ...(hasAdjustments
      ? [{
        id: 'adjustments',
        label: 'Adjustments',
        href: adjustmentsHref,
        ariaLabel: 'Reasonable adjustments flag recorded. Open reasonable adjustments.',
      }]
      : []),
  ]
}

/** A row of chips. Each is `{ id, label, href?, ariaLabel? }`; `id` picks the icon and, for `adjustments`, the purple style. */
export function FlagChips({ chips, className = '' }) {
  if (!chips || chips.length === 0) return null
  return (
    <div className={`flag-chips${className ? ' ' + className : ''}`}>
      {chips.map(chip => {
        const Icon = CHIP_ICONS[chip.id]
        const cls = `flag-chip${chip.id === 'adjustments' ? ' flag-chip--adjustments' : ''}${chip.href ? ' flag-chip--link' : ''}`
        const content = <>{Icon && <Icon />}{chip.label}</>
        return chip.href
          ? <a key={chip.id} href={chip.href} className={cls} aria-label={chip.ariaLabel}>{content}</a>
          : <span key={chip.id} className={cls}>{content}</span>
      })}
    </div>
  )
}
