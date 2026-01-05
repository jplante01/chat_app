/**
 * Minimal broadcast subscription test
 * Tests if we can connect to Realtime and subscribe to a broadcast channel
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

console.log('[Test] Creating Supabase client...')
const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

console.log('[Test] Setting up channel subscription...')

const channel = supabase
  .channel('test-channel-123')
  .on('broadcast', { event: 'test' }, (payload) => {
    console.log('[Test] Received broadcast:', payload)
  })
  .subscribe((status, err) => {
    console.log('[Test] Subscription status:', status)
    if (err) {
      console.error('[Test] Subscription error:', err)
    }

    if (status === 'SUBSCRIBED') {
      console.log('[Test] ✓ Successfully subscribed!')

      // Try sending a broadcast
      console.log('[Test] Sending test broadcast...')
      channel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'Hello!' }
      })
    }

    if (status === 'CLOSED') {
      console.log('[Test] ✗ Channel closed')
      process.exit(1)
    }
  })

// Keep process alive for 10 seconds
setTimeout(() => {
  console.log('[Test] Timeout - closing')
  supabase.removeChannel(channel)
  process.exit(0)
}, 10000)
