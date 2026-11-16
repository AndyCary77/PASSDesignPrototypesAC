import { useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CloudUpload,
  File, FileSpreadsheet, FileText, FolderPlus, Image as ImageIcon, Inbox, Pencil, Search, X,
} from 'lucide-react';
import { useCustomer } from '../../../data/CustomerContext';
import {
  CUSTOMER_FILES, formatFileDate, formatFileSize, type CustomerFile, type FileExtension,
} from '../../../data/customerFiles';
import { Button } from '../../buttons/Button';
import { Checkbox } from '../../ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { FileEditSlideout } from './FileEditSlideout';

// Documents › Files: the loose uploads on a customer's record (referral paperwork, signed agreements, hospital
// letters). Search, sort, row selection, page size, paging, and a file's detail panel (rename, delete) all work.
// New folder, Upload and Download are simulated (there is no backend) and do nothing.

type SortKey = 'name' | 'extension' | 'sizeBytes' | 'uploaded' | 'modified' | 'uploadedBy';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [10, 20, 50, 100];

// pdf and docx get the two document glyphs the production grid uses; the rest get their own so a photo or a
// spreadsheet isn't mistaken for a letter.
export const FILE_ICONS: Record<FileExtension, typeof File> = {
  pdf: File,
  docx: FileText,
  xlsx: FileSpreadsheet,
  jpg: ImageIcon,
};

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'name', label: 'Name', width: 'w-[36%]' },
  { key: 'extension', label: 'Extension', width: 'w-[8%]' },
  { key: 'sizeBytes', label: 'Size', width: 'w-[8%]' },
  { key: 'uploaded', label: 'Uploaded', width: 'w-[15%]' },
  { key: 'modified', label: 'Modified', width: 'w-[15%]' },
  { key: 'uploadedBy', label: 'Uploaded by', width: 'w-[14%]' },
];

function compare(a: CustomerFile, b: CustomerFile, key: SortKey): number {
  const x = a[key];
  const y = b[key];
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  // ISO timestamps sort correctly as plain strings, which is what `uploaded` / `modified` are.
  return String(x).localeCompare(String(y), undefined, { sensitivity: 'base', numeric: true });
}

