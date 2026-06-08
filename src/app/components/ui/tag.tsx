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
      className="inline-flex items-center gap-1.5 text-gray-800 px-3 py-1 rounded-full text-sm"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="font-medium text-sm">{label}</span>
      {value && <span className="text-sm text-gray-700">{value}</span>}
      {removable && onRemove && (
        <button 
          onClick={onRemove}
          className="hover:text-gray-600 transition-colors"
          aria-label="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}