
import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
  // Fix: Changed from () => void to accept React.MouseEvent to support event-aware handlers like changePriority
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  minimal?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  onClick, 
  active = true,
  minimal = false 
}) => {
  const getColors = () => {
    switch (priority) {
      case Priority.P0:
        return active ? 'bg-red-500 text-white' : 'bg-red-50 text-red-400 border-red-100';
      case Priority.P1:
        return active ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-400 border-orange-100';
      case Priority.P2:
        return active ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-400 border-blue-100';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        ${getColors()} 
        ${minimal ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}
        font-semibold rounded-full border transition-all duration-200
        flex items-center justify-center tracking-tight
        ${onClick ? 'hover:scale-105 active:scale-95' : ''}
      `}
    >
      {priority}
    </button>
  );
};
