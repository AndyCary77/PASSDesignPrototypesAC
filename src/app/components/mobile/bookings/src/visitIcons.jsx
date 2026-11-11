// Icons for the visit screens, drawn in the flat style of the rest of the mobile prototype.
const Svg = ({ size = 24, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>{children}</svg>
)
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const BackArrowIcon = () => <Svg size={26}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></Svg>
export const CloseIcon = ({ size = 26 }) => <Svg size={size}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></Svg>
export const ChevronDownIcon = ({ flip }) => <Svg size={26} style={flip ? { transform: 'rotate(180deg)' } : undefined}><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></Svg>
export const ClockIcon = ({ size = 16 }) => <Svg size={size} {...stroke}><circle cx="12" cy="12" r="9.5" /><path d="M12 7v5.5l3.5 2" /></Svg>
export const ExternalLinkIcon = ({ size = 14 }) => <Svg size={size} {...stroke} strokeWidth={2.2}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" /></Svg>
export const TagIcon = ({ size = 16 }) => <Svg size={size}><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></Svg>
export const PlayIcon = ({ size = 22 }) => <Svg size={size}><path d="M8 5v14l11-7z" /></Svg>
export const EditNoteIcon = ({ size = 22 }) => <Svg size={size}><path d="M3 10h11v2H3zm0-2h11V6H3zm0 8h7v-2H3zm15.01-3.13l.71-.71a.996.996 0 011.41 0l.71.71c.39.39.39 1.02 0 1.41l-.71.71-2.12-2.12zm-.71.71l-5.3 5.3V21h2.12l5.3-5.3-2.12-2.12z" /></Svg>
export const InProgressIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
    <circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3.6" />
    <path d="M10.5 8.5v9l7.5-4.5z" fill="currentColor" />
  </svg>
)
export const AlarmIcon = ({ size = 22 }) => <Svg size={size}><path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 16c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" /></Svg>
export const InfoIcon = ({ size = 18 }) => <Svg size={size}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></Svg>

// Tag-in methods
export const QrIcon = () => (
  <Svg size={28}>
    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h3v3h-3zm5 0h3v3h-3zm-5 5h3v3h-3zm5 0h3v3h-3zm-2.5-2.5h2v2h-2z" />
  </Svg>
)
export const NfcIcon = () => (
  <Svg size={28}>
    <path d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v14h14V5H5z" />
    <path d="M8 8h8v8h-5.500v-4.500h2.500V14h1.500v-4.500H9.500V16H8V8z" />
  </Svg>
)
export const TagManualIcon = () => <Svg size={28}><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></Svg>

// Task type glyphs (white, drawn inside a coloured disc by TaskTypeIcon)
const GLYPHS = {
  medication: <path d="M12 6a2 2 0 100 4 2 2 0 000-4zM8.5 12.500h7l.8 3.500H7.700zM6 17.500h12V19H6z" />,
  fluids: <path d="M7 5h10l-1.200 14H8.200L7 5zm1.600 3l.5 6h5.800l.5-6H8.600z" />,
  meal: <path d="M8 5v5a2 2 0 001.500 1.930V19h1.500v-7.070A2 2 0 0012.500 10V5H11v4h-.75V5h-1.500v4H8V5H6.500 8zm8 0c-1.500 1-2.500 3-2.500 5.500V13h2v6h1.500V5H16z" />,
  task: <path d="M8 6h8a1 1 0 011 1v10a1 1 0 01-1 1H8a1 1 0 01-1-1V7a1 1 0 011-1zm1 2.500v1h6v-1H9zm0 3v1h6v-1H9zm0 3v1h4v-1H9z" />,
  observation: <path d="M12 7C8.500 7 5.700 9.200 4.500 12c1.200 2.800 4 5 7.500 5s6.300-2.200 7.500-5c-1.200-2.800-4-5-7.500-5zm0 8a3 3 0 110-6 3 3 0 010 6zm0-4.500a1.500 1.500 0 100 3 1.500 1.500 0 000-3z" />,
  outcome: <path d="M12 6l1.700 3.600 3.900.5-2.900 2.700.8 3.900L12 14.800 8.500 16.700l.8-3.900-2.900-2.700 3.900-.5L12 6z" />,
}
const TYPE_COLOURS = { medication: '#ee6c62', fluids: '#6c5fd0', meal: '#8aa23a', task: '#8aa23a', observation: '#4a9de3', outcome: '#e04ed4' }

export function TaskTypeIcon({ type }) {
  return (
    <span className="tk-type" style={{ background: TYPE_COLOURS[type] }} aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">{GLYPHS[type]}</svg>
    </span>
  )
}

// Task-detail rows
export const DETAIL_ICONS = {
  tablet: <Svg size={26}><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM5.700 7.100L16.900 18.300A8 8 0 015.700 7.100z" /></Svg>,
  dose: <Svg size={26}><path d="M5 5h3v3H5zm5.500 0h3v3h-3zM16 5h3v3h-3zM5 10.500h3v3H5zm5.500 0h3v3h-3zM16 10.500h3v3h-3zM5 16h3v3H5zm5.500 0h3v3h-3z" /></Svg>,
  prompt: <Svg size={26}><path d="M9 3a1.500 1.500 0 011.500 1.500V11h1V9a1.500 1.500 0 013 0v1.500h.5a1.500 1.500 0 013 0V15c0 3.300-2.200 6-5.500 6h-1.600c-1.800 0-3-.8-4-2.200L5.300 14.800a1.500 1.500 0 012.400-1.700l1.300 1.700V4.500A1.500 1.500 0 019 3z" /></Svg>,
  info: <Svg size={26}><path d="M12 2C6.480 2 2 6.480 2 12s4.480 10 10 10 10-4.480 10-10S17.520 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></Svg>,
}
// One figure glyph, used both as the row icon and (larger, in blue) inside the body-map tile.
const FIGURE = <path d="M20 4v2h-5v16h-2v-7h-2v7H9V6H4V4h16zM12 0a2 2 0 110 4 2 2 0 010-4z" transform="translate(0 1) scale(1 .96)" />
export const PersonFigureIcon = () => <Svg size={26}>{FIGURE}</Svg>
export const TickIcon = ({ size = 22 }) => <Svg size={size}><path d="M9 16.200L4.800 12l-1.400 1.400L9 19 21 7l-1.400-1.400z" /></Svg>

// The body-map thumbnail on a task: the same figure glyph, in blue on a pale blue tile.
export const BodyMapThumb = () => (
  <span className="td-body" role="img" aria-label="Body map">
    <svg width="52" height="52" viewBox="0 0 24 24" fill="#4a8fe0" aria-hidden="true">
      <g transform="translate(1.8 2.6) scale(.85)">{FIGURE}</g>
    </svg>
  </span>
)
