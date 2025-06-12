import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';
import { Bleed, useColorMode } from '@/design-system';
import { useAppSessionsStore } from '@/state/appSessions';
import { getDappHost } from '../handleProviderRequest';
import { ButtonPressAnimation } from '@/components/animations';
import { useBrowserStore } from '@/state/browser/browserStore';
import { getAccountProfileInfo, useAccountAddress } from '@/state/wallets/walletsStore';
import { useBrowserContext } from '../BrowserContext';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, RAINBOW_HOME } from '../constants';

export const AccountIcon = React.memo(function AccountIcon() {
  const accountAddress = useAccountAddress();
  const { isDarkMode } = useColorMode();

  const { activeTabRef } = useBrowserContext();
  const activeTabHost = useBrowserStore(state => getDappHost(state.getActiveTabUrl())) || RAINBOW_HOME;
  const isOnHomepage = useBrowserStore(state => (state.getActiveTabUrl() || RAINBOW_HOME) === RAINBOW_HOME);
  const hostSessions = useAppSessionsStore(state => state.getActiveSession({ host: activeTabHost }));
  const currentSession = useMemo(() => {
    if (!hostSessions) {
      return null;
    }
    return hostSessions.sessions?.[hostSessions.activeSessionAddress]
      ? {
          address: hostSessions.activeSessionAddress,
          network: hostSessions.sessions[hostSessions.activeSessionAddress],
        }
      : null;
  }, [hostSessions]);

  // listens to the current active tab and sets the account
  const currentAddress = (() => {
    if (activeTabHost || isOnHomepage) {
      if (currentSession?.address) {
        return currentSession?.address;
      } else if (hostSessions?.activeSessionAddress) {
        return hostSessions.activeSessionAddress;
      }
    }
    return accountAddress;
  })();

  const accountInfo = useMemo(() => {
    return getAccountProfileInfo({
      address: currentAddress,
    });
  }, [currentAddress]);

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
