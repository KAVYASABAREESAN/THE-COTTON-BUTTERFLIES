import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 18,
  readonly = true,
  className = ''
}) => {
  const roundedValue = Math.round(value);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = readonly ? star <= roundedValue : star <= value;
        const icon = (
          <Star
            size={size}
            className={active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        );

        if (readonly) {
          return <span key={star}>{icon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
