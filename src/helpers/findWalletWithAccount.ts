export function findWalletWithAccount(wallets: any, accountAddress: any) {
  const sortedKeys = Object.keys(wallets).sort();
  let walletWithAccount;
  sortedKeys.forEach(key => {
    const wallet = wallets[key];
    const found = wallet.addresses.find(
      (account: any) => account.address === accountAddress
    );
    if (found) {
      walletWithAccount = wallet;
    }
  });
  return walletWithAccount;
}
