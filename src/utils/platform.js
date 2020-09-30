import { Platform } from 'react-native';

export const cloudPlatform = Platform.OS === 'ios' ? 'iCloud' : 'Google Drive';
