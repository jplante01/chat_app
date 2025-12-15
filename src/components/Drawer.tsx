import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import ConversationsList from './ConversationsList';
import UserProfile from './UserProfile';
import UserSearch from './UserSearch';
import { Profile } from '@/types/database.types';

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

// Mock current user - in a real app this would come from auth context
const CURRENT_USER: Profile = {
  id: 'current-user',
  username: 'You',
  avatar_url: null,
  created_at: '2025-12-01T10:00:00Z',
  last_seen_at: '2025-12-15T09:42:00Z',
  status: 'online',
};

const DrawerContent = ({ selectedConversationId, onConversationSelect }: DrawerContentProps) => {
  const handleSettingsClick = () => {
    console.log('Settings clicked');
    // TODO: Open settings dialog/page
  };

  const handleUserSelect = (user: Profile) => {
    console.log('Selected user:', user);
    // TODO: Check if conversation exists, create if not, then select it
    // For now, just log - real implementation will come later
  };

  return (
    <div>
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <UserProfile profile={CURRENT_USER} onSettingsClick={handleSettingsClick} />
      </Toolbar>
      <UserSearch currentUserId={CURRENT_USER.id} onUserSelect={handleUserSelect} />
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
  isClosing,
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
