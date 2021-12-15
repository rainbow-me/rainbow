import { useCallback } from 'react';
import { Linking } from 'react-native';
import URL from 'url-parse';
import { useNavigation } from './Navigation';
// @ts-expect-error
import Routes from './Routes';

// External link warnings will be skipped for these domains
const trustedLinkDomains = [
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

export default function useUntrustedLinkHandler(): (url: string) => void {
  const { navigate } = useNavigation();
  return useCallback(
    (url: string) => {
      const { hostname: linkHostname } = new URL(url);

      if (
        trustedLinkDomains.some(
          trustedLinkDomain =>
            linkHostname === trustedLinkDomain ||
            linkHostname.endsWith(`.${trustedLinkDomain}`)
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
