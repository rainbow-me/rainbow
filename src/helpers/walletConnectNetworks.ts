import { type MenuItem } from '@/components/DropdownMenu';
import { type MenuActionConfig } from '@/components/native-context-menu/contextMenu';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { showActionSheetWithOptions } from '@/framework/ui/utils/actionsheet';
import * as i18n from '@/languages';
import store from '@/redux/store';

const androidNetworkActions = () => {
  const { testnetsEnabled } = store.getState().settings;
  return Object.values(useBackendNetworksStore.getState().getDefaultChains())
    .filter(chain => testnetsEnabled || !chain.testnet)
    .map(chain => `${chain.id}`);
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

/** Lists the actions available for a WalletConnect connection. */
export const changeConnectionMenuItems = (): MenuActionConfig[] => {
  return [
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
};

export const androidShowNetworksActionSheet = (callback: any) => {
  showActionSheetWithOptions(
    {
      options: androidNetworkActions(),
      title: i18n.t(i18n.l.walletconnect.menu_options.available_networks),
    },
    idx => {
      if (idx !== undefined) {
        const defaultChains = useBackendNetworksStore.getState().getDefaultChains();
        const networkActions = androidNetworkActions();
        const chainId = parseInt(networkActions[idx]);
        const chain = defaultChains[chainId] || defaultChains[ChainId.mainnet];
        callback({ chainId: chain.id });
      }
    }
  );
};
