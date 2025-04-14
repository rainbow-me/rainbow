import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Bleed, useColorMode } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useAppSessionsStore } from '@/state/appSessions';
import { useBrowserStore } from '@/state/browser/browserStore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAccountProfileInfo } from '@/state/wallets/wallets';
import { useBrowserContext } from '../BrowserContext';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, RAINBOW_HOME } from '../constants';
import { getDappHost } from '../handleProviderRequest';

export const AccountIcon = React.memo(function AccountIcon() {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { isDarkMode } = useColorMode();
  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);

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
    const profileInfo = getAccountProfileInfo({
      address: currentAddress,
    });
    return {
      ...profileInfo,
    };
  }, [currentAddress]);

  const handleOnPress = useCallback(() => {
    navigate(Routes.DAPP_BROWSER_CONTROL_PANEL, {
      activeTabRef,
    });
  }, [activeTabRef, navigate]);

  return (
    <Bleed space="8px">
      <ButtonPressAnimation onPress={handleOnPress} scaleTo={0.8} overflowMargin={30}>
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
