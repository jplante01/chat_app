import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { Profile } from '@/types/database.types';

interface UserSearchProps {
  currentUserId: string;
  onUserSelect: (user: Profile) => void;
}

// Mock users - in a real app this would come from a database query
const MOCK_USERS: Profile[] = [
  {
    id: 'alice-id',
    username: 'Alice',
    avatar_url: null,
    created_at: '2025-12-01T10:00:00Z',
    last_seen_at: '2025-12-15T09:30:00Z',
    status: 'online',
  },
  {
    id: 'bob-id',
    username: 'Bob',
    avatar_url: null,
    created_at: '2025-12-01T10:00:00Z',
    last_seen_at: '2025-12-14T20:15:00Z',
    status: 'offline',
  },
  {
    id: 'charlie-id',
    username: 'Charlie',
    avatar_url: null,
    created_at: '2025-12-01T10:00:00Z',
    last_seen_at: '2025-12-12T14:22:00Z',
    status: 'offline',
  },
  {
    id: 'diana-id',
    username: 'Diana',
    avatar_url: null,
    created_at: '2025-12-01T10:00:00Z',
    last_seen_at: '2025-12-15T10:30:00Z',
    status: 'online',
  },
  {
    id: 'eve-id',
    username: 'Eve',
    avatar_url: null,
    created_at: '2025-12-01T10:00:00Z',
    last_seen_at: '2025-12-13T08:45:00Z',
    status: 'offline',
  },
];

export default function UserSearch({ currentUserId, onUserSelect }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.id !== currentUserId &&
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserClick = (user: Profile) => {
    onUserSelect(user);
    setSearchQuery(''); // Clear search after selection
  };

  return (
    <Box>
      <Box sx={{ p: 2, pb: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {searchQuery && (
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <ListItem key={user.id} disablePadding>
                <ListItemButton onClick={() => handleUserClick(user)}>
                  <ListItemAvatar>
                    <Avatar src={user.avatar_url || undefined}>
                      {user.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.username}
                    secondary={user.status === 'online' ? 'Online' : 'Offline'}
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No users found"
                primaryTypographyProps={{
                  color: 'text.secondary',
                  align: 'center',
                }}
              />
            </ListItem>
          )}
        </List>
      )}
    </Box>
  );
}
