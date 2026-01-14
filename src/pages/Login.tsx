import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Stack,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import QuickChatLogo from '../logo/QuickChat';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack direction="column" alignItems="center" sx={{ height: '100%' }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ padding: { xs: '0.5rem', sm: '1.5rem' }, marginBottom: '2rem' }}
        justifyContent="space-between"
      >
        <Stack direction="row" alignItems="center" width="100vw">
          <Box
            sx={{
              width: { xs: '60px', sm: '80px' },
              height: { xs: '60px', sm: '80px' },
              marginRight: '0.5rem',
            }}
          >
            <QuickChatLogo
              sx={{
                width: '100%',
                height: '100%',
                // color: theme.palette.text.primary,
              }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontFamily: '"Orbitron", sans-serif',
              fontWeight: 700,
            }}
          >
            QuickChat
          </Typography>
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          marginTop: '2rem',
          padding: '2rem',
          position: 'relative',
        }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{
              position: 'absolute',
              bottom: 'calc(100%)',
              // bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 4rem)',
              maxWidth: '400px',
              zIndex: 10,
            }}
          >
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/signup">
                Sign Up
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
