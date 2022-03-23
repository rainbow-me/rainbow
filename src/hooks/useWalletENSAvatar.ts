import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import { fetchImages } from '@rainbow-me/handlers/ens';
import { useWallets } from '@rainbow-me/hooks';
import { RainbowAccount } from '@rainbow-me/model/wallet';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';

export default function useWalletENSAvatar() {
  const dispatch = useDispatch();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { wallets, walletNames, selectedWallet } = useWallets();

  const updateWalletENSAvatars = useCallback(async () => {
    if (!profilesEnabled) return;
    const walletKeys = Object.keys(wallets);
    let updatedWallets;
    for (const key of walletKeys) {
      const wallet = wallets[key];
      for (const account of wallet?.addresses) {
        const ens = walletNames[account.address];
        if (ens) {
          const images = await fetchImages(ens);
          if (images?.avatarUrl) {
            let avatarChanged = false;
            const addresses = wallet.addresses.map((acc: RainbowAccount) => {
              avatarChanged = account.image !== acc.image;
              return {
                ...acc,
                image:
                  account.address === acc.address && account.image !== acc.image
                    ? images.avatarUrl
                    : acc.image,
              };
            });
            // don't update wallets if nothing changed
            if (avatarChanged) {
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
    }
    if (updatedWallets) {
      dispatch(walletsSetSelected(updatedWallets[selectedWallet.id]));
      dispatch(walletsUpdate(updatedWallets));
    }
  }, [dispatch, profilesEnabled, selectedWallet.id, walletNames, wallets]);

  return { updateWalletENSAvatars };
}
