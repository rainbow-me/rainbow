import { createDerivedStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { convertAmountToNativeDisplay } from '@/features/currency/utils/nativeDisplay';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { add, subtract } from '@/helpers/utilities';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useNftsStore } from '@/state/nfts/nfts';
import { useHiddenAssetBalancesStore } from '@/state/wallets/hiddenAssetBalancesStore';
import { useWalletSummaryQueryStore } from '@/state/wallets/useWalletSummaryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';

const HIDDEN_BALANCE_ROW: CellTypes[] = [];

const PROFILE_STICKY_HEADER_CELL: CellTypes = {
  type: CellType.PROFILE_STICKY_HEADER,
  uid: 'assets-profile-header-compact',
};

const PROFILE_AVATAR_ROW_SPACE_BEFORE_CELL: CellTypes = {
  type: CellType.PROFILE_AVATAR_ROW_SPACE_BEFORE,
  uid: 'profile-avatar-space-before',
};

const PROFILE_AVATAR_ROW_CELL: CellTypes = {
  type: CellType.PROFILE_AVATAR_ROW,
  uid: 'profile-avatar',
};

const PROFILE_AVATAR_ROW_SPACE_AFTER_CELL: CellTypes = {
  type: CellType.PROFILE_AVATAR_ROW_SPACE_AFTER,
  uid: 'profile-avatar-space-after',
};

const PROFILE_NAME_ROW_CELL: CellTypes = {
  type: CellType.PROFILE_NAME_ROW,
  uid: 'profile-name',
};

const PROFILE_NAME_ROW_SPACE_AFTER_CELL: CellTypes = {
  type: CellType.PROFILE_NAME_ROW_SPACE_AFTER,
  uid: 'profile-name-space-after',
};

const PROFILE_BALANCE_ROW_SPACE_AFTER_CELL: CellTypes = {
  type: CellType.PROFILE_BALANCE_ROW_SPACE_AFTER,
  uid: 'profile-balance-space-after',
};

const BIG_EMPTY_WALLET_SPACER_CELL: CellTypes = {
  type: CellType.BIG_EMPTY_WALLET_SPACER,
  uid: 'big-empty-wallet-spacer-1',
};

const BIG_EMPTY_WALLET_SPACER_SECTION: CellTypes[] = [BIG_EMPTY_WALLET_SPACER_CELL];

export const useHeaderSection = createDerivedStore($ => {
  const summaryData = $(useWalletSummaryQueryStore, state => state.summary?.data);
  const accountAddress = $(useWalletsStore, state => state.accountAddress);
  const currency = $(useAppSettingsStore, state => state.currency);
  const hiddenAssetBalances = $(useHiddenAssetBalancesStore, state => state.hiddenAssetBalances);
  const hasTokens = $(useWalletAssetsStore, state => state.assets.size > 0);
  const isLoadingUserAssets = $(useUserAssetsStore, state => state.getStatus('isInitialLoad'));
  const hasNFTs = $(useNftsStore, state => (state.collections?.size ?? 0) > 0);

  let accountBalanceDisplay: string | undefined = undefined;
  let isLoadingBalance = true;

  if (summaryData && accountAddress) {
    const accountAddressLowercase = accountAddress.toLowerCase();
    const addressData = summaryData.addresses[accountAddressLowercase as Address];

    if (addressData?.summary) {
      const summary = addressData.summary;
      const assetBalance = summary.asset_value?.toString() || '0';
      const positionsBalance = summary.positions_value?.toString() || '0';
      const claimablesBalance = summary.claimables_value?.toString() || '0';
      const totalAccountBalance = add(assetBalance, add(positionsBalance, claimablesBalance));

      const hiddenBalance = hiddenAssetBalances[accountAddress] ?? '0';
      const balanceMinusHidden = subtract(totalAccountBalance, hiddenBalance);

      accountBalanceDisplay = convertAmountToNativeDisplay(balanceMinusHidden, currency);
      isLoadingBalance = false;
    }
  }

  const shouldHideBalanceRow = !isLoadingUserAssets && !isLoadingBalance && !hasTokens;

  const balanceSection: CellTypes[] = shouldHideBalanceRow
    ? HIDDEN_BALANCE_ROW
    : [
        {
          type: CellType.PROFILE_BALANCE_ROW,
          uid: 'profile-balance',
          value: accountBalanceDisplay,
          isLoadingBalance,
        },
        PROFILE_BALANCE_ROW_SPACE_AFTER_CELL,
      ];

  const spacer: CellTypes[] = !hasTokens
    ? BIG_EMPTY_WALLET_SPACER_SECTION
    : [
        {
          type: CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER,
          uid: 'profile-action-buttons-space-after',
          value: accountBalanceDisplay,
        },
      ];

  const header: CellTypes[] = [
    PROFILE_STICKY_HEADER_CELL,
    PROFILE_AVATAR_ROW_SPACE_BEFORE_CELL,
    PROFILE_AVATAR_ROW_CELL,
    PROFILE_AVATAR_ROW_SPACE_AFTER_CELL,
    PROFILE_NAME_ROW_CELL,
    PROFILE_NAME_ROW_SPACE_AFTER_CELL,
    ...balanceSection,
    {
      type: CellType.PROFILE_ACTION_BUTTONS_ROW,
      uid: 'profile-action-buttons',
      value: accountBalanceDisplay,
    },
    ...spacer,
  ];

  return {
    header,
    isEmpty: !hasTokens && !hasNFTs,
  };
});
