import { lightPalette } from "./consts"
import {
  TypographyOptions,
  Typography,
} from "@mui/material/styles/createTypography"

declare module "@mui/material/styles" {
  interface Theme {
    palette: typeof lightPalette
  }
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    span: React.CSSProperties
  }


  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    span?: React.CSSProperties
  }
}

// Update the Typography's variant prop options
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    span: true
  }
  
}
