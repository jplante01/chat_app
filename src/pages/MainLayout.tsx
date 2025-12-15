import * as React from 'react';
import Box from '@mui/material/Box';
import AppBar from '../components/AppBar';
import Drawer from '../components/Drawer';
import ChatWindow from '../components/ChatWindow';

const drawerWidth = 240;

export default function MainLayout() {
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>('1');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

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
