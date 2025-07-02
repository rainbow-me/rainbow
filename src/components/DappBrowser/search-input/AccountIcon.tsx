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
import { useBrowserContext } from '../BrowserContext';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, RAINBOW_HOME } from '../constants';
import { getAccountProfileInfo, getWalletForAddress, useAccountAddress } from '@/state/wallets/walletsStore';
import { ensureValidHex } from '@/handlers/web3';

export const AccountIcon = React.memo(function AccountIcon() {
  const accountAddress = useAccountAddress();
  const { isDarkMode } = useColorMode();
  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);
  const selectedWallet = getWalletForAddress(currentAddress);

  const accountInfo = useMemo(() => {
    const profileInfo = getAccountProfileInfo(ensureValidHex(currentAddress));
    return {
      ...profileInfo,
    };
  }, [currentAddress]);

  // fix bad state - if no wallet exists, we should revert to the default
  useEffect(() => {
    if (currentAddress && !selectedWallet) {
      setCurrentAddress(accountAddress);
    }
  }, [currentAddress, selectedWallet, accountAddress]);

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
