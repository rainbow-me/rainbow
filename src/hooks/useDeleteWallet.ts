import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { removeWalletData } from '@/handlers/localstorage/removeWallet';
import { useWallets } from '@/hooks';
import { RainbowAccount, RainbowWallet } from '@/model/wallet';
import { walletsUpdate } from '@/redux/wallets';

export default function useDeleteWallet({ address: primaryAddress }: { address?: string }) {
  const dispatch = useDispatch();

  const { wallets } = useWallets();

  const [watchingWalletId] = useMemo(() => {
    return (
      Object.entries<RainbowWallet>(wallets || {}).find(([_, wallet]: [string, RainbowWallet]) =>
        wallet.addresses.some(({ address }: RainbowAccount) => address === primaryAddress)
      ) || ['', '']
    );
  }, [primaryAddress, wallets]);

  const deleteWallet = useCallback(() => {
    const newWallets = {
      ...wallets,
      [watchingWalletId]: {
        ...wallets![watchingWalletId],
        addresses: wallets![watchingWalletId].addresses.map((account: { address: string }) =>
          account.address.toLowerCase() === primaryAddress?.toLowerCase()
            ? { ...(account as RainbowAccount), visible: false }
            : (account as RainbowAccount)
        ),
      },
    };
    // If there are no visible wallets
    // then delete the wallet
    const visibleAddresses = newWallets[watchingWalletId].addresses.filter((account: { visible: boolean }) => account.visible);
    if (visibleAddresses.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newWallets[watchingWalletId];
      dispatch(walletsUpdate(newWallets));
    } else {
      dispatch(walletsUpdate(newWallets));
    }
    removeWalletData(primaryAddress);
  }, [dispatch, primaryAddress, wallets, watchingWalletId]);

  return deleteWallet;
}
