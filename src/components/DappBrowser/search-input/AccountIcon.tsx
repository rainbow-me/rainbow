import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountSettings, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';
import { Bleed } from '@/design-system';

import { useAppSessionsStore } from '@/state/appSessions';
import { getDappHost } from '../handleProviderRequest';
import { ButtonPressAnimation } from '@/components/animations';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useBrowserContext } from '../BrowserContext';

export const AccountIcon = React.memo(function AccountIcon() {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { wallets, walletNames } = useWallets();
  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);
  const activeTabUrl = useBrowserStore.getState().getActiveTabUrl();
  const activeTabHost = useMemo(() => getDappHost(activeTabUrl), [activeTabUrl]);
  const getActiveSession = useAppSessionsStore(state => state.getActiveSession);
  const currentSession = getActiveSession({ host: activeTabHost });
  const { activeTabRef } = useBrowserContext();

  // listens to the current active tab and sets the account
  useEffect(() => {
    if (activeTabHost) {
      if (!currentSession) {
        return;
      }

      if (currentSession?.address) {
        setCurrentAddress(currentSession?.address);
      } else {
        setCurrentAddress(accountAddress);
      }
    }
  }, [accountAddress, activeTabHost, currentSession]);

  const accountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets || {}, currentAddress);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, currentAddress);
    return {
      ...profileInfo,
    };
  }, [wallets, currentAddress, walletNames]);

  const handleOnPress = useCallback(() => {
    navigate(Routes.DAPP_BROWSER_CONTROL_PANEL, {
      activeTabRef,
    });
  }, [activeTabRef, navigate]);

  return (
    <Bleed space="8px">
      <ButtonPressAnimation onPress={handleOnPress} scaleTo={0.8}>
        {accountInfo?.accountImage ? (
          <ImageAvatar image={accountInfo.accountImage} size="signing" />
        ) : (
          <ContactAvatar color={accountInfo.accountColor} size="signing" value={accountInfo.accountSymbol} />
        )}
      </ButtonPressAnimation>
    </Bleed>
  );
});
