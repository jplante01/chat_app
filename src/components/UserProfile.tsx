import { useRef } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { IconSettings, IconCamera } from '@tabler/icons-react';
import { Profile } from '../types/database.types';
import { useAuth } from '../contexts/AuthContext';
import { useUploadAvatar } from '../hooks/useProfile';
import { getAvatarUrl } from '../utils/avatarUrl';

interface UserProfileProps {
  profile: Profile;
  onSettingsClick?: () => void;
}

export default function UserProfile({ profile, onSettingsClick }: UserProfileProps) {
  const { user } = useAuth();
  const { mutate: uploadAvatar, isPending: uploading } = useUploadAvatar(user!.id);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    uploadAvatar(file);
    e.target.value = '';
  };

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
      <Box
        sx={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
        onClick={() => inputRef.current?.click()}
      >
        <Avatar
          src={getAvatarUrl(profile.avatar_url, profile.updated_at)}
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

        {uploading ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
            }}
          >
            <CircularProgress size={16} sx={{ color: 'white' }} />
          </Box>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              opacity: 0,
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 1 },
            }}
          >
            <IconCamera size={14} color="white" />
          </Box>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </Box>

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
