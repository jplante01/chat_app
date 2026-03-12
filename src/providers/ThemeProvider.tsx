import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const FONT_MONO = '"Share Tech Mono", "Courier New", Courier, monospace';
const FONT_DISPLAY = '"Bebas Neue", "Orbitron", sans-serif';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  defaultColorScheme: 'dark',
  colorSchemes: {
    dark: {
      palette: {
        background: {
          default: '#1a2b35',
          paper: '#1f3040',
        },
        primary: {
          main: '#00d4d4',
          contrastText: '#1a2b35',
        },
        secondary: {
          main: '#e040fb',
          contrastText: '#1a2b35',
        },
        text: {
          primary: '#e8e8e8',
          secondary: '#8899aa',
        },
        divider: 'rgba(136, 153, 170, 0.25)',
        action: {
          hover: 'rgba(0, 212, 212, 0.07)',
          selected: 'rgba(0, 212, 212, 0.12)',
        },
      },
    },
    light: {
      palette: {
        background: {
          default: '#eef4f6',
          paper: '#ffffff',
        },
        primary: {
          main: '#007b7b',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#9c27b0',
          contrastText: '#ffffff',
        },
        text: {
          primary: '#1a2b35',
          secondary: '#4a6070',
        },
        divider: 'rgba(26, 43, 53, 0.2)',
      },
    },
  },
  typography: {
    fontFamily: FONT_MONO,
    h1: { fontFamily: FONT_DISPLAY, letterSpacing: '0.04em' },
    h2: { fontFamily: FONT_DISPLAY, letterSpacing: '0.04em' },
    h3: { fontFamily: FONT_DISPLAY, letterSpacing: '0.04em' },
    h4: { fontFamily: FONT_DISPLAY, letterSpacing: '0.04em' },
    h5: { fontFamily: FONT_DISPLAY, letterSpacing: '0.04em' },
    h6: { fontFamily: FONT_DISPLAY, letterSpacing: '0.04em' },
    button: {
      fontFamily: FONT_MONO,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 2,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#00d4d4 #1a2b35',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: '#1a2b35' },
          '&::-webkit-scrollbar-thumb': {
            background: '#00d4d4',
            borderRadius: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        outlined: {
          borderStyle: 'solid',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: FONT_MONO,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: FONT_MONO,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderStyle: 'dashed',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: FONT_MONO,
          fontSize: '0.875rem',
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          transition: 'color 0.15s ease',
          '&:hover': {
            backgroundColor: 'transparent',
            color: 'var(--mui-palette-secondary-main)',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontFamily: FONT_MONO,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: FONT_MONO,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 2,
          border: '1px solid rgba(136, 153, 170, 0.25)',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: 2,
        },
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
