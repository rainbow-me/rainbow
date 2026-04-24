import { withSentry } from '@sentry/react-native/expo';
import { type ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Rainbow',
  slug: 'rainbowdotme',
};

export default withSentry(config, {
  url: 'https://sentry.io/',
  // Use SENTRY_AUTH_TOKEN env to authenticate with Sentry.
  project: 'rainbow-wallet',
  organization: 'rainbow-me',
});
