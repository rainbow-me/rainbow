import { RainbowWallet } from '@/model/wallet';

export function findWalletWithAccount(wallets: { [key: string]: RainbowWallet }, accountAddress: string): RainbowWallet | undefined {
  const sortedKeys = Object.keys(wallets).sort();
  let walletWithAccount: RainbowWallet | undefined;
  sortedKeys.forEach(key => {
    const wallet = wallets[key];
    const found = wallet.addresses.find((account: any) => account.address === accountAddress);
    if (found) {
      walletWithAccount = wallet;
    }
  });
  return walletWithAccount;
}
