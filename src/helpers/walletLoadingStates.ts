export const WalletLoadingStates = {
  BACKING_UP_WALLET: 'Backing up...',
  CREATING_WALLET: 'Creating wallet...',
  FETCHING_PASSWORD: 'Fetching Password...',
  IMPORTING_WALLET: 'Importing...',
  RESTORING_WALLET: 'Restoring...',
} as const;

export type WalletLoadingState = typeof WalletLoadingStates[keyof typeof WalletLoadingStates];
