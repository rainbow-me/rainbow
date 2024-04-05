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
import { appSessionsStore } from '@/state/appSessions';
import { useBrowserContext } from '../BrowserContext';
import { getDappHost } from '../handleProviderRequest';

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return RainbowNetworks.filter(
    ({ features, networkType }) => features.walletconnect && (testnetsEnabled || networkType !== 'testnet')
  ).map(network => network.name);
};

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = () => {
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
  }));
};

const networksAvailable = networksMenuItems();

export const changeConnectionMenuItems = ({ isConnected }: { isConnected: boolean }) => {
  const baseOptions = [
    {
      actionKey: 'connect',
      actionTitle: !isConnected ? 'Connect' : i18n.t(i18n.l.walletconnect.menu_options.disconnect),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'xmark.square',
      },
      ...(isConnected && { menuAttributes: ['destructive'] }),
    },
    {
      actionKey: 'switch-account',
      actionTitle: i18n.t(i18n.l.walletconnect.menu_options.switch_wallet),
      icon: {
        iconType: 'SYSTEM',
        iconValue: isConnected ? 'rectangle.stack.person.crop' : 'bolt',
      },
    },
  ];

  if (networksAvailable.length > 1) {
    return [
      ...baseOptions,
      {
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'network',
        },
        menuItems: networksMenuItems(),
        menuTitle: i18n.t(i18n.l.walletconnect.menu_options.switch_network),
      },
    ];
  }
  return baseOptions;
};

export const androidShowNetworksActionSheet = (callback: any) => {
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

export const AccountIcon = () => {
  const { navigate } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { wallets, walletNames } = useWallets();
  const [isConnected, setIsConnected] = useState(false);
  const { getActiveTabState, activeTabIndex } = useBrowserContext();
  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);

  // listens to the current active tab and sets the account
  useEffect(() => {
    const activeTabHost = getDappHost(getActiveTabState()?.url);
    if (activeTabHost) {
      const session = appSessionsStore.getState().getActiveSession({ host: activeTabHost });
      if (session?.address) {
        setCurrentAddress(session?.address);
      } else {
        setCurrentAddress(accountAddress);
      }
    }
  }, [accountAddress, activeTabIndex, getActiveTabState]);

  const handlePressChangeWallet = useCallback(() => {
    navigate(Routes.CHANGE_WALLET_SHEET, {
      currentAccountAddress: currentAddress,
      watchOnly: true,
      onChangeWallet(address: string) {
        const activeTabHost = getDappHost(getActiveTabState()?.url);
        if (activeTabHost) {
          appSessionsStore.getState().updateActiveSession({ host: activeTabHost, address: address as `0x${string}` });
          setCurrentAddress(address);
          // need to emit these events to the dapp
        }
      },
    });
  }, [currentAddress, getActiveTabState, navigate]);

  // TODO: use dapp specifc address
  const accountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets || {}, currentAddress);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, currentAddress);
    return {
      ...profileInfo,
    };
  }, [wallets, currentAddress, walletNames]);

  const menuItems = useMemo(() => {
    return changeConnectionMenuItems({ isConnected });
  }, [isConnected]);

  const handleOnPressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: { nativeEvent: { actionKey: string } }) => {
      if (actionKey === 'connect') {
        // not sure how to check this atm
        setIsConnected(!isConnected);
      } else if (actionKey === 'switch-account') {
        handlePressChangeWallet();
      } else if (actionKey.indexOf(NETWORK_MENU_ACTION_KEY_FILTER) !== -1) {
        const networkValue = actionKey.replace(NETWORK_MENU_ACTION_KEY_FILTER, '');
        const network = networkValue as Network;
        const activeTabHost = getDappHost(getActiveTabState()?.url);
        if (activeTabHost) appSessionsStore.getState().updateActiveSessionNetwork({ host: activeTabHost, network });
      }
    },
    [getActiveTabState, handlePressChangeWallet, isConnected]
  );

  // const onPressAndroid = useCallback(() => {
  //   const networkActions = androidNetworkMenuItems();
  //   showActionSheetWithOptions(
  //     {
  //       options: networkActions,
  //       showSeparators: true,
  //     },
  //     idx => {
  //       if (idx !== undefined) {
  //         setCurrentChainId(ethereumUtils.getChainIdFromNetwork(networkActions[idx]));
  //       }
  //     }
  //   );
  // }, [setCurrentChainId]);

  return (
    <Bleed space="8px">
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
