import { Theme } from '@mui/system';

const Checkbox = (theme: Theme) => {
  return {
    MuiCheckbox: {
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

export default Checkbox;
