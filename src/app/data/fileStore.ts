import { useSyncExternalStore } from 'react';

// Which of a customer's files have been deleted from the Files tab this session. The Files tab keeps its own local
// copy of the list, so without this nothing else would know a file had gone — and the file would reappear in the
// tab, and in Assessment Hero's source picker, the next time they were opened. Records and drafts that were made
// from a deleted file keep their content (AIOP-24513) but show its source as "File no longer available".
//
// Nothing here is persisted: like all the prototype's data, it resets on a full page reload.

/** What a source shows as once its file has been deleted. */
export const FILE_UNAVAILABLE = 'File no longer available';

const deleted = new Map<string, ReadonlySet<string>>();
const listeners = new Set<() => void>();
const EMPTY: ReadonlySet<string> = new Set();

export function deleteCustomerFile(customerId: string, fileId: string) {
  // A new Set each time: useSyncExternalStore needs a new reference to notice a change, and the same one when nothing changed.
  deleted.set(customerId, new Set([...(deleted.get(customerId) ?? []), fileId]));
  listeners.forEach(l => l());
}

export const isFileDeleted = (customerId: string, fileId: string) => deleted.get(customerId)?.has(fileId) ?? false;

/** The ids of this customer's deleted files; re-renders the caller when one is deleted. */
export function useDeletedFileIds(customerId: string): ReadonlySet<string> {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => deleted.get(customerId) ?? EMPTY,
  );
}
