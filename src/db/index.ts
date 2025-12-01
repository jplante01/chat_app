// src/db/index.ts
/**
 * Central export for all database operations
 * Import from here to access any database function:
 * 
 * import { messagesDb, conversationsDb } from '@/db';
 */

export { profilesDb } from './profiles';
export { conversationsDb } from './conversations';
export { participantsDb } from './participants';
export { messagesDb } from './messages';