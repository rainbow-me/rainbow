import { RainbowNetworks, getNetworkObj } from '@/networks';
import { Network } from '@/networks/types';
import store from '@/redux/store';
import { showActionSheetWithOptions } from '@/utils';
import * as i18n from '@/languages';

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return RainbowNetworks.filter(
    ({ features, networkType }) =>
      features.walletconnect && (testnetsEnabled || networkType !== 'testnet')
  ).map(network => network.name);
};

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = () => {
  const { testnetsEnabled } = store.getState().settings;
  return RainbowNetworks.filter(
    ({ features, networkType }) =>
      features.walletconnect && (testnetsEnabled || networkType !== 'testnet')
  ).map(network => ({
    actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${network.value}`,
    actionTitle: network.name,
    icon: {
      iconType: 'ASSET',
      iconValue: `${
        network.networkType === 'layer2'
          ? `${network.value}BadgeNoShadow`
          : 'ethereumBadge'
      }`,
    },
  }));
};

const networksAvailable = networksMenuItems();

export const changeConnectionMenuItems = ({
  isWalletConnectV2,
}: { isWalletConnectV2?: boolean } = {}) => {
  const baseOptions = [
    {
      actionKey: 'disconnect',
      actionTitle: i18n.t(i18n.l.walletconnect.menu_options.disconnect),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'xmark.square',
      },
      menuAttributes: ['destructive'],
    },
    {
      actionKey: 'switch-account',
      actionTitle: i18n.t(i18n.l.walletconnect.menu_options.switch_wallet),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'rectangle.stack.person.crop',
      },
    },
  ];

  if (networksAvailable.length > 1 && !isWalletConnectV2) {
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
        const networkObj =
          RainbowNetworks.find(
            network => network.name === networkActions[idx]
          ) || getNetworkObj(Network.mainnet);
        callback({ chainId: networkObj.id, network: networkObj.value });
      }
    }
  );
};
