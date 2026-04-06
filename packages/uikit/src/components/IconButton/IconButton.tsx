import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { BaseComponentProps } from '../../types/base';

export interface IconButtonProps
  extends BaseComponentProps,
    Omit<
      HTMLMotionProps<'button'>,
      'style' | 'children' | 'className'
    > {
  children: React.ReactNode;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  disabled = false,
  className,
  id,
  styles,
  ...rest
}) => {
  return (
    <motion.button
      id={id}
      data-uikit="icon_button"
      {...rest}
      style={styles}
      className={clsx(
        'rounded-full inline-flex items-center justify-center hover:bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.1 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      {children}
    </motion.button>
  );
};
