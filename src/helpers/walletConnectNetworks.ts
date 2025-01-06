import store from '@/redux/store';
import { showActionSheetWithOptions } from '@/utils';
import * as i18n from '@/languages';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { MenuItem } from '@/components/DropdownMenu';

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return Object.values(useBackendNetworksStore.getState().getDefaultChains())
    .filter(chain => testnetsEnabled || !chain.testnet)
    .map(chain => chain.id);
};

export const NETWORK_MENU_ACTION_KEY_FILTER = 'switch-to-network-';

export const networksMenuItems: () => MenuItem<string>[] = () => {
  const { testnetsEnabled } = store.getState().settings;

  return Object.values(useBackendNetworksStore.getState().getDefaultChains())
    .filter(chain => testnetsEnabled || !chain.testnet)
    .map(chain => ({
      actionKey: `${NETWORK_MENU_ACTION_KEY_FILTER}${chain.id}`,
      actionTitle: useBackendNetworksStore.getState().getChainsLabel()[chain.id],
      icon: {
        iconType: 'REMOTE',
        iconValue: {
          uri: useBackendNetworksStore.getState().getChainsBadge()[chain.id],
        },
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
    (idx: number) => {
      if (idx !== undefined) {
        const defaultChains = useBackendNetworksStore.getState().getDefaultChains();
        const networkActions = androidNetworkActions();
        const chain = defaultChains[networkActions[idx]] || defaultChains[ChainId.mainnet];
        callback({ chainId: chain.id });
      }
    }
  );
};
