import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        // Light mode customizations
        // Add your custom colors here if needed
      },
    },
    dark: {
      palette: {
        // Dark mode customizations
        // Add your custom colors here if needed
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
