import { Toolbar, Typography, Box } from '@mui/material';

interface ChatWindowProps {
  drawerWidth: number;
  conversationId: string | null;
}

export default function ChatWindow({ drawerWidth, conversationId }: ChatWindowProps) {
  return (
    <Box
      component="main"
      sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
    >
      <Toolbar />
      {conversationId ? (
        <Typography>
          Chat window for conversation: {conversationId}
        </Typography>
      ) : (
        <Typography color="text.secondary">
          Select a conversation to start chatting
        </Typography>
      )}
    </Box>
  );
}
