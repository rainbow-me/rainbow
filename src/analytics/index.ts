import { createClient } from '@segment/analytics-react-native';
// @ts-ignore
import { REACT_APP_SEGMENT_API_WRITE_KEY } from 'react-native-dotenv';

export const analytics = createClient({
  trackAppLifecycleEvents: true,
  trackDeepLinks: true,
  writeKey: REACT_APP_SEGMENT_API_WRITE_KEY,
});
