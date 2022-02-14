import { useCallback } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';
import { useNavigation } from './Navigation';
import Routes from './routesNames';

// External link warnings will be skipped for these domains
const trustedDomains = [
  'discord.com',
  'discord.gg',
  'etherscan.io',
  'foundation.app',
  'instagram.com',
  'opensea.io',
  'rainbow.me',
  'rarible.com',
  'twitter.com',
  'zora.co',
];

export default function useUntrustedUrlOpener(): (url: string) => void {
  const { navigate } = useNavigation();

  return useCallback(
    (url: string) => {
      const { hostname } = new URL(url);

      if (
        trustedDomains.some(
          trustedDomain =>
            hostname === trustedDomain || hostname.endsWith(`.${trustedDomain}`)
        )
      ) {
        Linking.openURL(url);
      } else {
        navigate(Routes.EXTERNAL_LINK_WARNING_SHEET, { url });
      }
    },
    [navigate]
  );
}
