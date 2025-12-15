import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import ConversationsList from './ConversationsList';

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

const DrawerContent = ({ selectedConversationId, onConversationSelect }: DrawerContentProps) => (
  <div>
    <Toolbar />
    <ConversationsList
      selectedConversationId={selectedConversationId}
      onConversationSelect={onConversationSelect}
    />
  </div>
);

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
