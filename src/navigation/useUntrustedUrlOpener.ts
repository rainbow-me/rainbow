import { useCallback } from 'react';
import URL from 'url-parse';
import { Navigation } from '@/navigation';
import Routes from './routesNames';
import { openInBrowser } from '@/utils/openInBrowser';

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
  return useCallback((url: string) => {
    const { hostname } = new URL(url);

    if (trustedDomains.some(trustedDomain => hostname === trustedDomain || hostname.endsWith(`.${trustedDomain}`))) {
      openInBrowser(url);
    } else {
      Navigation.handleAction(Routes.EXTERNAL_LINK_WARNING_SHEET, { url });
    }
  }, []);
}
