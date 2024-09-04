import { RainbowAccount, RainbowWallet } from '@/model/wallet';

export function findWalletWithAccount(wallets: { [key: string]: RainbowWallet }, accountAddress: string): RainbowWallet | undefined {
  const sortedKeys = Object.keys(wallets).sort();
  let walletWithAccount: RainbowWallet | undefined;
  const lowerCaseAccountAddress = accountAddress.toLowerCase();
  sortedKeys.forEach(key => {
    const wallet = wallets[key];
    const found = wallet.addresses?.find((account: RainbowAccount) => account.address?.toLowerCase() === lowerCaseAccountAddress);
    if (found) {
      walletWithAccount = wallet;
    }
  });
  return walletWithAccount;
}
