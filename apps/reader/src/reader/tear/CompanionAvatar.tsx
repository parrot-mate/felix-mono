import { AudioPlayState, AudioPlayers, audioPlayerAtom, usePlayAudio } from "@pmate/sdk"
import { useAtomValue } from "jotai"
import React, { useEffect, useRef, useState } from "react"
import "./CompanionAvatar.css"

interface Position {
  bottom: number
  right: number
}

interface CompanionAvatarProps {
  initialPosition: Position
  videoSrc: string
}

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  initialPosition,
  videoSrc,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position>(initialPosition)
  const [dragging, setDragging] = useState<boolean>(false)
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const bookPlayer = useAtomValue(audioPlayerAtom(AudioPlayers.BookPlayer))
  const { playState } = usePlayAudio(bookPlayer)

  useEffect(() => {
    if (!videoRef.current) return

    if (
      playState === AudioPlayState.Paused ||
      playState === AudioPlayState.Stopped
    ) {
      videoRef.current.currentTime = 0
      videoRef.current.pause()
    } else if (playState === AudioPlayState.Playing) {
      videoRef.current.play()
    }
  }, [playState, videoRef.current])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    const touch = e.touches[0]
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      })
    }
    setDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (!dragging) return
    const touch = e.touches[0]
    const newBottom = window.innerHeight - (touch.clientY + offset.y)
    const newLeft = touch.clientX - offset.x

    setPosition(() => ({
      bottom: Math.max(0, newBottom), // Ensure it doesn't go off the bottom
      right: Math.max(0, window.innerWidth - newLeft - 100), // Ensure it doesn't go off the right
    }))
  }

  const handleTouchEnd = (): void => {
    setDragging(false)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        bottom: position.bottom,
        right: position.right,
        width: "100px",
        height: "130px",
        zIndex: 1000,
        touchAction: "none",
        border: dragging ? "2px solid rgb(130, 127, 130)" : "none",
        borderRadius: "10px",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        controls={false}
        playsInline={true}
        loop
        muted
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "10px",
          objectFit: "cover",
        }}
      />
    </div>
  )
}
