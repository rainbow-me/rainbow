import { toLower } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { removeWalletData } from '@rainbow-me/handlers/localstorage/removeWallet';
import { useWallets } from '@rainbow-me/hooks';
import { walletsUpdate } from '@rainbow-me/redux/wallets';

export default function useDeleteWallet({
  address: primaryAddress,
}: {
  address?: string;
}) {
  const dispatch = useDispatch();

  const { wallets } = useWallets();

  const [watchingWalletId] = useMemo(() => {
    return (
      Object.entries(wallets || {}).find(([_, wallet]: [string, any]) =>
        wallet.addresses.some(({ address }: any) => address === primaryAddress)
      ) || ['', '']
    );
  }, [primaryAddress, wallets]);

  const deleteWallet = useCallback(() => {
    const newWallets = {
      ...wallets,
      [watchingWalletId]: {
        ...wallets[watchingWalletId],
        addresses: wallets[
          watchingWalletId
        ].addresses.map((account: { address: string }) =>
          toLower(account.address) === toLower(primaryAddress)
            ? { ...account, visible: false }
            : account
        ),
      },
    };
    // If there are no visible wallets
    // then delete the wallet
    const visibleAddresses = newWallets[watchingWalletId].addresses.filter(
      (account: { visible: boolean }) => account.visible
    );
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
