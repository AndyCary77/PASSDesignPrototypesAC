import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { formatFileDate, formatFileSize, type CustomerFile } from '../../../data/customerFiles';
import { EditSlideout } from '../../layout/EditSlideout';
import { Button } from '../../buttons/Button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '../../ui/alert-dialog';

// Documents › Files › a single file: its details, and the one thing that can be edited — the name (the
// extension is fixed). Built on the shared EditSlideout shell. Download is simulated (there is no file behind
// the row); Save renames the file and stamps it as modified; Delete asks first, then removes it.

const FORM_ID = 'edit-file-form';

// Characters a file name can't contain on the systems files get downloaded to.
const INVALID_CHARS = /[\\/:*?"<>|]/;

function validate(name: string, file: CustomerFile, siblings: CustomerFile[]): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a file name.';
  if (INVALID_CHARS.test(trimmed)) return 'A file name can’t contain any of these characters: \\ / : * ? " < > |';
  const clash = siblings.some(
    f => f.id !== file.id && f.extension === file.extension && f.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (clash) return 'A file with this name already exists.';
  return null;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-gray-600 mb-1">{label}</dt>
      <dd className="text-body font-medium text-gray-900">{children}</dd>
    </div>
  );
}

export function FileEditSlideout({ file, siblings, onClose, onRename, onDelete }: {
  file: CustomerFile;
  /** Every file in the list, to catch a rename that would clash with another file's name. */
  siblings: CustomerFile[];
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(file.name);
  // Only show an error once there's something to complain about: untouched, the name is always valid.
  const [touched, setTouched] = useState(false);

  const error = validate(name, file, siblings);
  const changed = name.trim() !== file.name;
  const showError = touched && error !== null;

  return (
    <EditSlideout
      title="Edit file"
      onClose={onClose}
      formId={FORM_ID}
      saveLabel="Save"
      saveDisabled={!changed || error !== null}
      footerActions={close => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="tertiary" size="lg" icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this file?</AlertDialogTitle>
              <AlertDialogDescription>
                {file.name}.{file.extension} will be removed from this customer&rsquo;s record. There&rsquo;s no way to
                bring it back once it&rsquo;s gone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { onDelete(file.id); close(); }}
                className="rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                Delete file
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    >
      {close => (
        <form
          id={FORM_ID}
          noValidate
          onSubmit={e => {
            e.preventDefault();
            setTouched(true);
            if (!changed || error) return;
            onRename(file.id, name.trim());
            close();
          }}
          className="flex flex-col gap-6"
        >
          <div>
            <label htmlFor="file-name" className="block text-sm text-gray-600 mb-1.5">
              <span className="text-[rgb(154,38,214)] mr-0.5" aria-hidden="true">*</span>
              File name
              <span className="sr-only"> (required)</span>
            </label>
            <input
              id="file-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={showError}
              aria-describedby={showError ? 'file-name-error file-name-ext' : 'file-name-ext'}
              autoFocus
              className={`w-full max-w-[400px] bg-white border rounded-lg px-4 py-3 text-body font-medium text-gray-900 focus:outline-none focus:ring-1 ${
                showError
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-600'
                  : 'border-gray-200 focus:border-[rgb(154,38,214)] focus:ring-[rgb(154,38,214)]'
              }`}
            />
            <p id="file-name-ext" className="mt-2 text-sm text-gray-600">.{file.extension}</p>
            {showError && <p id="file-name-error" role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
          </div>

          <dl className="flex flex-col gap-6">
            <Detail label="Folder">All files</Detail>
            <Detail label="Size">{formatFileSize(file.sizeBytes)}</Detail>
            <Detail label="Uploaded">{formatFileDate(file.uploaded)}</Detail>
            <Detail label="Modified">{formatFileDate(file.modified)}</Detail>
            <Detail label="Uploaded by">{file.uploadedBy}</Detail>
          </dl>

          <div>
            <Button type="button" variant="secondary" size="lg" icon={<Download className="w-4 h-4" />}>Download</Button>
          </div>
        </form>
      )}
    </EditSlideout>
  );
}
