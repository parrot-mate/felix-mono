import colors from "tailwindcss/colors"

const lightColors = {
  ...colors,
  white: "#FFFFFF",
  black: "#333333",

  // violet 系列
  violet: {
    ...colors.violet,
    700: "#5F45EF",
    600: "#8B5CF6",
    500: "#9C6BFF",
    300: "#C084FC",
    200: "#E0D4FF",
  },

  // rose 系列
  rose: {
    ...colors.rose,
    400: "#F472B6",
  },

  // pink 系列
  pink: {
    ...colors.pink,
    100: "#F1E3EF",
    200: "#E5CCE1",
    300: "#D4AACE",
    400: "#B56DAA",
    500: "#A9559D",
    600: "#87447D",
    700: "#65335E",
  },

  // gray 系列
  gray: {
    ...colors.gray,
    50: "#F9FAFB",
    100: "#EEEEFF",
    200: "#DDDDDD",
    300: "#CCCCCC",
    400: "#98989A",
    500: "#999999",
    600: "#888888",
    700: "#6B7280",
  },

  // indigo 系列
  indigo: {
    900: "#4B0082",
  },
}

export const theme = {
  colors: {
    ...lightColors,
    primary: { ...lightColors.violet },
  },
  extend: {
    backgroundImage: {
      "gradient-parrot": "linear-gradient(135deg, #F472B6 0%, #8B5CF6 100%)",
    },
  },
} as const

export default theme
