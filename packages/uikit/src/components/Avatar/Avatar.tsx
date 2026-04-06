import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import type { BaseComponentProps } from '../../types/base';
import imageCompression from 'browser-image-compression';

export interface AvatarProps extends BaseComponentProps {
  src?: string;
  nickName: string;
  size?: 'small' | 'medium' | 'large' | 'profileSize';
  type?: 'user' | 'group';
  /** Enable avatar uploading */
  upload?: boolean
  /** Callback after uploading file as base64 string */
  onUploadFile?: (base64: string) => void;

  showUploadBadge?: boolean;
  badgeIcon?: React.ReactNode;
  badgeClassName?: string;
  badgePosition?: 'br' | 'tr' | 'bl' | 'tl';
  clickToUpload?: boolean;
}

const sizeClassMap = {
  small: 'w-[2rem] h-[2rem] text-xs',
  medium: 'w-8 h-8 text-sm',
  large: 'w-12 h-12 text-lg',
  profileSize: 'w-[6.25rem] h-[6.25rem] text-xl'
};

const badgePosClass: Record<NonNullable<AvatarProps['badgePosition']>, string> = {
  br: 'bottom-2 right-1 translate-x-1/4 translate-y-1/4',
  tr: 'top-0 right-0 -translate-y-1/4 translate-x-1/4',
  bl: 'bottom-0 left-0 translate-y-1/4 -translate-x-1/4',
  tl: 'top-0 left-0 -translate-y-1/4 -translate-x-1/4',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  nickName,
  size = 'medium',
  type = 'user',
  className,
  id,
  styles,
  upload,
  onUploadFile,
  showUploadBadge,
  badgeIcon,
  badgeClassName,
  badgePosition = 'br',
  clickToUpload = true,
}) => {
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const first = nickName?.[0]?.toUpperCase() || '';
  const sizeClass = sizeClassMap[size];

  const handleFile = async (file: File) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 128, useWebWorker: true }
    const compressed = await imageCompression(file, options)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64 && onUploadFile) onUploadFile(base64);
    };
    reader.readAsDataURL(compressed);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      id={id}
      data-uikit="avatar"
      style={styles}
      className={clsx("relative inline-block", className, sizeClass)}
    >
      <div
        className={clsx(
          "rounded-full overflow-hidden flex items-center justify-center w-full h-full"
        )}
      >
        {src && !error ? (
          <img
            src={src}
            alt={nickName}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <span
            className={clsx(
              'w-full h-full flex items-center justify-center',
              type === 'user' ? 'bg-gray-300 text-gray-600' : 'bg-violet-500 text-white',
            )}
          >
            {first}
          </span>
        )}
      </div>

      {/* 旧行为：点击整张头像上传（保持向后兼容） */}
      {upload && clickToUpload && (
        <input
          type="file"
          ref={inputRef}
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // 允许重复选择同一文件
            e.currentTarget.value = '';
          }}
        />
      )}

      {/* 新增：右下角 + 徽章（仅在 showUploadBadge 时渲染；不改变原尺寸与样式） */}
      {upload && showUploadBadge && (
        <>
          {/* 隐藏输入，用按钮触发；避免被覆盖 */}
          {!clickToUpload && (
            <input
              type="file"
              ref={inputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.currentTarget.value = '';
              }}
            />
          )}
          <button
            type="button"
            onClick={openPicker}
            aria-label="Change avatar"
            className={clsx(
              'absolute z-20 flex items-center justify-center',
              'w-7 h-7 rounded-full bg-violet-500 text-white',
              badgePosClass[badgePosition],
              badgeClassName
            )}
          >
            {badgeIcon ?? <span className="text-base leading-none">+</span>}
          </button>
        </>
      )}
    </div>
  )
}
