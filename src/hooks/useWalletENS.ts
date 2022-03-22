import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchImages } from '@rainbow-me/handlers/ens';
import { useWallets } from '@rainbow-me/hooks';
import { RainbowAccount } from '@rainbow-me/model/wallet';
import { walletsUpdate } from '@rainbow-me/redux/wallets';

export default function useWalletENS() {
  const dispatch = useDispatch();

  const { wallets, walletNames, selectedWallet } = useWallets();

  const updateWalletENSAvatars = useCallback(async () => {
    const walletKeys = Object.keys(wallets);
    let updatedWallets;
    for (const i in walletKeys) {
      const key = walletKeys[i];
      const wallet = wallets[key];
      const accounts = wallet?.addresses;
      for (const j in accounts) {
        const account = accounts[j];
        const ens = walletNames[account.address];
        if (ens) {
          const images = await fetchImages(ens);
          if (images?.avatarUrl) {
            const addresses = wallets[key].addresses.map(
              (acc: RainbowAccount) => ({
                ...account,
                image:
                  account.address === acc.address
                    ? images.avatarUrl
                    : account.image,
              })
            );
            updatedWallets = {
              ...wallets,
              [key]: {
                ...wallets[key],
                addresses,
              },
            };
          }
        }
      }
    }
    updatedWallets && dispatch(walletsUpdate(updatedWallets));
  }, [dispatch, walletNames, wallets]);

  return { updateWalletENSAvatars };
}
