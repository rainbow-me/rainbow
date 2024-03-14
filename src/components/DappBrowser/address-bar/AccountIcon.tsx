import React, { useCallback, useMemo } from 'react';
import { useAccountSettings, useWallets } from '@/hooks';
import { useNavigation } from '@react-navigation/native';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';

export const AccountIcon = () => {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { wallets, walletNames } = useWallets();

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: accountAddress,
      onChangeWallet: address => {
        // TODO plug in when we have sessions hooked up
      },
      watchOnly: true,
    });
  }, [accountAddress, navigate]);

  // TODO: use dapp specifc address
  const accountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets || {}, accountAddress);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, accountAddress);
    return {
      ...profileInfo,
    };
  }, [wallets, accountAddress, walletNames]);

  return (
    <ButtonPressAnimation onPress={handlePressChangeWallet}>
      {accountInfo?.accountImage ? (
        <ImageAvatar image={accountInfo.accountImage} size="medium" />
      ) : (
        <ContactAvatar color={accountInfo.accountColor} size="medium" value={accountInfo.accountSymbol} />
      )}
    </ButtonPressAnimation>
  );
};
