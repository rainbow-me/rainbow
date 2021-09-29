import networkInfo from './networkInfo';
import networkTypes from './networkTypes';
import { ethereumUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

export const walletConnectSupportedChainIds = [
  networkTypes.mainnet,
  networkTypes.ropsten,
  networkTypes.kovan,
  networkTypes.goerli,
  networkTypes.polygon,
  networkTypes.optimism,
  networkTypes.arbitrum,
].map(network => ethereumUtils.getChainIdFromNetwork(network).toString());

const androidNetworkActions = Object.values(networkInfo)
  .filter(({ disabled, testnet }) => !disabled && !testnet)
  .map(netInfo => netInfo.name);

const androidReverseNetworkWithName = name =>
  Object.values(networkInfo).find(netInfo => netInfo.name === name);

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = () =>
  Object.values(networkInfo)
    .filter(({ disabled, testnet }) => !disabled && !testnet)
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
        menuItems: networksAvailable,
        menuTitle: 'Switch Network',
      },
    ];
  }
  return baseOptions;
};

export const androidShowNetworksActionSheet = callback => {
  showActionSheetWithOptions(
    {
      options: androidNetworkActions,
      showSeparators: true,
      title: `Available Networks`,
    },
    idx => {
      if (idx !== undefined) {
        const { value } = androidReverseNetworkWithName(
          androidNetworkActions[idx]
        );
        const chainId = ethereumUtils.getChainIdFromNetwork(value);
        callback({ chainId, network: value });
      }
    }
  );
};
