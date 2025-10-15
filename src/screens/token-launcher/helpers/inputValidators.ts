import i18n from '@/languages';
import { isValidURLWorklet } from '@/components/DappBrowser/utils';
import { MAX_DESCRIPTION_BYTES, MAX_NAME_BYTES, MAX_SYMBOL_BYTES, MAX_TOTAL_SUPPLY } from '../constants';
import { LinkType } from '../types';

export type ValidationResult = { error: boolean; message?: string } | undefined;

const encoder = new TextEncoder();

function countStringBytesWorklet(str: string) {
  'worklet';
  return encoder.encode(str).length;
}

export function validateNameWorklet(name: string): ValidationResult {
  'worklet';
  const trimmedName = name.trim();
  const byteCount = countStringBytesWorklet(trimmedName);

  if (byteCount > MAX_NAME_BYTES) {
    return { error: true, message: i18n.token_launcher.input_errors.too_long() };
  }
  if (byteCount === 0) {
    return { error: true, message: i18n.token_launcher.input_errors.name_required() };
  }
}

export function validateSymbolWorklet(symbol: string): ValidationResult {
  'worklet';
  const trimmedSymbol = symbol.trim();
  const byteCount = countStringBytesWorklet(trimmedSymbol);

  if (byteCount > MAX_SYMBOL_BYTES) {
    return { error: true, message: i18n.token_launcher.input_errors.too_long() };
  }
  if (byteCount === 0) {
    return { error: true, message: i18n.token_launcher.input_errors.symbol_required() };
  }
}

export function validateTotalSupplyWorklet(supply: number): ValidationResult {
  'worklet';
  if (supply > MAX_TOTAL_SUPPLY) {
    return { error: true, message: i18n.token_launcher.input_errors.too_big() };
  }
  if (supply <= 0) {
    return { error: true, message: i18n.token_launcher.input_errors.must_be_greater_than_0() };
  }
}

export function validateDescriptionWorklet(description: string): ValidationResult {
  'worklet';
  const trimmedDescription = description.trim();
  const byteCount = countStringBytesWorklet(trimmedDescription);

  if (byteCount > MAX_DESCRIPTION_BYTES) {
    return { error: true, message: i18n.token_launcher.input_errors.too_long() };
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
    usernameRegex: /^[a-zA-Z0-9_]{1,15}$/,
    baseUrls: ['x.com/', 'twitter.com/'],
  },
  telegram: {
    usernameRegex: /^[a-zA-Z0-9_]{5,32}$/,
    baseUrls: ['t.me/', 'telegram.me/'],
  },
  farcaster: {
    usernameRegex: /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,15}(\.eth)?$/,
    baseUrls: ['warpcast.com/', 'farcaster.xyz/'],
  },
  // TODO: if discord is added later
  // discord: {
  //   usernameRegex: /^[a-z0-9_.]{2,32}$/i,
  //   baseUrls: ['discord.gg/', 'discord.com/'],
  // },
  website: {
    requiresValidUrl: true,
  },
  other: {
    requiresValidUrl: true,
  },
};

export function formatLinkInputToUrl({ input, linkType }: { input: string; linkType: LinkType }): string {
  if (!input) return '';

  const config = PLATFORM_CONFIGS[linkType];

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  if ('requiresValidUrl' in config) {
    // Add https:// if it's missing
    return input.includes('://') ? input : `https://${input}`;
  }

  const { baseUrls } = config as SocialPlatformConfig;

  // Check if it's already a URL with one of the platform's base URLs
  const isUrl = baseUrls.some(baseUrl => input.includes(baseUrl));
  if (isUrl) {
    return input.includes('://') ? input : `https://${input}`;
  }

  // It's a username, so format it as a URL
  return `https://${baseUrls[0]}${input}`;
}

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
