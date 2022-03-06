import networkInfo from './networkInfo';
import store from '@rainbow-me/redux/store';
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return Object.values(networkInfo)
    .filter(
      ({ disabled, testnet }) => !disabled && (testnetsEnabled || !testnet)
    )
    .map(netInfo => netInfo.name);
};

const androidReverseNetworkWithName = name =>
  Object.values(networkInfo).find(netInfo => netInfo.name === name);

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = () => {
  const { testnetsEnabled } = store.getState().settings;
  return Object.values(networkInfo)
    .filter(
      ({ disabled, testnet }) => !disabled && (testnetsEnabled || !testnet)
    )
    .map(netInfo => ({
      actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${netInfo.value}`,
      actionTitle: netInfo.longName || netInfo.name,
      icon: {
        iconType: 'ASSET',
        iconValue: `${
          netInfo.layer2 ? `${netInfo.value}BadgeNoShadow` : 'ethereumBadge'
        }`,
      },
    }));
};

const networksAvailable = networksMenuItems();

export const changeConnectionMenuItems = () => {
  const baseOptions = [
    {
      actionKey: 'disconnect',
      actionTitle: 'Disconnect',
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'xmark.square',
      },
      menuAttributes: ['destructive'],
    },
    {
      actionKey: 'switch-account',
      actionTitle: 'Switch Wallet',
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'rectangle.stack.person.crop',
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
        menuTitle: 'Switch Network',
      },
    ];
  }
  return baseOptions;
};

export const androidShowNetworksActionSheet = callback => {
  showActionSheetWithOptions(
    {
      options: androidNetworkActions(),
      showSeparators: true,
      title: `Available Networks`,
    },
    idx => {
      if (idx !== undefined) {
        const networkActions = androidNetworkActions();
        const { value } = androidReverseNetworkWithName(networkActions[idx]);
        const chainId = ethereumUtils.getChainIdFromNetwork(value);
        callback({ chainId, network: value });
      }
    }
  );
};
