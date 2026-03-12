import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { IconSettings } from '@tabler/icons-react';
import { Profile } from '../types/database.types';

interface UserProfileProps {
  profile: Profile;
  onSettingsClick?: () => void;
}

export default function UserProfile({ profile, onSettingsClick }: UserProfileProps) {
  return (
    <Box
      sx={{
        paddingLeft: 2,
        paddingRight: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        minHeight: { xs: '48px', sm: '52px' },
      }}
    >
      <Avatar
        src={profile.avatar_url || undefined}
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: '0.75rem',
          fontWeight: 700,
        }}
      >
        {profile.username?.[0]?.toUpperCase() || '?'}
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'text.secondary',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}
        >
          online
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'primary.main',
            fontSize: '0.8rem',
            letterSpacing: '0.03em',
          }}
        >
          {profile.username}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={onSettingsClick}
        sx={{
          color: 'text.secondary',
          '& svg': { width: { xs: 16, sm: 28 }, height: { xs: 16, sm: 28 } },
        }}
      >
        <IconSettings size={28} />
      </IconButton>
    </Box>
  );
}