export function FilesTab() {
  const customer = useCustomer();
  // Local copy, so renaming and deleting in the detail panel show up in the table. DocumentsPage keys this
  // component by customer, so each customer starts again from their own mock files.
  const [allFiles, setAllFiles] = useState<CustomerFile[]>(() => CUSTOMER_FILES[customer.id] ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  // Newest upload first, as in the production grid.
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'uploaded', dir: 'desc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const files = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? allFiles.filter(f => `${f.name}.${f.extension}`.toLowerCase().includes(q) || f.uploadedBy.toLowerCase().includes(q))
      : allFiles;
    const sorted = [...matching].sort((a, b) => compare(a, b, sort.key));
    return sort.dir === 'asc' ? sorted : sorted.reverse();
  }, [allFiles, query, sort]);

  const pageCount = Math.max(1, Math.ceil(files.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const from = files.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(files.length, currentPage * pageSize);
  const pageFiles = files.slice(from === 0 ? 0 : from - 1, to);

  const selectedOnPage = pageFiles.filter(f => selected.has(f.id)).length;
  const allOnPageSelected = pageFiles.length > 0 && selectedOnPage === pageFiles.length;

  const renameFile = (id: string, name: string) => {
    // "Modified" is stamped with the real current time, in the same local-ISO form as the mock data.
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setAllFiles(prev => prev.map(f => (f.id === id ? { ...f, name, modified: now } : f)));
  };

  const deleteFile = (id: string) => {
    setAllFiles(prev => prev.filter(f => f.id !== id));
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const editingFile = allFiles.find(f => f.id === editingId) ?? null;

  const toggleSort = (key: SortKey) => {
    setSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'extension' || key === 'uploadedBy' ? 'asc' : 'desc' }));
    setPage(1);
  };

  const togglePageSelection = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) pageFiles.forEach(f => next.delete(f.id));
      else pageFiles.forEach(f => next.add(f.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-5">
        <div className="relative w-full max-w-[446px]">
          <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            aria-label="Search files"
            placeholder="Search files"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            className="w-full h-11 pl-11 pr-28 border border-gray-300 rounded-lg text-body text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5c1c85] focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setQuery(''); setPage(1); }}
                className="p-1 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {files.length} {files.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="lg" icon={<FolderPlus className="w-5 h-5" />}>New folder</Button>
          <Button variant="primary" size="lg" icon={<CloudUpload className="w-5 h-5" />}>Upload</Button>
        </div>
      </div>

      <div className="mx-6 border-t border-gray-200" />

      <div className="px-6 pt-5">
        <h2 className="text-lg font-semibold text-gray-900">Files ({files.length})</h2>
      </div>

      {allFiles.length === 0 ? (
        <EmptyState title="No files uploaded yet" body="Files uploaded to this customer's record will appear here." />
      ) : files.length === 0 ? (
        <EmptyState title="No files found" body="Try a different name, or clear the search." />
      ) : (
        <div className="px-6 pt-3 overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed border-collapse text-body">
            <thead>
              <tr className="text-left text-gray-900">
                <th scope="col" className="w-[52px] py-3 pl-3 pr-2 font-medium">
                  <Checkbox
                    className="size-5 border-gray-500 bg-white"
                    aria-label="Select all files on this page"
                    checked={allOnPageSelected ? true : selectedOnPage > 0 ? 'indeterminate' : false}
                    onCheckedChange={togglePageSelection}
                  />
                </th>
                {COLUMNS.map(col => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`${col.width} py-3 pr-3 font-medium`}
                    >
                      {/* A raw button on purpose: a sortable column heading is a text control, not one of the pill Buttons. */}
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1.5 rounded-md -ml-1 px-1 py-0.5 font-medium text-gray-900 hover:bg-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
                      >
                        {col.label}
                        {active && (sort.dir === 'asc'
                          ? <ArrowUp className="w-4 h-4" aria-hidden="true" />
                          : <ArrowDown className="w-4 h-4" aria-hidden="true" />)}
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="w-[56px] py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {pageFiles.map(file => {
                const Icon = FILE_ICONS[file.extension];
                const isSelected = selected.has(file.id);
                const fullName = `${file.name}.${file.extension}`;
                return (
                  <tr key={file.id} className={`h-[54px] ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="py-2 pl-3 pr-2">
                      <Checkbox
                        className="size-5 border-gray-500 bg-white"
                        aria-label={`Select ${fullName}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(file.id)}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      {/* A raw button on purpose: the file name is a text link that opens the file's detail panel. */}
                      <button
                        type="button"
                        title={fullName}
                        onClick={() => setEditingId(file.id)}
                        className="flex items-center gap-2.5 max-w-full text-left text-[rgb(109,27,152)] font-medium hover:underline rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[rgb(154,38,214)]/50"
                      >
                        <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-gray-900">{file.extension}</td>
                    <td className="py-2 pr-3 text-gray-900 whitespace-nowrap">{formatFileSize(file.sizeBytes)}</td>
                    <td className="py-2 pr-3 text-gray-900 whitespace-nowrap">{formatFileDate(file.uploaded)}</td>
                    <td className="py-2 pr-3 text-gray-900 whitespace-nowrap">{formatFileDate(file.modified)}</td>
                    <td className="py-2 pr-3 text-gray-900 truncate">{file.uploadedBy}</td>
                    <td className="py-2 pr-1 text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="tertiary" size="sm" iconOnly aria-label={`Edit ${fullName}`} onClick={() => setEditingId(file.id)} className="bg-transparent hover:bg-gray-100">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-white text-gray-900 border border-gray-200 shadow-lg" arrowClassName="bg-white fill-white">
                          Edit
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: page size, range, paging. Always shown so the grid reads as the same control with 3 rows or 300. */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 mt-4 text-body text-gray-700">
        <label className="inline-flex items-center gap-3">
          Page Size:
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-10 rounded-lg border border-gray-300 bg-white pl-3 pr-2 text-body text-gray-900 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5c1c85]"
          >
            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <span aria-live="polite">{from} to {to} of {files.length}</span>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <PagerButton label="First page" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft className="w-4 h-4" /></PagerButton>
          <PagerButton label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="w-4 h-4" /></PagerButton>
          <span className="px-3">Page {currentPage} of {pageCount}</span>
          <PagerButton label="Next page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="w-4 h-4" /></PagerButton>
          <PagerButton label="Last page" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight className="w-4 h-4" /></PagerButton>
        </nav>
      </div>

      {editingFile && (
        <FileEditSlideout
          // Keyed so each file opens with its own name in the field.
          key={editingFile.id}
          file={editingFile}
          siblings={allFiles}
          onClose={() => setEditingId(null)}
          onRename={renameFile}
          onDelete={deleteFile}
        />
      )}
    </div>
  );
}

function PagerButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="tertiary" size="sm" iconOnly aria-label={label} disabled={disabled} onClick={onClick} className="bg-transparent hover:bg-gray-100">
      {children}
    </Button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-gray-600">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <Inbox className="w-8 h-8 text-gray-500" aria-hidden="true" />
      </div>
      <p className="text-lg font-medium text-gray-900">{title}</p>
      <p className="text-body">{body}</p>
    </div>
  );
}
