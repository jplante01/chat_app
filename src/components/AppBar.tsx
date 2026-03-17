import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import { IconMenu2 } from '@tabler/icons-react';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

interface AppBarProps {
  drawerWidth: number;
  onDrawerToggle: () => void;
  hasUnreadMessages?: boolean;
  conversationTitle?: string | null;
  conversationAvatar?: { src?: string; initial: string };
}

export default function AppBar({ drawerWidth, onDrawerToggle, hasUnreadMessages = false, conversationTitle, conversationAvatar }: AppBarProps) {
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

        {conversationTitle ? (
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {conversationAvatar && (
              <Avatar
                src={conversationAvatar.src}
                sx={{ width: 26, height: 26, fontSize: '0.65rem', fontWeight: 700 }}
              >
                {conversationAvatar.initial}
              </Avatar>
            )}
            <Typography
              sx={{
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                color: 'text.secondary',
              }}
            >
              {conversationTitle}
            </Typography>
          </Box>
        ) : (
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
        )}

        <Box sx={{ flexGrow: 1 }} />
      </Toolbar>
    </MuiAppBar>
  );
}
