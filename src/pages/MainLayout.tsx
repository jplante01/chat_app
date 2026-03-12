import * as React from 'react';
import Box from '@mui/material/Box';
import AppBar from '../components/AppBar';
import Drawer from '../components/Drawer';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../contexts/AuthContext';
import { useSubscribeToConversations } from '../hooks/useSubscribeToConversations';
import { useConversations } from '../hooks/useConversations';

const drawerWidth = 240;

export default function MainLayout() {
  const { profile } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  // Set up realtime subscription for all conversation and message updates
  // This subscription persists for the entire authenticated session
  useSubscribeToConversations(profile?.id);

  // Fetch conversations to detect unread messages for AppBar badge
  const { data: conversations } = useConversations(profile?.id || null);

  // Derive the title for the selected conversation
  const conversationTitle = React.useMemo(() => {
    if (!selectedConversationId || !conversations || !profile?.id) return null;
    const conv = conversations.find(c => c.id === selectedConversationId);
    if (!conv) return null;
    const others = conv.participants
      .filter(p => p.profile.id !== profile.id)
      .map(p => p.profile.username);
    return others.length > 0 ? others.join(', ') : null;
  }, [selectedConversationId, conversations, profile?.id]);

  // Check if there are any unread messages across all conversations
  const hasUnreadMessages = React.useMemo(() => {
    if (!conversations || !profile?.id) return false;

    return conversations.some((conversation) => {
      const currentParticipant = conversation.participants.find(p => p.user_id === profile.id);
      if (!currentParticipant) return false;

      return new Date(conversation.updated_at) > new Date(currentParticipant.last_read_at);
    });
  }, [conversations, profile?.id]);

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

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Auto-close drawer on mobile when conversation is selected
    if (mobileOpen) {
      handleDrawerClose();
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar drawerWidth={drawerWidth} onDrawerToggle={handleDrawerToggle} hasUnreadMessages={hasUnreadMessages} conversationTitle={conversationTitle} />
      <Drawer
        drawerWidth={drawerWidth}
        mobileOpen={mobileOpen}
        isClosing={isClosing}
        onDrawerClose={handleDrawerClose}
        onDrawerTransitionEnd={handleDrawerTransitionEnd}
        selectedConversationId={selectedConversationId}
        onConversationSelect={handleConversationSelect}
      />
      <ChatWindow drawerWidth={drawerWidth} conversationId={selectedConversationId} />
    </Box>
  );
}
