import * as React from 'react';
import Box from '@mui/material/Box';
import AppBar from '../components/AppBar';
import Drawer from '../components/Drawer';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../contexts/AuthContext';
import { useSubscribeToConversations } from '../hooks/useSubscribeToConversations';

const drawerWidth = 240;

export default function MainLayout() {
  const { profile } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  console.log('[MainLayout] Rendering, profile:', profile?.id);

  // Set up realtime subscription for all conversation and message updates
  // This subscription persists for the entire authenticated session
  useSubscribeToConversations(profile?.id);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar drawerWidth={drawerWidth} onDrawerToggle={handleDrawerToggle} />
      <Drawer
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        isClosing={isClosing}
        onDrawerClose={handleDrawerClose}
        onDrawerTransitionEnd={handleDrawerTransitionEnd}
        selectedConversationId={selectedConversationId}
        onConversationSelect={setSelectedConversationId}
      />
      <ChatWindow drawerWidth={drawerWidth} conversationId={selectedConversationId} />
    </Box>
  );
}
