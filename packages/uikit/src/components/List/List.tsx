import React from 'react';
import clsx from 'clsx';
import type { BaseComponentProps } from '../../types/base';

export interface ListProps extends BaseComponentProps {
  children: React.ReactNode;
}

export const List: React.FC<ListProps> = ({
  children,
  className,
  id,
  styles,
}) => {
  return (
    <ul
      id={id}
      data-uikit="list"
      style={styles}
      className={clsx('flex flex-col', className)}
    >
      {children}
    </ul>
  );
};
