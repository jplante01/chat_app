import MuiAppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import Toolbar from '@mui/material/Toolbar';
import { ThemeToggle } from './common/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AppBarProps {
  drawerWidth: number;
  onDrawerToggle: () => void;
  hasUnreadMessages?: boolean;
}

export default function AppBar({ drawerWidth, onDrawerToggle, hasUnreadMessages = false }: AppBarProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <MuiAppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <Badge
            color="primary"
            variant="dot"
            invisible={!hasUnreadMessages}
          >
            <MenuIcon />
          </Badge>
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />
        <ThemeToggle />
        <IconButton
          color="inherit"
          aria-label="sign out"
          onClick={handleSignOut}
          sx={{ ml: 1 }}
        >
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </MuiAppBar>
  );
}
