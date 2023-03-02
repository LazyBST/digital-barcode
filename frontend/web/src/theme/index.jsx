import React, { useMemo } from "react";
import { ThemeProvider, createTheme, ThemeOptions } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import palette from "./palette";
import zIndex from "./z-index";
import typography from "./typography";
import componentsOverride from "./overrides";

const ThemeConfig = ({ children }) => {
  const themeOptions = useMemo(
    () => ({
      palette,
      zIndex,
      typography,
    }),
    []
  );

  const theme = createTheme(themeOptions);
  theme.components = componentsOverride(theme);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export { ThemeConfig };
