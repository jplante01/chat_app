import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function MainLayout() {
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Material UI Vite example in TypeScript
      </Typography>
    </Box>
  );
}
