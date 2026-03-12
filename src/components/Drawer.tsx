import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ConversationsList from './ConversationsList';
import UserProfile from './UserProfile';
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
  const { profile } = useAuth();

  const handleSettingsClick = () => {
    console.log('Settings clicked');
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
      <Box sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
        <ConversationsList
          selectedConversationId={selectedConversationId}
          onConversationSelect={onConversationSelect}
        />
      </Box>
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
