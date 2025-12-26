import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
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

const DrawerContent = ({ selectedConversationId, onConversationSelect }: DrawerContentProps) => {
  const { profile } = useAuth();

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // TODO: Open settings dialog/page
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <UserProfile profile={profile} onSettingsClick={handleSettingsClick} />
      </Toolbar>
      <ConversationsList
        selectedConversationId={selectedConversationId}
        onConversationSelect={onConversationSelect}
      />
    </div>
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
      aria-label="mailbox folders"
    >
      <MuiDrawer
        variant="temporary"
        open={mobileOpen}
        onTransitionEnd={onDrawerTransitionEnd}
        onClose={onDrawerClose}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        slotProps={{
          root: {
            keepMounted: true,
          },
        }}
      >
        <DrawerContent
          selectedConversationId={selectedConversationId}
          onConversationSelect={onConversationSelect}
        />
      </MuiDrawer>
      <MuiDrawer
        variant="permanent"
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
