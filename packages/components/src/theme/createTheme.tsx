import type { PaletteMode } from "@mui/material"
import { createTheme as createMuiTheme, Theme } from "@mui/material"

import { green } from "@mui/material/colors"

// import { switchClasses } from '@mui/material/Switch';
import { FONTS, lightPalette } from "./consts"

export function createTheme(mode: PaletteMode): Theme {
  const baseTheme = createMuiTheme({
    palette: { mode, ...lightPalette },

    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 800,
        lg: 1024,
        xl: 1536,
      },
    },
    typography: {
      fontFamily: FONTS.default,
    },
    components: {
      // MuiFormControl: {
      //   styleOverrides: {
      //     root: {
      //       marginBottom: "30px",
      //     },
      //   },
      // },
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            span: "span",
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            color: lightPalette.font.black,
            marginBottom: "10px",
          },
        },
      },
      MuiFormGroup: {
        styleOverrides: {
          root: {
            marginBottom: "30px",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: "20px",
            border: "1px solid #f0f0f0",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          variant: "contained",
          color: "success",
        },
        styleOverrides: {
          containedSizeLarge: {
            fontSize: "24px",
          },
          containedSizeSmall: {
            fontSize: "12px",
            padding: "2px 16px",
            margin: "5px",
          },
          outlinedSizeSmall: {
            fontSize: "12px",
            padding: "2px 16px",
            margin: "5px",
          },
          outlinedSuccess: {
            borderRadius: 8,
            padding: "4px 26px",
            fontSize: "1rem",
            margin: "10px",
            "&:hover": {},
          },
          containedSuccess: {
            borderRadius: 8,
            backgroundColor: green[500],
            padding: "4px 26px",
            fontSize: "1rem",
            color: "white",
            margin: "10px",
            "&:hover": {
              backgroundColor: green[700],
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              "& .MuiOutlinedInput-notchedOutline": {},
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "black",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: lightPalette.felling.success,
              },
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "black", // Default label color
            "&.Mui-focused": {
              color: lightPalette.felling.success,
            },
          },
        },
      },
    },
  })

  // const theme = createMuiTheme(baseTheme, {
  //   palette: {
  //     mode,
  //     ...lightPalette,
  //   },

  //   components: {
  //     FormControl: {
  //       styleOverrides: {
  //         marginBottom: "10px",
  //       },
  //     },
  //     MuiButton: {
  //       defaultProps: {
  //         variant: "contained",
  //         color: "success",
  //       },
  //       styleOverrides: {
  //         containedSizeLarge: {
  //           fontSize: "24px",
  //         },
  //         containedSuccess: {
  //           borderRadius: 16,
  //           backgroundColor: green[500],
  //           padding: "4px 26px",
  //           fontSize: "1rem",
  //           color: "white",
  //           margin: "10px",
  //           "&:hover": {
  //             backgroundColor: green[700],
  //           },
  //         },
  //       },
  //     },
  //   },
  // })
  return baseTheme
}
