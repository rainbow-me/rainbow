import lang from 'i18n-js';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '../../animations';
import { TruncatedAddress } from '../../text';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { toStartCaseStr } from '@rainbow-me/helpers/utilities';
import { useClipboard, useColorForAsset } from '@rainbow-me/hooks';
import { useTheme } from '@rainbow-me/theme';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
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
    actionTitle: lang.t('wallet.action.copy_contract_address'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'doc.on.doc',
    },
  },
};

const buildBlockExplorerAction = type => {
  const blockExplorerText = lang.t('expanded_state.swap.view_on', {
    blockExplorerName: toStartCaseStr(ethereumUtils.getBlockExplorer(type)),
  });
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
}) {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset(asset);
  const animation = useSharedValue(menuVisible ? 1 : 0);
  const startingColor = useMemo(() => colors.alpha(colors.blueGreyDark, 0.8), [
    colors,
  ]);

  useLayoutEffect(() => {
    animation.value = withTiming(menuVisible ? 1 : 0, { duration: 150 });
  }, [menuVisible, animation]);

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      animation.value,
      [0, 1],
      [startingColor, colorForAsset]
    );
    return {
      color,
    };
  }, [animation, colorForAsset]);

  const scaleStyle = useAnimatedStyle(() => {
    const scale = interpolate(animation.value, [0, 1], [1, scaleTo]);

    return {
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={scaleStyle}>
      <ButtonPressAnimation scaleTo={1} {...props}>
        <SwapDetailsRow label={`${asset?.symbol} contract`}>
          <SwapDetailsValue
            address={asset?.address}
            as={AnimatedTruncatedAddress}
            firstSectionLength={6}
            style={colorStyle}
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
  const [menuVisible, setMenuVisible] = useState(false);

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
    const blockExplorerText = lang.t('expanded_state.swap.view_on', {
      blockExplorerName: toStartCaseStr(
        ethereumUtils.getBlockExplorer(asset?.type)
      ),
    });
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
        title: `${asset?.name} (${asset?.symbol})`,
      },
      idx => {
        if (idx === 0) {
          handleCopyContractAddress(asset?.address);
        }
        if (idx === 1) {
          ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.type);
        }
      }
    );
  }, [asset, handleCopyContractAddress]);

  const onShowMenu = () => setMenuVisible(true);
  const onHideMenu = () => setMenuVisible(false);

  return (
    <ContextMenuButton
      activeOpacity={1}
      isMenuPrimaryAction
      menuConfig={menuConfig}
      onMenuWillHide={onHideMenu}
      onMenuWillShow={onShowMenu}
      {...(android ? { onPress: onPressAndroid } : {})}
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
      {...props}
    >
      <SwapDetailsContractRowContent asset={asset} menuVisible={menuVisible} />
    </ContextMenuButton>
  );
}
