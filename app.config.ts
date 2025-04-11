import { ExpoConfig } from 'expo/config';
import { withSentry } from '@sentry/react-native/expo';

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
