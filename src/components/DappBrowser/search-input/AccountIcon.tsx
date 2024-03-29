import React, { useCallback, useMemo } from 'react';
import { useAccountSettings, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';
import { Bleed } from '@/design-system';

export const AccountIcon = () => {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { wallets, walletNames } = useWallets();

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET);
  }, [navigate]);

  // TODO: use dapp specifc address
  const accountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets || {}, accountAddress);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, accountAddress);
    return {
      ...profileInfo,
    };
  }, [wallets, accountAddress, walletNames]);

  return (
    <Bleed space="8px">
      <ButtonPressAnimation onPress={handlePressChangeWallet} style={{ padding: 8 }}>
        {accountInfo?.accountImage ? (
          <ImageAvatar image={accountInfo.accountImage} size="signing" />
        ) : (
          <ContactAvatar color={accountInfo.accountColor} size="signing" value={accountInfo.accountSymbol} />
        )}
      </ButtonPressAnimation>
    </Bleed>
  );
};
