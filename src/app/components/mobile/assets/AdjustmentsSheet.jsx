import { useState } from 'react'
import BottomSheet from './BottomSheet'
import AdjustmentsContent from './AdjustmentsContent'
import { getRafRecord } from '../../../data/reasonableAdjustments'

// A customer's Reasonable Adjustments in a bottom sheet, so a carer in the middle of a visit can read them without
// leaving it. The body is the Reasonable adjustments screen's own content (AdjustmentsContent), unchanged, at Level 1
// (adjustments only), and scrolls with every adjustment listed (no "Show more"); `fullHref` opens the screen itself for the rest.
// Pair with adjustments-sheet.css, adjustments-content.css and bottom-sheet.css.
export default function AdjustmentsSheet({ recordId, fullHref, onClose }) {
  const record = getRafRecord(recordId)
  // When this device last heard from the national flag (the screen's "last retrieved" time).
  const [retrievedAt] = useState(() => new Date())
  return (
    <BottomSheet title="Reasonable adjustments" onClose={onClose}>
      <div className="as-body">
        <AdjustmentsContent record={record} level="1" retrievedAt={retrievedAt} paginate={false} />
      </div>
      <div className="as-footer">
        <a className="as-full" href={fullHref}>Open full details</a>
      </div>
    </BottomSheet>
  )
}
