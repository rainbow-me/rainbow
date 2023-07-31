import { IS_IOS } from '@/env';
export const cloudPlatform = IS_IOS ? 'iCloud' : 'Google Drive';
export const cloudPlatformAccountName = IS_IOS ? 'Apple iCloud' : 'Google';
