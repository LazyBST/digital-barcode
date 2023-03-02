import { Theme } from "@mui/system";

const Button = (theme: Theme) => {
  return {
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "capitalize" as const,
          borderRadius: 5,
          // fontSize: 17,
          // fontWeight: 700,
          padding: theme.spacing(0.5, 3),
        },
        outlinedPrimary: {
          padding: theme.spacing(0.5, 2),
        },
        containedPrimary: {
          color: "#ffffff",
          "&:hover": {
            backgroundColor: theme.palette.primary.light,
          },
          "&:active": {
            backgroundColor: theme.palette.primary.dark,
          },
        },
        disabled: {
          color: theme.palette.primary.light,
        },
      },
    },
  };
};

export default Button;
