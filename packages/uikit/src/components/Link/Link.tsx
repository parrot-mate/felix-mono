import React from 'react';
import clsx from 'clsx';
import type { BaseComponentProps } from '../../types/base';

export interface LinkProps extends BaseComponentProps {
  href: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  className,
  id,
  styles,
}) => {
  return (
    <a
      id={id}
      data-uikit="link"
      href={href}
      style={styles}
      className={clsx(
        'text-violet-500 no-underline hover:text-violet-500 transition-colors',
        className
      )}
    >
      {children}
    </a>
  );
};
