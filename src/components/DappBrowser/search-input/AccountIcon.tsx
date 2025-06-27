import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Bleed, useColorMode } from '@/design-system';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAppSessionsStore } from '@/state/appSessions';
import { useBrowserStore } from '@/state/browser/browserStore';
import { getAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useBrowserContext } from '../BrowserContext';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, RAINBOW_HOME } from '../constants';
import { getDappHost } from '../handleProviderRequest';

export const AccountIcon = React.memo(function AccountIcon() {
  const { isDarkMode } = useColorMode();

  const { activeTabRef } = useBrowserContext();
  const activeTabHost = useBrowserStore(state => getDappHost(state.getActiveTabUrl())) || RAINBOW_HOME;
  const isOnHomepage = useBrowserStore(state => (state.getActiveTabUrl() || RAINBOW_HOME) === RAINBOW_HOME);
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

  const accountAddress = getAccountAddress();
  const [currentAddress, setCurrentAddress] = useState(
    () => currentSession?.address || hostSessions?.activeSessionAddress || accountAddress
  );
  const accountInfo = useAccountProfileInfo(currentAddress);

  // listens to the current active tab and sets the account
  useLayoutEffect(() => {
    if (activeTabHost || isOnHomepage) {
      if (currentSession?.address) {
        setCurrentAddress(currentSession?.address);
      } else if (hostSessions?.activeSessionAddress) {
        setCurrentAddress(hostSessions.activeSessionAddress);
      } else {
        setCurrentAddress(accountAddress);
      }
    }
  }, [accountAddress, activeTabHost, currentSession?.address, hostSessions?.activeSessionAddress, isOnHomepage]);

  const handleOnPress = useCallback(() => {
    Navigation.handleAction(Routes.DAPP_BROWSER_CONTROL_PANEL, {
      activeTabRef,
    });
  }, [activeTabRef]);

  return (
    <Bleed space="8px">
      <ButtonPressAnimation onPress={handleOnPress} scaleTo={0.8} overflowMargin={30} testID="account-icon">
        {accountInfo?.accountImage ? (
          <ImageAvatar
            backgroundColor={isDarkMode ? HOMEPAGE_BACKGROUND_COLOR_DARK : HOMEPAGE_BACKGROUND_COLOR_LIGHT}
            image={accountInfo.accountImage}
            size="signing"
          />
        ) : (
          <ContactAvatar color={accountInfo.accountColor} size="signing" value={accountInfo.accountSymbol} />
        )}
      </ButtonPressAnimation>
    </Bleed>
  );
});
