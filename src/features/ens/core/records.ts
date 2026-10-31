import type { Records } from '../types/registration';

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
  twitter = 'com.twitter', // correct as of 2025
  telegram = 'org.telegram',
  ensDelegate = 'eth.ens.delegate',
  pronouns = 'pronouns',
}

export const deprecatedTextRecordFields: Partial<Record<string, string>> = {
  'me.rainbow.displayName': 'name',
  'content': 'contenthash',
};

/**
 * Returns the record writes needed to apply an edit, including empty values for deletions.
 */
export function getChangedRecords(records: Records, initialRecords: Records): Records {
  const changed: Records = {};
  for (const [key, value] of Object.entries(records)) {
    if (value && value !== initialRecords[key]) changed[key] = value;
  }
  for (const key of Object.keys(initialRecords)) {
    if (initialRecords[key] && !records[key]) changed[key] = '';
  }
  return changed;
}
