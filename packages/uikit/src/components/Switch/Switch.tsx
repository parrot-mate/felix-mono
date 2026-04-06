import React from 'react';
import clsx from 'clsx';
import type { BaseComponentProps } from '../../types/base';

export interface SwitchProps extends BaseComponentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  className,
  id,
  styles,
}) => {
  return (
    <label
      id={id}
      data-uikit="switch"
      style={styles}
      className={clsx('relative inline-flex items-center cursor-pointer', className)}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-violet-500 transition-colors"></div>
      <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
    </label>
  );
};
