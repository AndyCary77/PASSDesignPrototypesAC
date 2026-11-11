import BottomSheet from '../../assets/BottomSheet'
import { NfcIcon, QrIcon, TagManualIcon } from './visitIcons'

// "Choose your Tag In method": a sheet that slides up over the visit. Any method tags the carer in here
// (nothing is actually scanned). `onTagIn` is called with the method id.
const METHODS = [
  { id: 'qr', label: 'Tag in with QR code', Icon: QrIcon },
  { id: 'nfc', label: 'Tag in with NFC', Icon: NfcIcon },
  { id: 'manual', label: 'Tag in manually', Icon: TagManualIcon },
]

export default function TagInSheet({ customer, onClose, onTagIn }) {
  return (
    <BottomSheet title="Tag in" onClose={onClose}>
      <div className="ts-body">
        <div className="ts-who">
          <h2 className="ts-heading">Choose your Tag In method</h2>
          <img className="ts-avatar" src={customer.photo} alt="" />
        </div>
        <div className="ts-lower">
          <p className="ts-note"><strong>Please note:</strong> Once tagged in to {customer.name}, you will be required to complete a visit with this customer before you can tag back out.</p>
          <ul className="ts-methods">
            {METHODS.map(({ id, label, Icon }) => (
              <li key={id}>
                <button type="button" className="ts-method" onClick={() => onTagIn(id)}>
                  <span className="ts-method-icon"><Icon /></span>
                  <span className="ts-method-label">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </BottomSheet>
  )
}
