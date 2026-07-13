import { CheckSquare, Utensils, Pill, Droplets, Star, Eye, Calendar } from 'lucide-react';
import type { TaskCategory } from './types';

export const inputClass = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[rgb(154,38,214)] focus:ring-1 focus:ring-[rgb(154,38,214)]';
export const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export const CATEGORY_CONFIG: Record<TaskCategory, {
  bg: string; text: string; border: string; headerBg: string; Icon: React.ComponentType<{ className?: string }>;
}> = {
  General:           { bg: 'bg-yellow-50',  text: 'text-yellow-800',  border: 'border-yellow-200', headerBg: 'bg-yellow-50',  Icon: CheckSquare },
  Nutrition:         { bg: 'bg-green-50',   text: 'text-green-800',   border: 'border-green-200',  headerBg: 'bg-green-50',   Icon: Utensils },
  Medications:       { bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200',   headerBg: 'bg-blue-50',    Icon: Pill },
  Hydration:         { bg: 'bg-cyan-50',    text: 'text-cyan-800',    border: 'border-cyan-200',   headerBg: 'bg-cyan-50',    Icon: Droplets },
  'Outcome Tracking':{ bg: 'bg-orange-50',  text: 'text-orange-800',  border: 'border-orange-200', headerBg: 'bg-orange-50',  Icon: Star },
  Observations:      { bg: 'bg-purple-50',  text: 'text-purple-800',  border: 'border-purple-200', headerBg: 'bg-purple-50',  Icon: Eye },
};

export function TaskBadge({ title, category }: { title: string; category: TaskCategory }) {
  const c = CATEGORY_CONFIG[category];
  const { Icon } = c;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      <Icon className="w-3 h-3" />
      {title}
    </span>
  );
}

export function VisitBadge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border bg-sky-50 text-sky-800 border-sky-200">
      <Calendar className="w-3 h-3 text-sky-600" />
      {title}
    </span>
  );
}

export function OutcomeBadge({ title }: { title: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border bg-amber-50 text-amber-800 border-amber-200">
      <Star className="w-3 h-3 text-amber-500" />
      {title}
    </span>
  );
}

export function ActiveBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

export function StatusToggle({ value }: { value: 'active' | 'inactive' }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full">
      <button className={`flex-1 py-2.5 text-sm font-medium transition-colors ${value === 'active' ? 'bg-green-500 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
        Active
      </button>
      <button className={`flex-1 py-2.5 text-sm font-medium transition-colors ${value === 'inactive' ? 'bg-gray-300 text-gray-700' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
        Inactive
      </button>
    </div>
  );
}
