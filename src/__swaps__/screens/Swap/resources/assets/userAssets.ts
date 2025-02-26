import { Address } from 'viem';
import { createQueryKey } from '@/react-query';
import { SupportedCurrencyKey } from '@/references';

// ///////////////////////////////////////////////
// Query Types

type UserAssetsArgs = {
  address: Address | string;
  currency: SupportedCurrencyKey;
  testnetMode?: boolean;
};

// ///////////////////////////////////////////////
// Query Key

/**
 * @deprecated React Query is no longer used for user assets.
 */
export const userAssetsQueryKey = ({ address, currency, testnetMode }: UserAssetsArgs) =>
  createQueryKey('userAssets', { address, currency, testnetMode }, { persisterVersion: 3 });
