import React, { useState } from "react"
import Turnstile from "react-turnstile"

const siteKey = "0x4AAAAAAA4qU90BlSm20m1N"

const verifyURL = `https://verify.aicheckaggexx.com/turnstile
`
enum VerifyState {
  UNKOWN = "unkown",
  ERROR = "error",
  SUCCESS = "success",
}

type TokenVerifySuccFN = (token: string, signature: string, raw: string) => void
const useTurnstileVerify = (
  sigdata: string[],
  onTokenVerified: TokenVerifySuccFN
) => {
  const [state, setState] = useState<VerifyState>(VerifyState.UNKOWN)
  const handleVerify = async (token: string) => {
    try {
      const response = await fetch(`${verifyURL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, data: sigdata }),
      })

      if (!response.ok) {
        setState(VerifyState.ERROR)
        return
      }

      const data = await response.json()

      if (!data.success) {
        setState(VerifyState.ERROR)
        return
      }

      onTokenVerified(token, data.signature, data.sigdata)
      setState(VerifyState.SUCCESS)
    } catch (error) {
      console.error("Error verifying Turnstile:", error)
      setState(VerifyState.ERROR)
    }
  }

  return { handleVerify, state }
}
interface TurnstileVerificationProps {
  sigdata: string[]
  verifyData?: any
  onTokenVerified: TokenVerifySuccFN
}
export const TurnstileVerification: React.FC<TurnstileVerificationProps> = ({
  // verifyData,
  onTokenVerified,
  sigdata,
}) => {
  const { handleVerify, state } = useTurnstileVerify(sigdata, onTokenVerified)

  if (state === VerifyState.ERROR) {
    return <p>Verification Fail.</p>
  }

  return <Turnstile sitekey={siteKey} onVerify={handleVerify} />
}
