// src/components/Divider.tsx
import React from 'react';
import clsx from 'clsx';
import type { BaseComponentProps } from '../../types/base';

export interface DividerProps extends BaseComponentProps {
  /** 分隔线方向 */
  orientation?: 'horizontal' | 'vertical';
  /** 是否虚线 */
  dashed?: boolean;
  /** 长度的 Tailwind 类（horizontal: 宽度，vertical: 高度） */
  lengthClass?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  dashed = false,
  lengthClass,
  className,
  id,
}) => {
  const isHorizontal = orientation === 'horizontal';

  const classes = clsx(
    // 主体：横向时用宽度和高度；纵向时用高度和宽度
    isHorizontal
      ? [
          // 如果没传 lengthClass，就默认充满宽度
          lengthClass ?? 'w-full',
          // 虚线：用 border-t，否则用 h-px + 背景色
          dashed ? 'border-t border-dashed border-gray-200' : 'h-px bg-gray-200',
        ]
      : [
          lengthClass ?? 'h-full',
          dashed ? 'border-l border-dashed border-gray-200' : 'w-px bg-gray-200',
        ],
    className
  );

  return <div id={id} data-uikit="divider" className={classes} role="separator" />;
};
