// The CareBridge brand mark — a microphone flanked by two asymmetric sparkle
// stars (bigger top-right, smaller top-left). Used everywhere CareBridge
// recording/AI-fill is represented, instead of a plain mic or sparkle icon.
export default function CareBridgeIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      <path d="M0 -7 L1.9 -1.9 L7 0 L1.9 1.9 L0 7 L-1.9 1.9 L-7 0 L-1.9 -1.9 Z" transform="translate(4,4.5) scale(0.28)"/>
      <path d="M0 -7 L1.9 -1.9 L7 0 L1.9 1.9 L0 7 L-1.9 1.9 L-7 0 L-1.9 -1.9 Z" transform="translate(19.5,5) scale(0.55)"/>
    </svg>
  )
}
