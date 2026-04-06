import React from 'react';
import clsx from 'clsx';
import type { BaseComponentProps } from '../../types/base';

export interface ListItemProps extends BaseComponentProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  onClick,
  className,
  id,
  styles,
}) => {
  return (
    <li
      id={id}
      data-uikit="list_item"
      style={styles}
      className={clsx('px-2 py-1 cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </li>
  );
};
