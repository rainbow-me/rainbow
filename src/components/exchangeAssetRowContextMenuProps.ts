import { Platform, type NativeSyntheticEvent } from 'react-native';

import { startCase } from 'lodash';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { showActionSheetWithOptions } from '@/framework/ui/utils/actionsheet';
import { setClipboard } from '@/hooks/useClipboard';
import * as i18n from '@/languages';
import abbreviations from '@/utils/abbreviations';
import ethereumUtils from '@/utils/ethereumUtils';

const buildBlockExplorerAction = (chainId: ChainId) => {
  const blockExplorerText = i18n.t(i18n.l.exchange.coin_row.view_on, {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer({ chainId })),
  });
  return {
    actionKey: CoinRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: Platform.OS === 'ios' ? 'link' : null,
    },
  };
};

const CoinRowActionsEnum = {
  blockExplorer: 'blockExplorer',
  copyAddress: 'copyAddress',
};

const CoinRowActions = {
  [CoinRowActionsEnum.copyAddress]: {
    actionKey: CoinRowActionsEnum.copyAddress,
    actionTitle: i18n.t(i18n.l.wallet.action.copy_contract_address),
    icon: {
      iconType: 'SYSTEM',
      iconValue: Platform.OS === 'ios' ? 'doc.on.doc' : null,
    },
  },
};

export default function contextMenuProps(item: any, onCopySwapDetailsText: (address: string) => void) {
  const handleCopyContractAddress = (address: string) => {
    triggerHaptics('selection');
    setClipboard(address);
    onCopySwapDetailsText(address);
  };

  const onPressAndroid = () => {
    const blockExplorerText = `View on ${startCase(ethereumUtils.getBlockExplorer({ chainId: useBackendNetworksStore.getState().getChainsIdByName()[item?.network] }))}`;
    const androidContractActions = [i18n.t(i18n.l.wallet.action.copy_contract_address), blockExplorerText, i18n.t(i18n.l.button.cancel)];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        title: `${item?.name} (${item?.symbol})`,
      },
      idx => {
        if (idx === 0) {
          handleCopyContractAddress(item?.address);
        }
        if (idx === 1) {
          ethereumUtils.openTokenEtherscanURL({
            address: item?.address,
            chainId: useBackendNetworksStore.getState().getChainsIdByName()[item?.network],
          });
        }
      }
    );
  };

  const blockExplorerAction = buildBlockExplorerAction(useBackendNetworksStore.getState().getChainsIdByName()[item?.network]);
  const menuConfig = {
    menuItems: [
      blockExplorerAction,
      {
        ...CoinRowActions[CoinRowActionsEnum.copyAddress],
        discoverabilityTitle: abbreviations.formatAddressForDisplay(item?.address),
      },
    ],
    menuTitle: `${item?.name} (${item?.symbol})`,
  };

  const handlePressMenuItem = ({ nativeEvent: { actionKey } }: NativeSyntheticEvent<{ actionKey: string }>) => {
    if (actionKey === CoinRowActionsEnum.copyAddress) {
      handleCopyContractAddress(item?.address);
    } else if (actionKey === CoinRowActionsEnum.blockExplorer) {
      ethereumUtils.openTokenEtherscanURL({
        address: item?.address,
        chainId: useBackendNetworksStore.getState().getChainsIdByName()[item?.network],
      });
    }
  };
  return {
    menuConfig,
    ...(Platform.OS === 'android' ? { isAnchoredToRight: true, onPress: onPressAndroid } : {}),
    onPressMenuItem: handlePressMenuItem,
  };
}
