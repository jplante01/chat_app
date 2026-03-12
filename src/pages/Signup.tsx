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

export default function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, username);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {/* Header / Logo */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 5 }}>
        <Box sx={{ width: 40, height: 40, color: 'primary.main' }}>
          <QuickChatLogo sx={{ width: '100%', height: '100%' }} />
        </Box>
        <Typography
          sx={{
            fontFamily: '"Bebas Neue", "Orbitron", sans-serif',
            fontSize: { xs: '1.8rem', sm: '2.2rem' },
            letterSpacing: '0.18em',
            color: 'primary.main',
            lineHeight: 1,
          }}
        >
          QUICKCHAT
        </Typography>
      </Stack>

      {/* Form panel */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 360,
          border: '1px dashed',
          borderColor: 'divider',
          p: 3,
          position: 'relative',
        }}
      >
        {/* Corner label */}
        <Typography
          sx={{
            position: 'absolute',
            top: -10,
            left: 12,
            bgcolor: 'background.default',
            px: 1,
            fontSize: '0.65rem',
            color: 'secondary.main',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          auth / register
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: '2px',
              fontSize: '0.75rem',
              '& .MuiAlert-message': { fontFamily: '"Share Tech Mono", monospace' },
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
            id="username"
            label="username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            size="small"
            InputLabelProps={{ sx: { fontSize: '0.8rem', letterSpacing: '0.05em' } }}
            inputProps={{ sx: { fontSize: '0.85rem' } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
            InputLabelProps={{ sx: { fontSize: '0.8rem', letterSpacing: '0.05em' } }}
            inputProps={{ sx: { fontSize: '0.85rem' } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="small"
            InputLabelProps={{ sx: { fontSize: '0.8rem', letterSpacing: '0.05em' } }}
            inputProps={{ sx: { fontSize: '0.85rem' } }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="confirm password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            size="small"
            InputLabelProps={{ sx: { fontSize: '0.8rem', letterSpacing: '0.05em' } }}
            inputProps={{ sx: { fontSize: '0.85rem' } }}
          />
          <Button
            type="submit"
            fullWidth
            variant="outlined"
            color="primary"
            sx={{
              mt: 2.5,
              mb: 1.5,
              py: 1,
              fontSize: '0.8rem',
              letterSpacing: '0.15em',
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
            }}
            disabled={loading}
          >
            {loading ? 'registering...' : '[ create account ]'}
          </Button>
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '0.7rem',
              color: 'text.secondary',
            }}
          >
            have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: 'secondary.main',
                textDecorationColor: 'secondary.main',
                '&:hover': { color: 'primary.main' },
              }}
            >
              sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
