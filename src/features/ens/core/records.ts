import type { Records } from '../types/registration';

/**
 * ENS coin type for Ethereum address records.
 */
export const ETHEREUM_COIN_TYPE = 60;

export enum ENS_RECORDS {
  ETH = 'ETH',
  BTC = 'BTC',
  LTC = 'LTC',
  DOGE = 'DOGE',
  name = 'name',
  displayName = 'me.rainbow.displayName',
  header = 'header',
  content = 'content',
  contenthash = 'contenthash',
  url = 'url',
  email = 'email',
  website = 'website',
  avatar = 'avatar',
  description = 'description',
  notice = 'notice',
  keywords = 'keywords',
  discord = 'com.discord',
  github = 'com.github',
  reddit = 'com.reddit',
  instagram = 'com.instagram',
  snapchat = 'com.snapchat',
  twitter = 'com.twitter',
  telegram = 'org.telegram',
  ensDelegate = 'eth.ens.delegate',
}

export const deprecatedTextRecordFields: Partial<Record<string, string>> = {
  'me.rainbow.displayName': 'name',
  'content': 'contenthash',
};

/**
 * ENS previews use slash paths verbatim except for values starting with `/ipfs` or `/ipns`.
 */
export function isDirectImagePath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('/ipfs') && !value.startsWith('/ipns');
}

/**
 * Returns the record writes needed to apply an edit, including empty values for deletions.
 */
export function getChangedRecords(records: Records, initialRecords: Records): Records {
  const changed: Records = {};

  for (const key in records) {
    const value = records[key];
    if (value && value !== initialRecords[key]) changed[key] = value;
  }

  for (const key in initialRecords) {
    if (initialRecords[key] && !records[key]) changed[key] = '';
  }

  return changed;
}
