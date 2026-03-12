import { useColorScheme } from '@mui/material/styles';
import { IconButton } from '@mui/material';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  const toggleTheme = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  if (!mode) {
    return null;
  }

  return (
    <IconButton onClick={toggleTheme} color="inherit" aria-label="toggle theme" size="small">
      {mode === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </IconButton>
  );
}
