import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { Bleed, useColorMode } from '@/design-system';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAppSessionsStore } from '@/state/appSessions';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useBrowserContext } from '../BrowserContext';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, RAINBOW_HOME } from '../constants';
import { getDappHost } from '../handleProviderRequest';

export const AccountIcon = React.memo(function AccountIcon() {
  const { isDarkMode } = useColorMode();
  const { activeTabRef } = useBrowserContext();

  const accountAddress = useAccountAddress();
  const activeTabHost = useBrowserStore(state => getDappHost(state.getActiveTabUrl())) || RAINBOW_HOME;
  const hostSessions = useAppSessionsStore(state => state.getActiveSession({ host: activeTabHost }));
  const currentSession = useMemo(
    () =>
      hostSessions && hostSessions.sessions?.[hostSessions.activeSessionAddress]
        ? {
            address: hostSessions.activeSessionAddress,
            chainId: hostSessions.sessions[hostSessions.activeSessionAddress],
          }
        : null,
    [hostSessions]
  );

  const currentAddress = useMemo(
    () => currentSession?.address || hostSessions?.activeSessionAddress || accountAddress,
    [currentSession?.address, hostSessions?.activeSessionAddress, accountAddress]
  );

  const accountInfo = useAccountProfileInfo(currentAddress);

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
