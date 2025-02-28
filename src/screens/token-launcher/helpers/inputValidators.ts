import { isValidURLWorklet } from '@/components/DappBrowser/utils';
import { MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_TOTAL_SUPPLY } from '../constants';
import { LinkType } from '../state/tokenLauncherStore';

export type ValidationResult = { error: boolean; message?: string } | undefined;

export function validateNameWorklet(name: string): ValidationResult {
  'worklet';
  if (name.trim().length > MAX_NAME_LENGTH) {
    return { error: true, message: 'Too long, friend.' };
  }
  if (name.trim().length === 0) {
    return { error: true, message: 'Name is required' };
  }
}

export function validateSymbolWorklet(symbol: string): ValidationResult {
  'worklet';
  if (symbol.trim().length > MAX_SYMBOL_LENGTH) {
    return { error: true, message: 'Too long, friend.' };
  }
  if (symbol.trim().length === 0) {
    return { error: true, message: 'Symbol is required' };
  }
}

export function validateTotalSupplyWorklet(supply: number): ValidationResult {
  'worklet';
  if (supply > MAX_TOTAL_SUPPLY) {
    return { error: true, message: 'Too big.' };
  }
  if (supply <= 0) {
    return { error: true, message: 'Must be greater than 0' };
  }
}

type SocialPlatformConfig = {
  usernameRegex: RegExp;
  baseUrls: string[];
};

type UrlOnlyPlatformConfig = {
  requiresValidUrl: boolean;
};

type PlatformConfig = SocialPlatformConfig | UrlOnlyPlatformConfig;

const PLATFORM_CONFIGS: Record<LinkType, PlatformConfig> = {
  x: {
    usernameRegex: /^@?[a-zA-Z0-9_]{1,15}$/,
    baseUrls: ['twitter.com/', 'x.com/'],
  },
  telegram: {
    usernameRegex: /^@?[a-zA-Z0-9_]{5,32}$/,
    baseUrls: ['t.me/', 'telegram.me/'],
  },
  farcaster: {
    usernameRegex: /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,15}$/,
    baseUrls: ['warpcast.com/'],
  },
  discord: {
    usernameRegex: /^[a-z0-9_.]{2,32}$/i,
    baseUrls: ['discord.gg/', 'discord.com/'],
  },
  website: {
    requiresValidUrl: true,
  },
  other: {
    requiresValidUrl: true,
  },
};

export function validateLinkWorklet({ link, type }: { link: string; type: LinkType }): ValidationResult {
  'worklet';

  if (link.includes(' ')) {
    return { error: true };
  }

  // Empty links are just ignored, but not an error
  if (link.length === 0) {
    return;
  }

  const config = PLATFORM_CONFIGS[type];

  // For website and other types that just need URL validation
  if ('requiresValidUrl' in config) {
    if (!isValidURLWorklet(link)) {
      return { error: true };
    }
    return;
  }

  const { usernameRegex, baseUrls } = config;

  // Check if the link is a URL containing one of the platform's base URLs
  const isUrl = baseUrls.some((baseUrl: string) => link.includes(baseUrl));

  if (isUrl) {
    if (!isValidURLWorklet(link)) {
      return { error: true };
    }

    const username = link.split('/').pop();
    if (!username || !usernameRegex.test(username)) {
      return { error: true };
    }
  }
  // If not a URL, validate as username directly
  else if (!usernameRegex.test(link)) {
    return { error: true };
  }
}
