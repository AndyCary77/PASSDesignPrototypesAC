import { usePlatform } from './platform'

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.72 11.37L4.75 11.34C4.72 11.37 4.70 11.40 4.67 11.44C4.65 11.47 4.64 11.49 4.62 11.52C4.61 11.54 4.60 11.57 4.57 11.63C4.56 11.65 4.52 11.76 4.5 12C4.5 12.12 4.52 12.24 4.56 12.35C4.57 12.40 4.60 12.43 4.62 12.48C4.64 12.51 4.65 12.53 4.67 12.56L4.72 12.63L4.74 12.65L9.75 18.29C10.12 18.70 10.75 18.74 11.16 18.37C11.58 18.01 11.61 17.37 11.25 16.96L7.73 13H18.5C19.05 13 19.5 12.55 19.5 12C19.5 11.45 19.05 11 18.5 11H7.73L11.25 7.04C11.59 6.66 11.58 6.09 11.25 5.72L11.16 5.63C10.75 5.26 10.12 5.30 9.75 5.71L4.75 11.34L4.74 11.35C4.73 11.36 4.73 11.37 4.72 11.37Z"/>
  </svg>
)

/**
 * `left` replaces the back button with any other leading control (e.g. Bookings'
 * filter button); it takes the place of `onBack`, and an app that passes neither
 * gets the balancing spacer as before.
 *
 * iOS centres the nav-bar title, balancing it with an empty 36px spacer
 * opposite the back button. Material's top app bar left-aligns the title
 * right after the back arrow instead — so on Android the trailing spacer
 * is dropped (it would push the title off-centre for no reason) and
 * android.css handles the alignment. One of the most recognisable
 * platform tells, and it costs almost nothing.
 */
export default function AppHeader({ title, onBack, left, right, className = '' }) {
  const [platform] = usePlatform()
  const android = platform === 'android'
  return (
    <div className={`app-header${className ? ' ' + className : ''}`}>
      {left !== undefined
        ? left
        : onBack
          ? <button className="app-header-back" onClick={onBack}><ArrowLeftIcon /></button>
          : !android ? <div style={{ width: 36 }} /> : null
      }
      <span className="app-header-title">{title}</span>
      {right !== undefined
        ? right
        : !android ? <div style={{ width: 36 }} /> : null
      }
    </div>
  )
}
