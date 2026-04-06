import React from 'react';
import type { BaseComponentProps } from '../../types/base';

export interface UnreadBadgeProps extends BaseComponentProps {
  count: number;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  className = '',
  id,
  styles,
}) => {
  if (count <= 0) return null;
  return (
    <span
      id={id}
      data-uikit="unread_badge"
      style={styles}
      className={`flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ${className}`.trim()}
    >
      {count}
    </span>
  );
};
