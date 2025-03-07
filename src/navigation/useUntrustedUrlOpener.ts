import { useCallback } from 'react';
import URL from 'url-parse';
import { useNavigation } from './Navigation';
import Routes from './routesNames';
import { useOpenInBrowser } from '@/hooks/useOpenInBrowser';

// External link warnings will be skipped for these domains
const trustedDomains = [
  'discord.com',
  'discord.gg',
  'etherscan.io',
  'foundation.app',
  'instagram.com',
  'looksrare.org',
  'opensea.io',
  'quixotic.io',
  'qx.app',
  'rainbow.me',
  'rarible.com',
  'stratosnft.io',
  'trove.treasure.lol',
  'twitter.com',
  'zora.co',
];

export default function useUntrustedUrlOpener(): (url: string) => void {
  const { navigate } = useNavigation();
  const openInBrowser = useOpenInBrowser();
  return useCallback(
    async (url: string) => {
      const { hostname } = new URL(url);

      if (trustedDomains.some(trustedDomain => hostname === trustedDomain || hostname.endsWith(`.${trustedDomain}`))) {
        await openInBrowser(url);
      } else {
        navigate(Routes.EXTERNAL_LINK_WARNING_SHEET, { url });
      }
    },
    [navigate, openInBrowser]
  );
}
