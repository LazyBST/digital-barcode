// import { NOTO_SANS_DISPLAY, SYSTEM_FONTS } from '../typography';

const Link = () => {
  return {
    MuiLink: {
      styleOverrides: {
        root: {
          // fontFamily: [NOTO_SANS_DISPLAY, ...SYSTEM_FONTS].join(','),
          fontSize: 17,
          lineHeight: 1.2,
        },
      },
    },
  };
};

export default Link;
