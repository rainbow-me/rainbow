import React, { useMemo, useCallback, useState, PropsWithChildren } from 'react';
import { OnPressMenuItemEventObject } from 'react-native-ios-context-menu';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, Inline, Stack, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { Centered } from '@/components/layout';
import { IS_ANDROID } from '@/env';
import { ContextMenu } from '@/components/context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { gasUtils } from '@/utils';
import styled from '@/styled-thing';
import Animated, { runOnUI, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { GasFeeLegacyParamsBySpeed, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';
import { ETH_COLOR, ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '../constants';
import { useSwapContext } from '../providers/swap-provider';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';

const { CUSTOM, GAS_ICONS, GAS_EMOJIS, getGasLabel, gasSpeedLabels } = gasUtils;

export const GasButton = ({ isReviewing = false }: { isReviewing?: boolean }) => {
  const { SwapNavigation, SwapGas } = useSwapContext();
  const { isDarkMode } = useColorMode();

  const gasSpeedLabel = useDerivedValue(() => {
    return gasSpeedLabels[SwapGas.selectedGasSpeed.value || GasSpeed.NORMAL];
  });

  const selectedGasSpeedNativeValue = useDerivedValue(() => {
    if (!SwapGas.gasFeeParamsBySpeed.value) return 'Loading...';
    const option = SwapGas.selectedGasSpeed.value ?? GasSpeed.NORMAL;
    return SwapGas.gasFeeParamsBySpeed.value[option].gasFee.display;
  });

  const separatatorSecondary = useForegroundColor('separatorSecondary');

  const buttonWrapperStyles = useAnimatedStyle(() => {
    return {
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: isDarkMode ? ETH_COLOR_DARK : ETH_COLOR,
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 5,
      alignItems: 'center',
      justifyContent: 'center',
    };
  });

  console.log('re-rendering gas button');

  if (isReviewing) {
    return (
      <Inline alignVertical="center" wrap={false}>
        <GasContextMenu>
          <Box as={Animated.View} style={buttonWrapperStyles}>
            <Inline alignVertical="center" space="4px">
              <TextIcon color="red" height={10} size="icon 12px" textStyle={{ marginTop: -1.5 }} width={16} weight="bold">
                􀙭
              </TextIcon>
              <AnimatedText text={gasSpeedLabel} color="label" size="15pt" weight="heavy"></AnimatedText>
            </Inline>
            <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
              􀆏
            </TextIcon>
          </Box>
        </GasContextMenu>

        <ButtonPressAnimation onPress={() => runOnUI(SwapNavigation.handleShowGas)({ backToReview: true })}>
          <Box
            style={{
              paddingHorizontal: 7,
              paddingVertical: 6,
              gap: 10,
              borderRadius: 15,
              borderWidth: THICK_BORDER_WIDTH,
              borderColor: separatatorSecondary,
            }}
          >
            <Text weight="heavy" size="15pt" color="label">
              􀌆
            </Text>
          </Box>
        </ButtonPressAnimation>
      </Inline>
    );
  }

  return (
    <GasContextMenu>
      <Stack space="12px">
        <Inline alignVertical="center" space={{ custom: 5 }}>
          <Inline alignVertical="center" space="4px">
            <TextIcon color="red" height={10} size="icon 12px" textStyle={{ marginTop: -1.5 }} width={16} weight="bold">
              􀙭
            </TextIcon>
            <AnimatedText text={gasSpeedLabel} color="label" size="15pt" weight="heavy"></AnimatedText>
          </Inline>
          <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
            􀆏
          </TextIcon>
        </Inline>
        <Inline alignVertical="center" space="4px">
          <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
            􀵟
          </TextIcon>
          <AnimatedText text={selectedGasSpeedNativeValue} color="labelTertiary" size="15pt" weight="bold" />
        </Inline>
      </Stack>
    </GasContextMenu>
  );
};
const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginHorizontal: 8,
}))({});

const GasContextMenu = ({ children }: PropsWithChildren) => {
  const { SwapNavigation, SwapGas } = useSwapContext();

  const [gasFeeParamsBySpeed, setGasFeeParamsBySpeed] = useState<GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null>(
    SwapGas.gasFeeParamsBySpeed.value
  );

  useSyncSharedValue({
    sharedValue: SwapGas.gasFeeParamsBySpeed,
    state: gasFeeParamsBySpeed,
    setState: setGasFeeParamsBySpeed,
    syncDirection: 'sharedValueToState',
  });

  const handlePressSpeedOption = useCallback(
    (selectedGasSpeed: GasSpeed) => {
      SwapGas.setSelectedGasSpeed(selectedGasSpeed);

      if (selectedGasSpeed === CUSTOM) {
        runOnUI(SwapNavigation.handleShowGas)({});
      }
    },
    [SwapGas, SwapNavigation.handleShowGas]
  );
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: OnPressMenuItemEventObject) => {
      handlePressSpeedOption(actionKey as GasSpeed);
    },
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          handlePressSpeedOption(GasSpeed.NORMAL);
          break;
        case 1:
          handlePressSpeedOption(GasSpeed.FAST);
          break;
        case 2:
          handlePressSpeedOption(GasSpeed.URGENT);
          break;
        case 3:
          handlePressSpeedOption(GasSpeed.CUSTOM);
      }
    },
    [handlePressSpeedOption]
  );

  const menuConfig = useMemo(() => {
    const menuOptions = Object.keys(gasFeeParamsBySpeed || {})
      .reverse()
      .map(gasOption => {
        if (IS_ANDROID) return gasOption as GasSpeed;
        const { display } = (gasFeeParamsBySpeed || {})[gasOption as GasSpeed] ?? {};
        return {
          actionKey: gasOption,
          actionTitle: android ? `${GAS_EMOJIS[gasOption as GasSpeed]}  ` : getGasLabel(gasOption || ''),
          discoverabilityTitle: display,
          icon: {
            iconType: 'ASSET',
            iconValue: GAS_ICONS[gasOption as GasSpeed],
          },
        };
      });
    return {
      menuItems: menuOptions,
      menuTitle: '',
    };
  }, [gasFeeParamsBySpeed]);
  const renderGasSpeedPager = useMemo(() => {
    if (IS_ANDROID) {
      return (
        <ContextMenu
          activeOpacity={0}
          enableContextMenu
          isAnchoredToRight
          isMenuPrimaryAction
          onPressActionSheet={handlePressActionSheet}
          options={menuConfig.menuItems}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          <Centered>{children}</Centered>
        </ContextMenu>
      );
    }

    return (
      <ContextMenuButton
        activeOpacity={0}
        enableContextMenu
        isAnchoredToRight
        isMenuPrimaryAction
        menuConfig={menuConfig}
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
        wrapNativeComponent={false}
      >
        {children}
      </ContextMenuButton>
    );
  }, [children, handlePressActionSheet, handlePressMenuItem, menuConfig]);
  return <GasSpeedPagerCentered testID="gas-speed-pager">{renderGasSpeedPager}</GasSpeedPagerCentered>;
};
