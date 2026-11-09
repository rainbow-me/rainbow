import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';

// ============ Content Placeholders =========================================== //

export const CONTENT_PLACEHOLDER: CellTypes[] = [
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-1' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-2' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-3' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-4' },
  { type: CellType.LOADING_ASSETS, uid: 'loadings-asset-5' },
];

export const EMPTY_WALLET_CONTENT: CellTypes[] = [
  {
    type: CellType.RECEIVE_CARD,
    uid: 'receive_card',
  },
  { type: CellType.EMPTY_WALLET_SPACER, uid: 'empty-wallet-spacer-1' },
  { type: CellType.ETH_CARD, uid: 'eth-card' },
  { type: CellType.EMPTY_WALLET_SPACER, uid: 'empty-wallet-spacer-2' },
  {
    type: CellType.LEARN_CARD,
    uid: 'learn-card',
  },
  { type: CellType.BIG_EMPTY_WALLET_SPACER, uid: 'big-empty-wallet-spacer-2' },
  {
    type: CellType.DISCOVER_MORE_BUTTON,
    uid: 'discover-home-button',
  },
];

export const ONLY_NFTS_CONTENT: CellTypes[] = [{ type: CellType.ETH_CARD, uid: 'eth-card' }];

// ============ Constants ====================================================== //

export const COINS_TO_SHOW = 5;
export const ETH_ADDRESS = 'eth';
