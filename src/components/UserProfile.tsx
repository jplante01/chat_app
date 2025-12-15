import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import SettingsIcon from '@mui/icons-material/Settings';
import { Profile } from '@/types/database.types';

interface UserProfileProps {
  profile: Profile;
  onSettingsClick?: () => void;
}

export default function UserProfile({ profile, onSettingsClick }: UserProfileProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
      }}
    >
      <Avatar
        src={profile.avatar_url || undefined}
        sx={{ width: 40, height: 40 }}
      >
        {profile.username?.[0]?.toUpperCase() || '?'}
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {profile.username}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: profile.status === 'online' ? 'success.main' : 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: profile.status === 'online' ? 'success.main' : 'grey.400',
              display: 'inline-block',
            }}
          />
          {profile.status === 'online' ? 'Online' : 'Offline'}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={onSettingsClick}
        sx={{ color: 'text.secondary' }}
      >
        <SettingsIcon />
      </IconButton>
    </Box>
  );
}
