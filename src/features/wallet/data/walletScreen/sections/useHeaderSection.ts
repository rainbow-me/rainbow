import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { useUserAssetsStore } from '@/state/assets/userAssets';

const PROFILE_HEADER: CellTypes[] = [
  { type: CellType.PROFILE_STICKY_HEADER, uid: 'assets-profile-header-compact' },
  { type: CellType.PROFILE_AVATAR_ROW_SPACE_BEFORE, uid: 'profile-avatar-space-before' },
  { type: CellType.PROFILE_AVATAR_ROW, uid: 'profile-avatar' },
  { type: CellType.PROFILE_AVATAR_ROW_SPACE_AFTER, uid: 'profile-avatar-space-after' },
  { type: CellType.PROFILE_NAME_ROW, uid: 'profile-name' },
  { type: CellType.PROFILE_NAME_ROW_SPACE_AFTER, uid: 'profile-name-space-after' },
];
const BALANCE_ROWS: CellTypes[] = [
  { type: CellType.PROFILE_BALANCE_ROW, uid: 'profile-balance' },
  { type: CellType.PROFILE_BALANCE_ROW_SPACE_AFTER, uid: 'profile-balance-space-after' },
];
const ACTION_BUTTONS: CellTypes = { type: CellType.PROFILE_ACTION_BUTTONS_ROW, uid: 'profile-action-buttons' };
const EMPTY_WALLET_SPACER: CellTypes = { type: CellType.BIG_EMPTY_WALLET_SPACER, uid: 'big-empty-wallet-spacer-1' };

const HEADER_WITH_TOKENS: CellTypes[] = [
  ...PROFILE_HEADER,
  ...BALANCE_ROWS,
  ACTION_BUTTONS,
  { type: CellType.PROFILE_ACTION_BUTTONS_ROW_SPACE_AFTER, uid: 'profile-action-buttons-space-after' },
];
const LOADING_HEADER: CellTypes[] = [...PROFILE_HEADER, ...BALANCE_ROWS, ACTION_BUTTONS, EMPTY_WALLET_SPACER];
const EMPTY_HEADER: CellTypes[] = [...PROFILE_HEADER, ACTION_BUTTONS, EMPTY_WALLET_SPACER];

export const useHeaderSection = createDerivedStore(
  $ => {
    const hasTokens = $(useWalletAssetsStore, s => s.assets.size > 0 || s.hiddenAssets.length > 0);
    const isLoadingUserAssets = $(useUserAssetsStore, s => s.isInitialLoad());

    if (hasTokens) return HEADER_WITH_TOKENS;
    return isLoadingUserAssets ? LOADING_HEADER : EMPTY_HEADER;
  },
  { lockDependencies: true }
);
