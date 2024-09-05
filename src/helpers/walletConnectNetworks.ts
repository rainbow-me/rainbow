import store from '@/redux/store';
import { showActionSheetWithOptions } from '@/utils';
import * as i18n from '@/languages';
import { ChainId } from '@/chains/types';
import { chainsLabel, defaultChains, supportedWalletConnectChainIds } from '@/chains/chains';
import { isL2Chain } from '@/handlers/web3';

const walletConnectChains = supportedWalletConnectChainIds.map(chainId => defaultChains[chainId]);

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return walletConnectChains.filter(({ testnet }) => testnetsEnabled || !testnet).map(chain => chain.id);
};

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems = () => {
  const { testnetsEnabled } = store.getState().settings;
  return walletConnectChains
    .filter(({ testnet }) => testnetsEnabled || !testnet)
    .map(chain => ({
      actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${chain.id}`,
      actionTitle: chainsLabel[chain.id],
      icon: {
        iconType: 'ASSET',
        iconValue: `${isL2Chain({ chainId: chain.id }) ? `${chain.name}BadgeNoShadow` : 'ethereumBadge'}`,
      },
    }));
};

const networksAvailable = networksMenuItems();

export const changeConnectionMenuItems = ({ isWalletConnectV2 }: { isWalletConnectV2?: boolean } = {}) => {
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
        const chain = walletConnectChains.find(chain => chain.id === networkActions[idx]) || defaultChains[ChainId.mainnet];
        callback({ chainId: chain.id });
      }
    }
  );
};
