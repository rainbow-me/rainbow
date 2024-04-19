import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountSettings, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import Routes from '@/navigation/routesNames';
import { ContactAvatar } from '@/components/contacts';
import { Bleed } from '@/design-system';
import { ContextMenuButton } from '../../context-menu';
import { Network } from '@/networks/types';

import { RainbowNetworks, getNetworkObj } from '@/networks';

import store from '@/redux/store';
import { showActionSheetWithOptions } from '@/utils';
import * as i18n from '@/languages';
import { useAppSessionsStore } from '@/state/appSessions';
import { useBrowserContext } from '../BrowserContext';
import { getDappHost } from '../handleProviderRequest';
import { Address, toHex } from 'viem';
import { handleDappBrowserConnectionPrompt } from '@/utils/requestNavigationHandlers';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { getDappMetadata } from '@/resources/metadata/dapp';
import { TabState } from '../types';

interface MenuItemIcon {
  iconType: 'ASSET' | 'SYSTEM';
  iconValue: string;
}

interface BaseMenuItem {
  actionKey?: string;
  actionTitle?: string;
  icon?: MenuItemIcon;
  menuAttributes?: string[];
  menuState?: 'on' | 'off';
}

interface MenuItemWithSubmenu extends BaseMenuItem {
  menuItems: MenuItem[];
  menuTitle: string;
}

