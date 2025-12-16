# Theme Implementation Guide

This document explains our MUI theming approach and how to use it throughout the application.

## Overview

We use **MUI v7** with **CSS variables** (`cssVariables: true`) for theming. This provides:
- Automatic light/dark mode support
- System preference detection
- Persistent user preference (localStorage)
- Instant theme switching without re-renders
- Type-safe access to theme values

## Architecture

### Theme Provider Setup

The theme is configured in `src/providers/ThemeProvider.tsx`:

```typescript
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        // Light mode palette customizations
      },
    },
    dark: {
      palette: {
        // Dark mode palette customizations
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
```

The app is wrapped in `src/main.tsx`:

```typescript
<ThemeProvider>
  <QueryProvider>
    <App />
  </QueryProvider>
</ThemeProvider>
```

## How It Works

1. **Initial Load**: Detects system preference or reads from localStorage (`mui-mode` key)
2. **User Toggle**: User can manually switch modes using `useColorScheme()` hook
3. **Persistence**: User preference is automatically saved to localStorage
4. **Updates**: Theme changes update CSS variables instantly (no component re-renders needed)

## Usage Patterns

### 1. Using MUI Components (No Hook Needed)

MUI components automatically use theme values:

```typescript
// ✅ Button uses theme.palette.primary automatically
<Button color="primary">Click me</Button>

// ✅ Alert uses theme.palette.error automatically
<Alert severity="error">Error message</Alert>

// ✅ Typography uses theme.typography.h1 automatically
<Typography variant="h1">Title</Typography>

// ✅ Paper uses theme.palette.background.paper automatically
<Paper>Content</Paper>
```

### 2. Using Theme in `sx` Prop

Access theme values directly in `sx` prop:

```typescript
<Box
  sx={{
    color: 'primary.main',           // Uses theme.palette.primary.main
    bgcolor: 'background.paper',     // Uses theme.palette.background.paper
    p: 2,                            // Uses theme.spacing(2)
    borderRadius: 1,                 // Uses theme.shape.borderRadius
  }}
>
  Content
</Box>
```

### 3. Using `useTheme()` Hook

When you need programmatic access to theme values:

```typescript
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();

  return (
    <div style={{
      color: theme.palette.primary.main,
      padding: theme.spacing(2),
    }}>
      Content
    </div>
  );
}
```

**Common use cases:**
- Custom inline styles
- Conditional logic based on theme values
- Responsive design with `theme.breakpoints`

```typescript
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

### 4. Creating a Theme Toggle

Use `useColorScheme()` to toggle between light/dark mode:

```typescript
import { useColorScheme } from '@mui/material/styles';
import { IconButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <IconButton onClick={toggleTheme} color="inherit">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}
```

**Note:** `mode` can be `'light'`, `'dark'`, or `'system'`. You can also allow users to choose 'system' mode:

```typescript
function ThemeMenu() {
  const { mode, setMode } = useColorScheme();

  return (
    <Select value={mode} onChange={(e) => setMode(e.target.value)}>
      <MenuItem value="light">Light</MenuItem>
      <MenuItem value="dark">Dark</MenuItem>
      <MenuItem value="system">System</MenuItem>
    </Select>
  );
}
```

### 5. Using Styled Components

When creating custom styled components:

```typescript
import { styled } from '@mui/material/styles';

const StyledCard = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],

  // Responsive styles
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

function MyComponent() {
  return <StyledCard>Content</StyledCard>;
}
```

## Common Theme Values

### Colors (Palette)

```typescript
theme.palette.primary.main        // Primary brand color
theme.palette.secondary.main      // Secondary brand color
theme.palette.error.main          // Error state color
theme.palette.warning.main        // Warning state color
theme.palette.info.main           // Info state color
theme.palette.success.main        // Success state color
theme.palette.background.default  // Page background
theme.palette.background.paper    // Card/paper background
theme.palette.text.primary        // Primary text color
theme.palette.text.secondary      // Secondary text color
theme.palette.divider             // Divider color
```

### Spacing

```typescript
theme.spacing(1)   // 8px (default)
theme.spacing(2)   // 16px
theme.spacing(0.5) // 4px
```

### Breakpoints

```typescript
theme.breakpoints.up('sm')    // >= 600px
theme.breakpoints.down('md')  // < 900px
theme.breakpoints.between('sm', 'lg')
```

### Typography

```typescript
theme.typography.h1
theme.typography.h2
theme.typography.body1
theme.typography.button
```

## Customizing the Theme

To customize colors for your app, edit `src/providers/ThemeProvider.tsx`:

```typescript
const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#1976d2',  // Custom blue
        },
        background: {
          default: '#f5f5f5',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#90caf9',  // Lighter blue for dark mode
        },
        background: {
          default: '#121212',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,  // Default border radius
  },
});
```

## Best Practices

1. **Prefer MUI components**: Use MUI components when possible - they handle theming automatically

2. **Use `sx` prop for simple styling**: For one-off styles, use the `sx` prop instead of styled components

3. **Use semantic color names**: Use `'primary.main'` instead of hardcoded colors like `'#1976d2'`

4. **Avoid `useTheme()` unless needed**: Only use the hook when you need programmatic access to theme values

5. **Test both modes**: Always test your UI in both light and dark mode to ensure good contrast and readability

6. **Customize per mode**: Define different color values for light/dark modes when needed for accessibility

## Troubleshooting

### Theme not applying
- Ensure `ThemeProvider` wraps your entire app in `main.tsx`
- Check that `CssBaseline` is inside the `ThemeProvider`

### Colors not switching
- Verify `cssVariables: true` is set in `createTheme()`
- Check that colors are defined in both `colorSchemes.light` and `colorSchemes.dark`

### Hook errors
- `useTheme()` and `useColorScheme()` must be called inside components that are wrapped by `ThemeProvider`
