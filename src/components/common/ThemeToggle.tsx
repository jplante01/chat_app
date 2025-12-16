import { useColorScheme } from '@mui/material/styles';
import { IconButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  // Handle loading state when mode is not yet determined
  if (!mode) {
    return null;
  }

  return (
    <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme">
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}
