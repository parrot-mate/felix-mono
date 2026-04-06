import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export interface SplashScreenProps {
  logoSrc?: string
  brandName?: string
  slogan?: string
  duration?: number
  onFinish?: () => void
  className?: string
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  logoSrc,
  brandName = "ParrotMate",
  slogan = "Speak Different",
  duration = 3000,
  onFinish,
  className,
}) => {
  const [show, setShow] = useState(true)
  const [showSlogan, setShowSlogan] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(() => {
        onFinish?.()
      }, 600)
    }, duration)

    const sloganTimer = setTimeout(() => {
      setShowSlogan(true)
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearTimeout(sloganTimer)
    }
  }, [duration, onFinish])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-parrot ${className}`}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="absolute top-[308px] right-0 w-full h-[15.25rem] bg-white z-10"
            initial={{ x: "80%" }}
            animate={{ x: ["80%", "0%", "-10px", "10px", "-5px", "5px", "0px"] }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 0.8, 0.87, 0.92, 0.96, 0.99, 1], // 抖动间隔拉开
            }}
          />

          <div className="relative z-20 text-center">
            <img src={logoSrc} alt="logo" className="w-24 h-24 mx-auto mb-4" />
            <div className="mt-2 h-[3.5rem]">
              {showSlogan && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <h1 className="text-xl font-semibold text-violet-500">
                    {brandName}
                    <sup>®</sup>
                  </h1>

                  <div className="h-6 mt-2">
                    <p className="text-sm text-gray-500">{slogan}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
