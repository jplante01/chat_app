import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import { IconMenu2 } from '@tabler/icons-react';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

interface AppBarProps {
  drawerWidth: number;
  onDrawerToggle: () => void;
  hasUnreadMessages?: boolean;
}

export default function AppBar({ drawerWidth, onDrawerToggle, hasUnreadMessages = false }: AppBarProps) {
  return (
    <MuiAppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        bgcolor: 'background.default',
        borderBottom: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ bgcolor: 'background.default', minHeight: { xs: 48, sm: 52 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <Badge color="primary" variant="dot" invisible={!hasUnreadMessages}>
            <IconMenu2 size={18} />
          </Badge>
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Bebas Neue", "Orbitron", sans-serif',
            letterSpacing: '0.15em',
            color: 'primary.main',
            display: { xs: 'block', sm: 'none' },
            fontSize: '1.25rem',
          }}
        >
          QUICKCHAT
        </Typography>

        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </MuiAppBar>
  );
}
