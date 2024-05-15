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
import { DEFAULT_TAB_URL, RAINBOW_HOME } from '../constants';

export const AccountIcon = React.memo(function AccountIcon() {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { wallets, walletNames } = useWallets();

  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);

  const { activeTabRef } = useBrowserContext();
  const activeTabHost = useBrowserStore(state => getDappHost(state.getActiveTabUrl())) || DEFAULT_TAB_URL;
  const isOnHomepage = useBrowserStore(state => (state.getActiveTabUrl() || DEFAULT_TAB_URL) === RAINBOW_HOME);
  const hostSessions = useAppSessionsStore(state => state.getActiveSession({ host: activeTabHost }));
  const currentSession = useMemo(
    () =>
      hostSessions && hostSessions.sessions?.[hostSessions.activeSessionAddress]
        ? {
            address: hostSessions.activeSessionAddress,
            network: hostSessions.sessions[hostSessions.activeSessionAddress],
          }
        : null,
    [hostSessions]
  );

  // listens to the current active tab and sets the account
  useEffect(() => {
    if (activeTabHost || isOnHomepage) {
      if (currentSession?.address) {
        setCurrentAddress(currentSession?.address);
      } else if (hostSessions?.activeSessionAddress) {
        setCurrentAddress(hostSessions.activeSessionAddress);
      } else {
        setCurrentAddress(accountAddress);
      }
    }
  }, [accountAddress, activeTabHost, currentSession, hostSessions?.activeSessionAddress, isOnHomepage]);

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
      <ButtonPressAnimation onPress={handleOnPress} scaleTo={0.8} overflowMargin={30}>
        {accountInfo?.accountImage ? (
          <ImageAvatar image={accountInfo.accountImage} size="signing" />
        ) : (
          <ContactAvatar color={accountInfo.accountColor} size="signing" value={accountInfo.accountSymbol} />
        )}
      </ButtonPressAnimation>
    </Bleed>
  );
});
