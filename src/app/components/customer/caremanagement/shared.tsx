import { Eye } from 'lucide-react';
import { StarSolidIcon, CalendarSolidIcon, TickSolidIcon, PlusSolidIcon, NutritionSolidIcon, HydrateSolidIcon } from '../../icons/CarePlanIcons';
import type { TaskCategory } from './types';

export const inputClass = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';
export const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export const CATEGORY_CONFIG: Record<TaskCategory, {
  bg: string; text: string; border: string; headerBg: string; circleBg: string; Icon: React.ComponentType<{ className?: string }>;
}> = {
  General:           { bg: 'bg-yellow-50',  text: 'text-yellow-800',  border: 'border-yellow-200', headerBg: 'bg-yellow-50',  circleBg: 'bg-yellow-200',  Icon: TickSolidIcon },
  Nutrition:         { bg: 'bg-[#edf7e9]',  text: 'text-[#2D5F1E]',   border: 'border-[#cce6c3]',  headerBg: 'bg-[#edf7e9]',  circleBg: 'bg-[#d5eccc]',  Icon: NutritionSolidIcon },
  Medications:       { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',    headerBg: 'bg-red-50',     circleBg: 'bg-red-200',     Icon: PlusSolidIcon },
  Hydration:         { bg: 'bg-cyan-50',    text: 'text-cyan-800',    border: 'border-cyan-200',   headerBg: 'bg-cyan-50',    circleBg: 'bg-cyan-200',    Icon: HydrateSolidIcon },
  'Outcome Tracking':{ bg: 'bg-orange-50',  text: 'text-orange-800',  border: 'border-orange-200', headerBg: 'bg-orange-50',  circleBg: 'bg-orange-200',  Icon: StarSolidIcon },
  Observations:      { bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200', headerBg: 'bg-purple-50',  circleBg: 'bg-purple-200',  Icon: Eye },
};

export function TaskBadge({ title, category }: { title: string; category: TaskCategory }) {
  const c = CATEGORY_CONFIG[category];
  const { Icon } = c;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-3 h-3" />
      {title}
    </span>
  );
}

export function VisitBadge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium border bg-sky-50 text-sky-800 border-sky-200">
      <CalendarSolidIcon className="w-3 h-3 text-sky-600" />
      {title}
    </span>
  );
}

export function OutcomeBadge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium border text-amber-800" style={{ backgroundColor: '#feefdc', borderColor: '#fcd9a8' }}>
      <StarSolidIcon className="w-3 h-3 text-amber-600" />
      {title}
    </span>
  );
}

export function ActiveBadge({ status }: { status: 'active' | 'inactive' }) {
  return status === 'active' ? (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded uppercase"
      style={{ backgroundColor: '#D4EBC3', color: '#2D5F1E' }}
    >
      Active
    </span>
  ) : (
    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-gray-100 text-gray-500">
      Inactive
    </span>
  );
}

export function StatusToggle({ value }: { value: 'active' | 'inactive' }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full">
      <button
        className={`flex-1 py-2.5 text-sm font-semibold uppercase transition-colors ${value === 'active' ? '' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
        style={value === 'active' ? { backgroundColor: '#D4EBC3', color: '#2D5F1E' } : undefined}
      >
        Active
      </button>
      <button
        className={`flex-1 py-2.5 text-sm font-semibold uppercase transition-colors ${value === 'inactive' ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
      >
        Inactive
      </button>
    </div>
  );
}
