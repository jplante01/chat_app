import { useState } from 'react';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { IconLogout, IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import ConversationsList from './ConversationsList';
import UserProfile from './UserProfile';
import NewConversationDialog from './NewConversationDialog';
import { ThemeToggle } from './common/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

interface DrawerProps {
  drawerWidth: number;
  mobileOpen: boolean;
  isClosing: boolean;
  onDrawerClose: () => void;
  onDrawerTransitionEnd: () => void;
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

interface DrawerContentProps {
  selectedConversationId: string | null;
  onConversationSelect: (id: string) => void;
}

const drawerSx = {
  bgcolor: 'background.default',
  borderRight: '1px dashed',
  borderColor: 'divider',
  overflowX: 'hidden',
};

const DrawerContent = ({ selectedConversationId, onConversationSelect }: DrawerContentProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [newConvOpen, setNewConvOpen] = useState(false);

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!profile) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <Toolbar
        sx={{
          borderBottom: '1px dashed',
          borderColor: 'divider',
          minHeight: { xs: 48, sm: 52 },
        }}
        disableGutters
      >
        <UserProfile profile={profile} onSettingsClick={handleSettingsClick} />
      </Toolbar>

      <Box sx={{ flexGrow: 1, overflow: 'hidden', pb: '120px' }}>
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onConversationSelect={onConversationSelect}
        />
      </Box>

      {/* Bottom-right action stack */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ThemeToggle />
        <IconButton
          aria-label="sign out"
          onClick={handleSignOut}
          size="small"
          color="inherit"
          sx={{ '& svg': { width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 }, transform: { xs: 'translateX(3px)', sm: 'translateX(4px)' } } }}
        >
          <IconLogout size={28} />
        </IconButton>
        <Box
          component="button"
          aria-label="new conversation"
          onClick={() => setNewConvOpen(true)}
          sx={{
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
            '&:hover': {
              bgcolor: 'secondary.main',
              color: 'primary.contrastText',
            },
          }}
        >
          <IconPlus size={20} />
        </Box>
      </Box>

      <NewConversationDialog
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
        onConversationCreated={(conversationId) => {
          onConversationSelect(conversationId);
          setNewConvOpen(false);
        }}
      />
    </Box>
  );
};

export default function Drawer({
  drawerWidth,
  mobileOpen,
  isClosing: _isClosing,
  onDrawerClose,
  onDrawerTransitionEnd,
  selectedConversationId,
  onConversationSelect,
}: DrawerProps) {
  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="conversations"
    >
      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={onDrawerTransitionEnd}
        onClose={onDrawerClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ elevation: 0, sx: drawerSx }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        slotProps={{ root: { keepMounted: true } }}
      >
        <DrawerContent
          selectedConversationId={selectedConversationId}
          onConversationSelect={onConversationSelect}
        />
      </MuiDrawer>
      <MuiDrawer
        variant="permanent"
        PaperProps={{ elevation: 0, sx: drawerSx }}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        <DrawerContent
          selectedConversationId={selectedConversationId}
          onConversationSelect={onConversationSelect}
        />
      </MuiDrawer>
    </Box>
  );
}
