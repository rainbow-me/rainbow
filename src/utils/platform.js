import { Platform } from 'react-native';

export const CLOUD_PLATFORM = Platform.OS === 'ios' ? 'iCloud' : 'Google Drive';
