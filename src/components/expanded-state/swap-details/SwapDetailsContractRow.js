import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../../animations';
import { Text, TruncatedAddress } from '../../text';
import SwapDetailsRow from './SwapDetailsRow';
import { useClipboard, useColorForAsset } from '@/hooks';
import styled from '@/styled-thing';
import { fonts, fontWithWidth } from '@/styles';
import { abbreviations, ethereumUtils, showActionSheetWithOptions } from '@/utils';

const SwapDetailsText = styled(Text).attrs({
  lineHeight: android ? 18 : 17,
})();

export const SwapDetailsValue = styled(SwapDetailsText).attrs(({ theme: { colors }, color = colors.alpha(colors.blueGreyDark, 0.8) }) => ({
  color,
}))(fontWithWidth(fonts.weight.bold));

const AnimatedTruncatedAddress = Animated.createAnimatedComponent(TruncatedAddress);
const AnimatedText = Animated.createAnimatedComponent(Text);

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
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(type)),
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

function SwapDetailsContractRowContent({ asset, menuVisible, scaleTo = 1.06, ...props }) {
  const { colors } = useTheme();
  const colorForAsset = useColorForAsset(asset);
  const animation = useSharedValue(menuVisible ? 1 : 0);
  const startingColor = useMemo(() => colors.alpha(colors.blueGreyDark, 0.8), [colors]);

  useLayoutEffect(() => {
    animation.value = withTiming(menuVisible ? 1 : 0, { duration: 150 });
  }, [menuVisible, animation]);

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(animation.value, [0, 1], [startingColor, colorForAsset]);
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
        <SwapDetailsRow
          label={lang.t('expanded_state.swap_details.token_contract', {
            token: asset?.symbol,
          })}
        >
          <SwapDetailsValue address={asset?.address} as={AnimatedTruncatedAddress} firstSectionLength={6} style={colorStyle} />
          <SwapDetailsValue as={AnimatedText} style={colorStyle}>{` 􀍡`}</SwapDetailsValue>
        </SwapDetailsRow>
      </ButtonPressAnimation>
    </Animated.View>
  );
}

export default function SwapDetailsContractRow({ asset, onCopySwapDetailsText, ...props }) {
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
    const blockExplorerAction = buildBlockExplorerAction(asset?.network);
    return {
      menuItems: [
        blockExplorerAction,
        {
          ...ContractActions[ContractActionsEnum.copyAddress],
          discoverabilityTitle: abbreviations.formatAddressForDisplay(asset?.address),
        },
      ],
      menuTitle: `${asset?.name} (${asset?.symbol})`,
    };
  }, [asset?.address, asset?.name, asset?.symbol, asset?.network]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ContractActionsEnum.copyAddress) {
        handleCopyContractAddress(asset?.address);
      } else if (actionKey === ContractActionsEnum.blockExplorer) {
        ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.network);
      }
    },
    [asset, handleCopyContractAddress]
  );

  const onPressAndroid = useCallback(() => {
    const blockExplorerText = lang.t('expanded_state.swap.view_on', {
      blockExplorerName: startCase(ethereumUtils.getBlockExplorer(asset?.network)),
    });
    const androidContractActions = [lang.t('wallet.action.copy_contract_address'), blockExplorerText, lang.t('button.cancel')];
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
          ethereumUtils.openTokenEtherscanURL(asset?.address, asset?.network);
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
      style={{
        // bigger tap area otherwise touch events can get ignored
        marginVertical: -12,
        paddingVertical: 12,
      }}
    >
      <SwapDetailsContractRowContent asset={asset} menuVisible={menuVisible} />
    </ContextMenuButton>
  );
}
