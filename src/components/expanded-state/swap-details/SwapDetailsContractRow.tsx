import React, { useCallback, useMemo } from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import Animated from 'react-native-reanimated';
import { mixColor, useTimingTransition } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import { ButtonPressAnimation, interpolate } from '../../animations';
import { TruncatedAddress } from '../../text';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { useClipboard, useColorForAsset } from '@rainbow-me/hooks';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const AnimatedTruncatedAddress = Animated.createAnimatedComponent(
  TruncatedAddress
);

const ContractActionsEnum = {
  copyAddress: 'copyAddress',
  etherscan: 'etherscan',
};

const ContractActions = {
  [ContractActionsEnum.copyAddress]: {
    actionKey: ContractActionsEnum.copyAddress,
    actionTitle: 'Copy Contract Address',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'doc.on.doc',
    },
  },
  [ContractActionsEnum.etherscan]: {
    actionKey: ContractActionsEnum.etherscan,
    actionTitle: 'View on Etherscan',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari',
    },
  },
};

const androidContractActions = [
  'Copy Contract Address',
  'View on Etherscan',
  'Cancel',
];

function SwapDetailsContractRowContent({
  asset,
  menuVisible,
  scaleTo = 1.06,
  ...props
}) {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset(asset);
  const animation = useTimingTransition(menuVisible, { duration: 150 });
  const { addressColor, scale } = useMemoOne(
    () => ({
      addressColor: mixColor(
        animation,
        colors.alpha(colors.blueGreyDark, 0.8),
        colorForAsset
      ),
      scale: interpolate(animation, {
        inputRange: [0, 1],
        outputRange: [1, scaleTo],
      }),
    }),
    [animation, colorForAsset, scaleTo]
  );

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <ButtonPressAnimation scaleTo={scaleTo} {...props}>
        <SwapDetailsRow label={`${asset?.symbol} contract`}>
          <SwapDetailsValue
            address={asset?.address}
            as={AnimatedTruncatedAddress}
            color={addressColor}
            firstSectionLength={6}
          />
          <SwapDetailsValue color={colors.alpha(colors.blueGreyDark, 0.5)}>
            {` 􀁰`}
          </SwapDetailsValue>
        </SwapDetailsRow>
      </ButtonPressAnimation>
    </Animated.View>
  );
}

export default function SwapDetailsContractRow({
  asset,
  onCopySwapDetailsText,
  ...props
}) {
  const { setClipboard } = useClipboard();
  const handleCopyContractAddress = useCallback(
    address => {
      setClipboard(address);
      onCopySwapDetailsText(address);
    },
    [onCopySwapDetailsText, setClipboard]
  );

  const menuConfig = useMemo(
    () => ({
      menuItems: [
        ContractActions[ContractActionsEnum.etherscan],
        {
          ...ContractActions[ContractActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(
            asset?.address
          ),
        },
      ],
      menuTitle: `${asset?.name} (${asset?.symbol})`,
    }),
    [asset]
  );

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ContractActionsEnum.copyAddress) {
        handleCopyContractAddress(asset?.address);
      } else if (actionKey === ContractActionsEnum.etherscan) {
        ethereumUtils.openTokenEtherscanURL(asset?.address);
      }
    },
    [asset, handleCopyContractAddress]
  );

  const onPressAndroid = useCallback(() => {
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: `${asset?.name} (${asset?.symbol})`,
      },
      idx => {
        if (idx === 0) {
          handleCopyContractAddress(asset?.address);
        }
        if (idx === 1) {
          ethereumUtils.openTokenEtherscanURL(asset?.address);
        }
      }
    );
  }, [asset, handleCopyContractAddress]);

  return (
    <ContextMenuButton
      activeOpacity={1}
      isMenuPrimaryAction
      menuConfig={menuConfig}
      {...(android ? { onPress: onPressAndroid } : {})}
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
      {...props}
    >
      <SwapDetailsContractRowContent asset={asset} />
    </ContextMenuButton>
  );
}
