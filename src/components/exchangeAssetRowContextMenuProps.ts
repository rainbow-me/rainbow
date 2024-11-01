import lang from 'i18n-js';
import { startCase } from 'lodash';
import { NativeSyntheticEvent } from 'react-native';
import { setClipboard } from '@/hooks/useClipboard';
import { abbreviations, ethereumUtils, haptics, showActionSheetWithOptions } from '@/utils';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const buildBlockExplorerAction = (chainId: ChainId) => {
  const blockExplorerText = lang.t('exchange.coin_row.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer({ chainId })),
  });
  return {
    actionKey: CoinRowActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: ios ? 'link' : null,
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
    actionTitle: lang.t('wallet.action.copy_contract_address'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: ios ? 'doc.on.doc' : null,
    },
  },
};

export default function contextMenuProps(item: any, onCopySwapDetailsText: (address: string) => void) {
  const handleCopyContractAddress = (address: string) => {
    haptics.selection();
    setClipboard(address);
    onCopySwapDetailsText(address);
  };

  const onPressAndroid = () => {
    const blockExplorerText = `View on ${startCase(ethereumUtils.getBlockExplorer({ chainId: useBackendNetworksStore.getState().getChainsIdByName()[item?.network] }))}`;
    const androidContractActions = [lang.t('wallet.action.copy_contract_address'), blockExplorerText, lang.t('button.cancel')];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: `${item?.name} (${item?.symbol})`,
      },
      (idx: number) => {
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
    ...(android ? { isAnchoredToRight: true, onPress: onPressAndroid } : {}),
    onPressMenuItem: handlePressMenuItem,
  };
}
