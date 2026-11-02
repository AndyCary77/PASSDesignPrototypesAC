// The menu tiles' icons. Nine are cropped from the design screenshot (icons/*.png, 2x,
// transparent background — the tile's own colour shows through, so they sit on any tint);
// Reasonable adjustments is a vector flag in the same flat style, drawn for this screen
// (it isn't in the design). Chip icons for the profile header's flags are vectors too.

const HEART = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

import visits from './icons/visits.png'
import marChart from './icons/mar-chart.png'
import aboutMe from './icons/about-me.png'
import details from './icons/details.png'
import carePackage from './icons/care-package.png'
import communication from './icons/communication.png'
import documents from './icons/documents.png'
import medicalHistory from './icons/medical-history.png'
import openPass from './icons/openpass.png'

// 56px box: the PNGs are 112px (2x) with the glyph filling about 48 of it.
const Icon = ({ children }) => (
  <svg width="56" height="56" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">{children}</svg>
)
const Png = ({ src }) => <img src={src} width="56" height="56" alt="" />

export const VisitsIcon = () => <Png src={visits} />
export const MarChartIcon = () => <Png src={marChart} />
export const AboutMeIcon = () => <Png src={aboutMe} />
export const DetailsIcon = () => <Png src={details} />
export const CarePackageIcon = () => <Png src={carePackage} />
export const CommunicationIcon = () => <Png src={communication} />
export const DocumentsIcon = () => <Png src={documents} />
export const MedicalHistoryIcon = () => <Png src={medicalHistory} />
export const OpenPassIcon = () => <Png src={openPass} />


// The same flag the desktop header badge and Reasonable Adjustments tab use.
export const ReasonableAdjustmentsIcon = () => (
  <Icon>
    <g transform="scale(2)"><path d="M14.400 6 14 4H5v17h2v-7h5.600l.4 2h7V6z" /></g>
  </Icon>
)

// Chip icons for the legal/clinical flags in the profile header.
export const AllergiesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M6.800 9l10.400 6M6.800 15l10.400-6" />
  </svg>
)
export const DnacprIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d={HEART} />
    <path d="M3 12h5l2-3 3 6 2-3h6" fill="none" stroke="#fff" strokeWidth="1.700" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const DolsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 8c3 .5 4 2 5 4l2 3.500-2 3.500C5 19 2 15 3 8zM21 8c-3 .5-4 2-5 4l-2 3.500 2 3.500c3 .5 6-3.500 5-11z" />
  </svg>
)
export const FlagChipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14.400 6 14 4H5v17h2v-7h5.600l.4 2h7V6z" />
  </svg>
)
