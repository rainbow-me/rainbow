export enum WalletLibraryType {
  ethers = 'ethers',
  bip39 = 'bip39',
  ledger = 'ledger',
}

export const DEFAULT_HD_PATH = `m/44'/60'/0'/0`;

export function getHdPath({ type, index }: { type: WalletLibraryType; index: number }): string {
  switch (type) {
    case WalletLibraryType.ledger:
      // Ledger Live uses the account segment for each derived address.
      // See: https://github.com/LedgerHQ/ledger-live/wiki/LLC:derivation
      return `m/44'/60'/${index}'/0/0`;
    default:
      return `${DEFAULT_HD_PATH}/${index}`;
  }
}
