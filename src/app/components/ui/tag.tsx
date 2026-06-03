import { Tag as TagIcon, X, Star, Ban } from 'lucide-react';

interface TagProps {
  label: string;
  value?: string;
  onRemove?: () => void;
  removable?: boolean;
  variant?: 'default' | 'preferred' | 'excluded';
}

export function Tag({ label, value, onRemove, removable = false, variant = 'default' }: TagProps) {
  const Icon = variant === 'preferred' ? Star : variant === 'excluded' ? Ban : TagIcon;
  
  const getBackgroundColor = () => {
    switch (variant) {
      case 'preferred':
        return '#EEDA9C'; // Golden tint
      case 'excluded':
        return '#F2D9D8'; // Red tint
      default:
        return 'rgb(220, 217, 228)'; // Default purple-gray
    }
  };
  
  return (
    <div 
      className="inline-flex items-center gap-2 text-gray-800 px-4 py-1.5 rounded-full text-base"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
      {value && <span className="text-gray-700">{value}</span>}
      {removable && onRemove && (
        <button 
          onClick={onRemove}
          className="hover:text-gray-600 transition-colors"
          aria-label="Remove tag"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}