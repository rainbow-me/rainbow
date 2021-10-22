import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { ButtonPressAnimation } from '../../animations';
import { Text } from '../../text';
import { useAccountProfile } from '@rainbow-me/hooks';
import {
  buildRainbowUrl,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';
import logger from 'logger';

const AssetActionsEnum = {
  etherscan: 'etherscan',
  rainbowWeb: 'rainbowWeb',
};

const AssetActions = {
  [AssetActionsEnum.etherscan]: {
    actionKey: AssetActionsEnum.etherscan,
    actionTitle: 'View on Etherscan',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  },
  [AssetActionsEnum.rainbowWeb]: {
    actionKey: AssetActionsEnum.rainbowWeb,
    actionTitle: 'View on Web',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari.fill',
    },
  },
};

const MoreActionsButton = ({ asset, imageColor }) => {
  const { accountAddress, accountENS } = useAccountProfile();

  const assetMenuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          ...AssetActions[AssetActionsEnum.rainbowWeb],
          discoverabilityTitle: 'rainbow.me',
        },
        {
          ...AssetActions[AssetActionsEnum.etherscan],
        },
      ],
      menuTitle: '',
    };
  }, []);

  const handlePressAssetMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === AssetActionsEnum.etherscan) {
        Linking.openURL(
          'https://etherscan.io/token/' +
            asset.asset_contract.address +
            '?a=' +
            asset.id
        );
      } else if (actionKey === AssetActionsEnum.rainbowWeb) {
        Linking.openURL(buildRainbowUrl(asset, accountENS, accountAddress));
      }
    },
    [accountAddress, accountENS, asset]
  );

  const onPressAndroid = useCallback(() => {
    const blockExplorerText = 'View on Etherscan';
    const androidContractActions = [
      'Copy Contract Address',
      blockExplorerText,
      'Cancel',
    ];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      idx => {
        if (idx === 0) {
          logger.log('menu0');
        }
        if (idx === 1) {
          logger.log('menu1');
        }
      }
    );
  }, []);

  return (
    <ContextMenuButton
      activeOpacity={1}
      menuConfig={assetMenuConfig}
      {...(android ? { onPress: onPressAndroid } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressAssetMenuItem}
      useActionSheetFallback={false}
      wrapNativeComponent
    >
      <ButtonPressAnimation scaleTo={0.75}>
        <Text align="right" color={imageColor} size="big" weight="heavy">
          􀍡
        </Text>
      </ButtonPressAnimation>
    </ContextMenuButton>
  );
};

export default magicMemo(MoreActionsButton, 'asset');
