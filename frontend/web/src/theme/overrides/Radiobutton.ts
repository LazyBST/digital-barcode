import { Theme } from '@mui/system';

const Radiobutton = (theme: Theme) => {
  return {
    MuiRadio: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: theme.palette.grey[500],
          },
        },
      },
    },
  };
};

export default Radiobutton;
