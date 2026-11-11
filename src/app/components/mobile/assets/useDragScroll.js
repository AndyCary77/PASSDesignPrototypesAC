import { useEffect } from 'react'

// Lets a mouse drag scroll an element the way a finger does on a phone: press, drag, the content
// follows. Touch input is left alone (it scrolls natively). A drag that moves more than a few pixels
// swallows the click that would otherwise fire on release, so dragging over a link doesn't open it.
// Pair with <TouchCursor /> so the pointer looks like a fingertip and text isn't selected.
const DRAG_THRESHOLD = 5

export default function useDragScroll(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let startY = 0
    let startScroll = 0
    let dragging = false
    let moved = false

    const onMove = e => {
      const dy = e.clientY - startY
      if (!moved && Math.abs(dy) > DRAG_THRESHOLD) moved = true
      if (moved) el.scrollTop = startScroll - dy
    }
    const onUp = () => {
      dragging = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    const onDown = e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      dragging = true
      moved = false
      startY = e.clientY
      startScroll = el.scrollTop
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }
    const onClickCapture = e => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('click', onClickCapture, true)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('click', onClickCapture, true)
      onUp()
    }
  }, [ref])
}
