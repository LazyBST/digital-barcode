import { Theme } from '@mui/system';

const TextField = (theme: Theme) => {
  return {
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: theme.palette.common.white,
        },
      },
    },
  };
};

export default TextField;