type MenuItem = BaseMenuItem | MenuItemWithSubmenu;

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return RainbowNetworks.filter(
    ({ features, networkType }) => features.walletconnect && (testnetsEnabled || networkType !== 'testnet')
  ).map(network => network.name);
};

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = (currentNetwork?: Network): MenuItem[] => {
  const { testnetsEnabled } = store.getState().settings;
  return RainbowNetworks.filter(
    ({ features, networkType }) => features.walletconnect && (testnetsEnabled || networkType !== 'testnet')
  ).map(network => ({
    actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${network.value}`,
    actionTitle: network.name,
    icon: {
      iconType: 'ASSET',
      iconValue: `${network.networkType === 'layer2' ? `${network.value}BadgeNoShadow` : 'ethereumBadge'}`,
    },
    menuState: currentNetwork && currentNetwork === network.value ? 'on' : 'off',
  }));
};

export const changeConnectionMenuItems = ({
  isConnected,
  currentNetwork,
}: {
  isConnected: boolean;
  currentNetwork?: Network;
}): MenuItem[] => {
  let baseOptions: MenuItem[] = [
    {
      actionKey: 'connect',
      actionTitle: !isConnected ? i18n.t(i18n.l.walletconnect.menu_options.connect) : i18n.t(i18n.l.walletconnect.menu_options.disconnect),
      icon: {
        iconType: 'SYSTEM',
        iconValue: !isConnected ? 'bolt' : 'xmark.square',
      },
      ...(isConnected && { menuAttributes: ['destructive'] }),
    },
  ];
  if (isConnected) {
    baseOptions = [
      ...baseOptions,
      {
        actionKey: 'switch-account',
        actionTitle: i18n.t(i18n.l.walletconnect.menu_options.switch_wallet),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'rectangle.stack.person.crop',
        },
      },
    ];
    const networksAvailable = networksMenuItems(currentNetwork);
    if (networksAvailable.length > 1) {
      baseOptions.push({
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'network',
        },
        menuItems: networksAvailable,
        menuTitle: i18n.t(i18n.l.walletconnect.menu_options.switch_network),
      });
    }
  }

  return baseOptions;
};

export const androidShowNetworksActionSheet = (callback: (network: { chainId: number; network: string }) => void) => {
  showActionSheetWithOptions(
    {
      options: androidNetworkActions(),
      showSeparators: true,
      title: i18n.t(i18n.l.walletconnect.menu_options.available_networks),
    },
    (idx: any) => {
      if (idx !== undefined) {
        const networkActions = androidNetworkActions();
        const networkObj = RainbowNetworks.find(network => network.name === networkActions[idx]) || getNetworkObj(Network.mainnet);
        callback({ chainId: networkObj.id, network: networkObj.value });
      }
    }
  );
};

export const AccountIcon = ({
  activeTabIndex,
  getActiveTabState,
}: {
  activeTabIndex: number;
  getActiveTabState: () => TabState | undefined;
}) => {
  const { activeTabRef } = useBrowserContext();
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { wallets, walletNames } = useWallets();
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);
  const [currentNetwork, setCurrentNetwork] = useState<Network>();

  const appSessions = useAppSessionsStore();

  const currentSession = appSessions.getActiveSession({ host: getDappHost(getActiveTabState()?.url) });
  const activeTabHost = getDappHost(getActiveTabState()?.url);

  // listens to the current active tab and sets the account
  useEffect(() => {
    if (activeTabHost) {
      if (!currentSession) {
        setIsConnected(false);
        return;
      }

      if (currentSession?.address) {
        setCurrentAddress(currentSession?.address);
        setIsConnected(true);
      } else {
        setCurrentAddress(accountAddress);
      }

      if (currentSession?.network) {
        setCurrentNetwork(currentSession?.network);
      }
    }
  }, [accountAddress, activeTabHost, activeTabIndex, currentSession, getActiveTabState]);

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: currentAddress,
      watchOnly: true,
      onChangeWallet(address: string) {
        const activeTabHost = getDappHost(getActiveTabState()?.url);
        if (activeTabHost) {
          appSessions.updateActiveSession({ host: activeTabHost, address: address as `0x${string}` });
          setCurrentAddress(address);
          // need to emit these events to the dapp
          activeTabRef.current?.injectJavaScript(`window.ethereum.emit('accountsChanged', ['${address}']); true;`);
        }
      },
    });
  }, [activeTabRef, appSessions, currentAddress, getActiveTabState, navigate]);

  // TODO: use dapp specifc address
  const accountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets || {}, currentAddress);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, currentAddress);
    return {
      ...profileInfo,
    };
  }, [wallets, currentAddress, walletNames]);

  const menuItems = useMemo(() => {
    return changeConnectionMenuItems({ isConnected, currentNetwork });
  }, [currentNetwork, isConnected]);

  const handleOnPressMenuItem = useCallback(
    async ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: string } }) => {
      if (actionKey === 'connect') {
        if (!isConnected) {
          const url = getActiveTabState()?.url;

          const dappData = await getDappMetadata({ url: getDappHost(url) });

          // @ts-expect-error
          const name: string = dappData?.appName || activeTabRef.current.title || dappData?.appHost;

          const response = await handleDappBrowserConnectionPrompt({
            dappName: name || '',
            dappUrl: url || '',
            imageUrl: dappData?.appLogo,
          });
          if (!(response instanceof Error)) {
            appSessions.addSession({
              host: getDappHost(url) || '',
              // @ts-ignore
              address: response.address,
              // @ts-ignore
              network: getNetworkFromChainId(response.chainId),
              // @ts-ignore
              url: url || '',
            });

            setIsConnected(true);

            activeTabRef.current?.injectJavaScript(
              `window.ethereum.emit('accountsChanged', ['${currentAddress}']); window.ethereum.emit('connect', { address: '${currentAddress}', chainId: '${toHex(response.chainId)}' }); true;`
            );
          } else {
            console.log('error: !!!!!!!!! ', response);
          }
        } else {
          const activeTabHost = getDappHost(getActiveTabState()?.url);
          if (activeTabHost) {
            appSessions.removeSession({ host: activeTabHost, address: currentAddress as Address });
            setIsConnected(false);
            activeTabRef.current?.injectJavaScript(
              `window.ethereum.emit('accountsChanged', []); window.ethereum.emit('disconnect', []); true;`
            );
          }
        }
      } else if (actionKey === 'switch-account') {
        handlePressChangeWallet();
      } else if (actionKey.indexOf(NETWORK_MENU_ACTION_KEY_FILTER) !== -1) {
        const networkValue = actionKey.replace(NETWORK_MENU_ACTION_KEY_FILTER, '');
        const network = networkValue as Network;
        const activeTabHost = getDappHost(getActiveTabState()?.url);
        if (activeTabHost) {
          appSessions.updateActiveSessionNetwork({ host: activeTabHost, network });
          const chainId = RainbowNetworks.find(({ value }) => value === network)?.id as number;
          activeTabRef.current?.injectJavaScript(`window.ethereum.emit('chainChanged', ${toHex(chainId)}); true;`);
        }
      }
    },
    [activeTabRef, appSessions, currentAddress, getActiveTabState, handlePressChangeWallet, isConnected]
  );

  return (
    <Bleed space="8px">
      {/* // eslint-disable-next-line @typescript-eslint/no-empty-function */}
      <ContextMenuButton menuItems={menuItems} menuTitle="" onPressAndroid={() => {}} testID={''} onPressMenuItem={handleOnPressMenuItem}>
        {accountInfo?.accountImage ? (
          <ImageAvatar image={accountInfo.accountImage} size="signing" />
        ) : (
          <ContactAvatar color={accountInfo.accountColor} size="signing" value={accountInfo.accountSymbol} />
        )}
      </ContextMenuButton>
    </Bleed>
  );
};
