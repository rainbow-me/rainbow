import { areTokenIdsNetworkQualified } from '@/features/nfts/core/uniqueId';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { updateWebHidden, updateWebShowcase } from '@/helpers/webData';
import { logger, RainbowError } from '@/logger';
import { getPreference } from '@/model/preferences';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';

import { useNftsStore } from './nfts';
import { migrateTokens } from './utils';

const EMPTY_TOKEN_IDS: string[] = [];

async function migratePreferenceTokenIds(address: string, category: 'hidden' | 'showcase', tokenIds: string[]): Promise<string[]> {
  const isReadOnlyWallet = getWalletWithAccount(address)?.type === EthereumWalletType.readOnly;
  if (isReadOnlyWallet) return EMPTY_TOKEN_IDS;

  try {
    const migratedTokenIds = await migrateTokens(address, tokenIds);
    if (!migratedTokenIds) return tokenIds;

    if (category === 'hidden') {
      await updateWebHidden(address, migratedTokenIds);
    } else {
      await updateWebShowcase(address, migratedTokenIds);
      useNftsStore.getState(address).openCollection('showcase');
    }

    return migratedTokenIds;
  } catch (error) {
    logger.error(new RainbowError('Failed to migrate NFT token preferences', error), { category });
    return tokenIds;
  }
}

/**
 * Loads saved Hidden IDs and migrates legacy entries when possible.
 */
export async function getHiddenTokenIds(address: string): Promise<string[]> {
  if (!address) return EMPTY_TOKEN_IDS;

  const preference = await getPreference('hidden', address);
  const tokenIds = preference?.hidden?.ids;
  if (!tokenIds?.length) return EMPTY_TOKEN_IDS;
  if (!areTokenIdsNetworkQualified(tokenIds)) return migratePreferenceTokenIds(address, 'hidden', tokenIds);
  return tokenIds.map(tokenId => tokenId.toLowerCase());
}

/**
 * Loads saved Showcase IDs. A successful migration opens Showcase for that account.
 */
export async function getShowcaseTokenIds(address: string): Promise<string[]> {
  if (!address) return EMPTY_TOKEN_IDS;

  const preference = await getPreference('showcase', address);
  const tokenIds = preference?.showcase?.ids;
  if (!tokenIds?.length) return EMPTY_TOKEN_IDS;
  if (!areTokenIdsNetworkQualified(tokenIds)) return migratePreferenceTokenIds(address, 'showcase', tokenIds);
  return tokenIds.map(tokenId => tokenId.toLowerCase());
}
