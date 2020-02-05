import { Platform } from 'react-native';

export default Platform.OS === 'ios' && Platform.Version >= 13;
