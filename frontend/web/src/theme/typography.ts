import { createTheme } from "@mui/material/styles";
import { APP_FONT, SYSTEM_FONTS } from "../constants";

// export const NOTO_SANS_DISPLAY = 'Noto Sans Display';
// const PLAYFAIR_DISPLAY = 'Playfair Display';
// const SHADOWS_INTO_LIGHT = 'Shadows Into Light';
// const ROBOTO = 'Roboto';
// const PLAYFAIR_DEFAULT = {
//   fontFamily: [PLAYFAIR_DISPLAY, ...SYSTEM_FONTS].join(','),
//   color: palette.common.naturalBlack,
// };

// const NOTO_SANS_DEFAULT = {
//   fontFamily: [NOTO_SANS_DISPLAY, ...SYSTEM_FONTS].join(','),
//   color: palette.common.naturalBlack,
// };

const defaultTheme = createTheme();

const typography = {
  fontFamily: [
    // NOTO_SANS_DISPLAY,
    // PLAYFAIR_DISPLAY,
    // SHADOWS_INTO_LIGHT,
    APP_FONT,
    // ...SYSTEM_FONTS,
  ].join(","),
  fontFamilySystem: SYSTEM_FONTS.join(","),
  // helper: {
  //   fontFamily: [SHADOWS_INTO_LIGHT, ...SYSTEM_FONTS].join(','),
  //   color: palette.common.naturalBlack,
  //   fontSize: defaultTheme.typography.pxToRem(18),
  //   fontWeight: 400,
  //   lineHeight: 1.22,
  // },
  // feedback: {
  //   ...PLAYFAIR_DEFAULT,
  //   fontSize: defaultTheme.typography.pxToRem(32),
  //   fontStyle: 'italic',
  //   fontWeight: 400,
  //   lineHeight: '41px',
  //   letterSpacing: '0.02em',
  // },
  subtitle2: {
    fontSize: "15px",
  },
};

export default typography;
