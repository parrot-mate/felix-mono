import { IconEqualizer } from "@pmate/uikit"
import React from "react"

export const PlayVoiceIcon = ({ isPlaying }: { isPlaying: boolean }) => {
  if (!isPlaying) {
    // 静止态，平静的均衡器图标
    return <IconEqualizer className="!fill-current !text-current !w-8 !h-4 opacity-90" />
  }

  // 播放态，三根柱子跳动
  return (
    <>
      <div className="flex items-end px-2 py-1">
        <span
          className="w-[3px] h-[14px] mx-[2px] bg-current/95 rounded-sm origin-bottom inline-block"
          style={{ animation: "eq-bounce 900ms infinite", animationDelay: "0ms" }}
        />
        <span
          className="w-[3px] h-[14px] mx-[2px] bg-current/95 rounded-sm origin-bottom inline-block"
          style={{ animation: "eq-bounce 900ms infinite", animationDelay: "150ms" }}
        />
        <span
          className="w-[3px] h-[14px] mx-[2px] bg-current/95 rounded-sm origin-bottom inline-block"
          style={{ animation: "eq-bounce 900ms infinite", animationDelay: "300ms" }}
        />
      </div>

      {/* 局部样式，只影响本组件 */}
      <style>
        {`
          @keyframes eq-bounce {
            0%   { transform: scaleY(0.3); }
            20%  { transform: scaleY(1.0); }
            40%  { transform: scaleY(0.4); }
            60%  { transform: scaleY(0.8); }
            80%  { transform: scaleY(0.5); }
            100% { transform: scaleY(0.3); }
          }
        `}
      </style>
    </>
  )
}
