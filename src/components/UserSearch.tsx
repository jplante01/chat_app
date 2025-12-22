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
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import { profilesDb } from '../db';
import { Profile } from '../types/database.types';

interface UserSearchProps {
  currentUserId: string;
  onUserSelect: (user: Profile) => void;
}

export default function UserSearch({ currentUserId, onUserSelect }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Query users from database (only when search query is not empty)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: () => profilesDb.search(searchQuery, currentUserId),
    enabled: searchQuery.length > 0,
  });

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
          {isLoading ? (
            <ListItem>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            </ListItem>
          ) : users.length > 0 ? (
            users.map((user) => (
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
