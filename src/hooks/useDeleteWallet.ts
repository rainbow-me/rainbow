import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import { RainbowAccount, RainbowWallet } from '@/model/wallet';
import { updateWallets, useWallets } from '@/state/wallets/walletsStore';
import { useCallback, useMemo } from 'react';

export default function useDeleteWallet({ address: primaryAddress }: { address?: string }) {
  const wallets = useWallets();

  const [watchingWalletId] = useMemo(() => {
    return (
      Object.entries<RainbowWallet>(wallets || {}).find(([_, wallet]: [string, RainbowWallet]) =>
        (wallet.addresses || []).some(({ address }: RainbowAccount) => address === primaryAddress)
      ) || ['', '']
    );
  }, [primaryAddress, wallets]);

  const deleteWallet = useCallback(() => {
    if (!wallets) return;

    const newWallets = {
      ...wallets,
      [watchingWalletId]: {
        ...wallets[watchingWalletId],
        addresses: wallets[watchingWalletId].addresses.map((account: { address: string }) =>
          account.address.toLowerCase() === primaryAddress?.toLowerCase()
            ? { ...(account as RainbowAccount), visible: false }
            : (account as RainbowAccount)
        ),
      },
    };
    // If there are no visible wallets
    // then delete the wallet
    const visibleAddresses = newWallets[watchingWalletId].addresses.filter(account => account.visible);

    if (visibleAddresses.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newWallets[watchingWalletId];
      updateWallets({ wallets: newWallets });
    } else {
      updateWallets({ wallets: newWallets });
    }
    removeWalletData(primaryAddress);
  }, [primaryAddress, wallets, watchingWalletId]);

  return deleteWallet;
}
