import { IconButton, IconFemale, IconMale } from "@pmate/uikit"
import { makeStyles } from "tss-react/mui"

const useStyles = makeStyles()(() => ({
  icon: {
    flex: 1,
    "& svg": {
      width: "80%",
      height: "80%",
    },
  },
}))

export const GenderSelector = (props: {
  onSelect: (gender: "M" | "F") => void
}) => {
  const { classes } = useStyles()
  return (
    <div>
      <div className="flex mt-[50px]">
        <IconButton
          className={`${classes.icon} text-sky-400`}
          onClick={() => {
            props.onSelect("M")
          }}
        >
          <IconFemale />
        </IconButton>
        <IconButton
          className={`${classes.icon} text-pink-400`}
          onClick={() => {
            props.onSelect("F")
          }}
        >
          <IconMale />
        </IconButton>
      </div>
    </div>
  )
}
