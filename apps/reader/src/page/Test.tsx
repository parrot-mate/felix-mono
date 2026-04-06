import { TurnstileVerification } from "@/component/TurnstileVerification"
import React, { useEffect, useRef } from "react"
import Turnstile from "react-turnstile"

const siteKey = "0x4AAAAAAA4qU90BlSm20m1N"
export const Test: React.FC = () => {
  return (
    <TurnstileVerification
      onTokenVerified={(token, signature, raw) =>
        console.log(token, signature, raw)
      }
      sigdata={["hello", "123", "def"]}
      verifyData={{
        a: 1,
        b: 2,
      }}
    />
  )
}
