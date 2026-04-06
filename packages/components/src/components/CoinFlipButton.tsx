import React, { useEffect, useState } from "react"
import { Box, Button, styled, keyframes, ButtonProps } from "@mui/material"
import mp3 from "../assets/zmoney-pickup.mp3"
import { playSound } from "../util/playSound"

const throwAnimation = keyframes`
  0% {
    transform: translateY(0) translateX(0) rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(100px) rotateY(2080deg);
    opacity: 0;
  }
`

const Coin = styled(Box)(() => ({
  opacity: 0,
  width: "40px",
  height: "40px",
  willChange: "transform",
  borderRadius: "50%",
  backgroundImage: "linear-gradient(135deg, #ceaa1a, gold)",
  boxShadow: "1px 1px 5px #93882b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  color: "white",
  position: "absolute",
  bottom: "40px",
  transition: "transform 1s",
  zIndex: 1000,
}))

interface CoinFlipButtonProps extends ButtonProps {
  autoPlay?: boolean
}

export const CoinFlipButton: React.FC<CoinFlipButtonProps> = (props) => {
  const { onClick, autoPlay, ...rest } = props
  const [isFlipping, setIsFlipping] = useState(false)
  const [side, setSide] = useState("Heads")

  const flipCoin = () => {
    playSound(mp3)
    setIsFlipping(true)
    setTimeout(() => {
      setIsFlipping(false)
      setSide(Math.random() > 0.5 ? "Heads" : "Tails")
    }, 1000)
  }

  useEffect(() => {
    requestAnimationFrame(() => {
      flipCoin()
    })
  }, [autoPlay])

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      mt={4}
      position="relative"
    >
      <Coin
        sx={{
          transform: isFlipping ? "rotateY(1800deg)" : "rotateY(0)",
          animation: isFlipping ? `${throwAnimation} 1s forwards` : "none",
        }}
      ></Coin>
      {!autoPlay && (
        <Button
          disabled={props.disabled || isFlipping}
          onClick={(e) => {
            flipCoin()
            onClick?.(e)
          }}
          {...rest}
        ></Button>
      )}
    </Box>
  )
}
