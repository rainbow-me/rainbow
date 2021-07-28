import networkInfo from './networkInfo';
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const androidNetworkActions = Object.values(networkInfo)
  .filter(({ disabled }) => !disabled)
  .map(netInfo => netInfo.name);

const androidReverseNetworkWithName = name =>
  Object.values(networkInfo).find(netInfo => netInfo.name === name);

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = () =>
  Object.values(networkInfo)
    .filter(({ disabled, testnet }) => !disabled && !testnet)
    .map(netInfo => ({
      actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${netInfo.value}`,
      actionTitle: netInfo.name,
      icon: {
        iconType: 'ASSET',
        iconValue: `${
          netInfo.layer2 ? `${netInfo.value}BadgeNoShadow` : 'ethereumBadge'
        }`,
      },
    }));

export const changeConnectionMenuItems = () => [
  {
    actionKey: 'disconnect',
    actionTitle: 'Disconnect',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'xmark.circle',
    },
  },
  {
    actionKey: 'switch-account',
    actionTitle: 'Switch Account',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'person.2',
    },
  },
  {
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'cloud',
    },
    menuItems: networksMenuItems(),
    menuTitle: 'Switch Network',
  },
];

export const androidShowNetworksActionSheet = callback => {
  showActionSheetWithOptions(
    {
      options: androidNetworkActions,
      showSeparators: true,
      title: `Available Networks`,
    },
    idx => {
      const { value } = androidReverseNetworkWithName(
        androidNetworkActions[idx]
      );
      const chainId = ethereumUtils.getChainIdFromNetwork(value);
      callback({ chainId, network: value });
    }
  );
};
