export function findWalletWithAccount(wallets, accountAddress) {
  const sortedKeys = Object.keys(wallets).sort();
  let walletWithAccount;
  sortedKeys.forEach(key => {
    const wallet = wallets[key];
    const found = wallet.addresses.find(
      account => account.address === accountAddress
    );
    if (found) {
      walletWithAccount = wallet;
    }
  });
  return walletWithAccount;
}
