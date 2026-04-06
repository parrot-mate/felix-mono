export const COLORS = {
  blue: "#28A7E8",
  lightGrey: "#ddd",
  lightBlue: "#87c7e8",
  grey: "#999",
  dargrey: "#666",
  black: "#000",
  green: "#4CAF50",
  greenGrey: "#96c0ba",
  money: "#FFD700",
  greenBlue: "#3AAB9C",
}

export type Colors = typeof COLORS

export const lightPalette = {
  font: {
    black: COLORS.black,
    weak: COLORS.dargrey,
    veryweak: COLORS.grey,
    reverseWeak: COLORS.lightGrey,
  },

  felling: {
    success: COLORS.green,
    info: COLORS.greenGrey,
    active: COLORS.lightBlue,
    successActive: COLORS.greenBlue,
    unfinished: COLORS.grey,
    money: COLORS.money,
  },
  primary: {
    main: COLORS.blue,
  },
  weak: {
    font: COLORS.grey,
  },
}

export const FONTS = {
  default: "Roboto, sans-serif",
}
