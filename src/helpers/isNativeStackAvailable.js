import { Platform } from 'react-native';

export default Platform.OS === 'ios' && parseFloat(Platform.Version) >= 13;
