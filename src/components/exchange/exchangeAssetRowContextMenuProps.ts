import lang from 'i18n-js';
import { startCase } from 'lodash';
import { NativeSyntheticEvent } from 'react-native';
import { setClipboard } from '../../hooks/useClipboard';
import { Network } from '@/helpers/networkTypes';
import {
  abbreviations,
  ethereumUtils,
  haptics,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const buildBlockExplorerAction = (type: Network) => {
  const blockExplorerText = lang.t('exchange.coin_row.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(type)),
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

export default function contextMenuProps(
  item: any,
  onCopySwapDetailsText: (address: string) => void
) {
  const handleCopyContractAddress = (address: string) => {
    haptics.selection();
    setClipboard(address);
    onCopySwapDetailsText(address);
  };

  const onPressAndroid = () => {
    const blockExplorerText = `View on ${startCase(
      ethereumUtils.getBlockExplorer(item?.type)
    )}`;
    const androidContractActions = [
      lang.t('wallet.action.copy_contract_address'),
      blockExplorerText,
      lang.t('button.cancel'),
    ];

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
          ethereumUtils.openTokenEtherscanURL(item?.address, item?.type);
        }
      }
    );
  };

  const blockExplorerAction = buildBlockExplorerAction(item?.type);
  const menuConfig = {
    menuItems: [
      blockExplorerAction,
      {
        ...CoinRowActions[CoinRowActionsEnum.copyAddress],
        discoverabilityTitle: abbreviations.formatAddressForDisplay(
          item?.address
        ),
      },
    ],
    menuTitle: `${item?.name} (${item?.symbol})`,
  };

  const handlePressMenuItem = ({
    nativeEvent: { actionKey },
  }: NativeSyntheticEvent<{ actionKey: string }>) => {
    if (actionKey === CoinRowActionsEnum.copyAddress) {
      handleCopyContractAddress(item?.address);
    } else if (actionKey === CoinRowActionsEnum.blockExplorer) {
      ethereumUtils.openTokenEtherscanURL(item?.address, item?.type);
    }
  };
  return {
    menuConfig,
    ...(android ? { isAnchoredToRight: true, onPress: onPressAndroid } : {}),
    onPressMenuItem: handlePressMenuItem,
  };
}
