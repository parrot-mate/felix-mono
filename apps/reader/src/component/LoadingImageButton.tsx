import { FC, useCallback, useEffect, useState } from "react"
import classes from "./IconButton.module.scss"
import { Spinner } from "@pmate/uikit"

interface IconButtonProps {
  onClick: () => Promise<void>
  icon: React.ReactElement<any>
  loadingLabel?: string
  size: number
  label: string
  autoInit?: () => boolean
}
export const LoadingImageButton: FC<IconButtonProps> = ({
  onClick,
  icon,
  label,
  loadingLabel,
  autoInit,
  size,
}) => {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async () => {
    if (loading) {
      return
    }
    try {
      setLoading(true)
      await onClick()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoInit && autoInit()) {
      run()
    }
  }, [])
  return (
    <div
      className={classes.IconButton}
      onClick={async (e) => {
        e.preventDefault()
        run()
      }}
    >
      {loading ? <Spinner size={size} /> : icon}
      <label>{loading ? loadingLabel : label}</label>
    </div>
  )
}
