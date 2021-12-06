import { startCase } from 'lodash';
import React, { useCallback, useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton } from 'react-native-ios-context-menu';
import Animated from 'react-native-reanimated';
import { mixColor, useTimingTransition } from 'react-native-redash/src/v1';
import { useMemoOne } from 'use-memo-one';
import { ButtonPressAnimation, interpolate } from '../../animations';
import { TruncatedAddress } from '../../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsRow' was resolved to '/Users/... Remove this comment to see the full error message
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useClipboard, useColorForAsset } from '@rainbow-me/hooks';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';

const AnimatedTruncatedAddress = Animated.createAnimatedComponent(
  TruncatedAddress
);

const ContractActionsEnum = {
  blockExplorer: 'blockExplorer',
  copyAddress: 'copyAddress',
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
};

const buildBlockExplorerAction = (type: any) => {
  const blockExplorerText =
    'View on ' + startCase(ethereumUtils.getBlockExplorer(type));
  return {
    actionKey: ContractActionsEnum.blockExplorer,
    actionTitle: blockExplorerText,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  };
};

function SwapDetailsContractRowContent({
  asset,
  menuVisible,
  scaleTo = 1.06,
  ...props
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View style={{ transform: [{ scale }] }}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation scaleTo={scaleTo} {...props}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsRow label={`${asset?.symbol} contract`}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SwapDetailsValue
            address={asset?.address}
            as={AnimatedTruncatedAddress}
            color={addressColor}
            firstSectionLength={6}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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
}: any) {
  const { setClipboard } = useClipboard();
  const handleCopyContractAddress = useCallback(
    address => {
      setClipboard(address);
      onCopySwapDetailsText(address);
    },
    [onCopySwapDetailsText, setClipboard]
  );

  const menuConfig = useMemo(() => {
    const blockExplorerAction = buildBlockExplorerAction(asset?.type);
    return {
      menuItems: [
        blockExplorerAction,
        {
          ...ContractActions[ContractActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(
            asset?.address
          ),
        },
      ],
      menuTitle: `${asset?.name} (${asset?.symbol})`,
    };
  }, [asset?.address, asset?.name, asset?.symbol, asset?.type]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ContractActionsEnum.copyAddress) {
        handleCopyContractAddress(asset?.address);
      } else if (actionKey === ContractActionsEnum.blockExplorer) {
        ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.type);
      }
    },
    [asset, handleCopyContractAddress]
  );

  const onPressAndroid = useCallback(() => {
    const blockExplorerText =
      'View on ' + startCase(ethereumUtils.getBlockExplorer(asset?.type));
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
        title: `${asset?.name} (${asset?.symbol})`,
      },
      (idx: any) => {
        if (idx === 0) {
          handleCopyContractAddress(asset?.address);
        }
        if (idx === 1) {
          ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.type);
        }
      }
    );
  }, [asset, handleCopyContractAddress]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ContextMenuButton
      activeOpacity={1}
      isMenuPrimaryAction
      menuConfig={menuConfig}
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {...(android ? { onPress: onPressAndroid } : {})}
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
      {...props}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsContractRowContent asset={asset} />
    </ContextMenuButton>
  );
}
