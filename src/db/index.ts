// src/db/index.ts
/**
 * Central export for all database operations
 * Import from here to access any database function:
 *
 * import { profilesDb, conversationsDb, messagesDb, participantsDb } from '@/db';
 */

export { profilesDb } from './profiles';
export { conversationsDb } from './conversations';
export { messagesDb } from './messages';
export { participantsDb } from './participants';
