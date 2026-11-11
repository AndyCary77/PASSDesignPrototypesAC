import { useEffect, useRef } from 'react'

// Replaces the mouse pointer inside the phone frame with a translucent fingertip that shrinks while
// pressed, so a prototype reads as tap-and-drag rather than click-and-select. Also stops text and
// images being selected or dragged in the frame. Pair with touch-cursor.css and useDragScroll.
// Mouse only: on a real touch device it renders nothing visible.
export default function TouchCursor({ frameSelector = '.phone-frame' }) {
  const dotRef = useRef(null)

  useEffect(() => {
    const frame = document.querySelector(frameSelector)
    const dot = dotRef.current
    if (!frame || !dot) return undefined
    frame.classList.add('touch-cursor-active')

    const place = e => {
      if (e.pointerType !== 'mouse') return
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
      dot.dataset.visible = 'true'
    }
    const hide = () => { dot.dataset.visible = 'false'; dot.dataset.pressed = 'false' }
    const down = e => { if (e.pointerType === 'mouse') dot.dataset.pressed = 'true' }
    const up = () => { dot.dataset.pressed = 'false' }

    frame.addEventListener('pointermove', place)
    frame.addEventListener('pointerenter', place)
    frame.addEventListener('pointerleave', hide)
    frame.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      frame.classList.remove('touch-cursor-active')
      frame.removeEventListener('pointermove', place)
      frame.removeEventListener('pointerenter', place)
      frame.removeEventListener('pointerleave', hide)
      frame.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [frameSelector])

  return <div ref={dotRef} className="touch-cursor" data-visible="false" data-pressed="false" aria-hidden="true" />
}
