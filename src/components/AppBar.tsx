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
  conversationTitle?: string | null;
}

export default function AppBar({ drawerWidth, onDrawerToggle, hasUnreadMessages = false, conversationTitle }: AppBarProps) {
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

        {/* Mobile: show app name or conversation title */}
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
          {conversationTitle ?? 'QUICKCHAT'}
        </Typography>

        {/* Desktop: show conversation title centered in the bar */}
        {conversationTitle && (
          <Typography
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              color: 'text.secondary',
            }}
          >
            {conversationTitle}
          </Typography>
        )}

        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </MuiAppBar>
  );
}
