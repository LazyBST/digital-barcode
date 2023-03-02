const GREY = {
  50: "#FAFAFA",
  75: "#F4F4F4",
  100: "#F5F5F5",
  200: "#EAE6E4",
  300: "#E0E0E0", // GRAY 3
  350: "#E4E3E3",
  400: "#AFACAA",
  500: "#A6A6A6", // GRAY 1
  600: "#767676",
  650: "#878798",
  700: "#626262", // GRAY 2
  750: "#878798",
  800: "#585858",
  900: "#2E2C2C", // SOFT BLACK
};

const PRIMARY = {
  // light: '#76A396',
  main: "#21BFAE",
  dark: '#0B8376',
};

const SECONDARY = {
  light: "#E4BB3F",
  main: "#DEAA10",
  dark: "#9B760B",
};
const INFO = {
  light: "#7F9FAD",
  main: "#608899",
  dark: "#435F6B",
};
const SUCCESS = {
  light: "#AAF27F",
  main: "#348958",
  dark: "#229A16",
};

const ERROR = {
  light: "#E4713F",
  main: "#DE4E10",
  dark: "#9B360B",
};

const COMMON = {
  naturalBlack: "#000000",
  lightBlack: "#020202",
  richBlack: "#020202",
  black: "#272727",
  white: "#FFFFFF",
  lightGreen: "#DDE7E4",
  dustGreen: "#B8CBC1",
  dustYellow: "#E7D8AE",
  dustBlue: "#CADCE3",
  dustOrange: "#9C6F43",
  darkGreen: "#366861",
  darkYellow: "#E7A800",
  green: "#679D84",
  green1A: "#e0ebe6",
  darkBlue: "#06303F",
  apricot: "#FFD3B5",
  dustApricot: "#F2C2A0",
  darkApricot: "#FFA982",
  darkApricot2: "#D89377",
  lightApricot: "#FFE2BD",
  chocolate: "#7F635D",
  metalBlue: "#2E2E47",
  metalGreen: "#515032",
  antiqueBrass: "#CC8B70",
  chestnutRose: "#C96B59",
  froly: "#F2836D",
  facebookBlue: "#176AE6",
  attorneyBlue: "#253a5b",
  curiousBlue: "#1D7CD5",
  calypso: "#82A7AF",
  gainsboro: "#DEDEDE",
  pewterBlue: "#82A7AF",
  pacificBlue: "#00B5D8",
  primaryLight2: "#57857733",
  lightBrown: "#FFC97D",
  visaBlue: "#00579F",
  visaYellow: "#FAA61A",
};

const palette = {
  common: { ...COMMON },
  primary: { ...PRIMARY },
  secondary: { ...SECONDARY },
  info: { ...INFO },
  success: { ...SUCCESS },
  warning: { ...ERROR },
  error: { ...ERROR },
  grey: GREY,
  text: { primary: "#161546", secondary: GREY[650], disabled: GREY[500] },
  background: {
    paper: "#FFFFFF",
    default: GREY[100],
  },
  action: {
    disabledBackground: GREY[500],
    disabled: "#FFFFFF",
  },
};

export default palette;
