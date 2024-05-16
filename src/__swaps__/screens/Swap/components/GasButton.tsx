import React, { useMemo, useState, useCallback, useEffect, ReactNode } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, Inline, Stack, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { useGasStore } from '@/state/gas/gasStore';
import { Centered } from '@/components/layout';
import { IS_ANDROID } from '@/env';
import { getNetworkObj } from '@/networks';
import { useRoute } from '@react-navigation/native';
import { useAccountSettings } from '@/hooks';
import { ContextMenu } from '@/components/context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { ethereumUtils, gasUtils } from '@/utils';
import styled from '@/styled-thing';
import { useMeteorology } from '@/__swaps__/utils/meteorology';
import { parseGasFeeParamsBySpeed } from '@/__swaps__/utils/gasUtils';
import Animated, { runOnUI, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { ParsedAddressAsset } from '@/entities';
import { GasFeeLegacyParamsBySpeed, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { ETH_COLOR, ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '../constants';
import { useSwapContext } from '../providers/swap-provider';

const { CUSTOM, GAS_ICONS, GAS_EMOJIS, getGasLabel, getGasFallback } = gasUtils;
const mockedGasLimit = '21000';

export const GasButton = ({ accentColor, isReviewing = false }: { accentColor?: string; isReviewing?: boolean }) => {
  const { SwapNavigation } = useSwapContext();

  const { isDarkMode } = useColorMode();
  const { params } = useRoute();
  const { currentNetwork } = (params as any) || {};
  const chainId = getNetworkObj(currentNetwork).id;
  const { selectedGas } = useGasStore();
  const { data, isLoading } = useMeteorology({ chainId });
  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | undefined>();
  const { nativeCurrency } = useAccountSettings();

  const separatatorSecondary = useForegroundColor('separatorSecondary');

  useEffect(() => {
    const getNativeAsset = async () => {
      const theNativeAsset = await ethereumUtils.getNativeAssetForNetwork(currentNetwork);
      setNativeAsset(theNativeAsset);
    };
    getNativeAsset();
  }, [currentNetwork, setNativeAsset]);

  const gasFeeBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | any = useMemo(() => {
    if (!isLoading) {
      return parseGasFeeParamsBySpeed({
        chainId,
        data: data!,
        gasLimit: mockedGasLimit,
        nativeAsset: nativeAsset as unknown as ParsedAsset,
        currency: nativeCurrency,
      });
    }
    return {};
  }, [chainId, data, isLoading, nativeAsset, nativeCurrency]);
  const gasFallback = getGasFallback(nativeCurrency);

  const animatedGas = useDerivedValue(() => {
    return gasFeeBySpeed[selectedGas?.option]?.gasFee?.display ?? gasFallback;
  }, [gasFeeBySpeed, selectedGas]);

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

  if (isReviewing) {
    return (
      <Inline alignVertical="center" wrap={false}>
        <GasMenu gasFeeBySpeed={gasFeeBySpeed} flashbotTransaction={false}>
          <Box as={Animated.View} style={buttonWrapperStyles}>
            <Inline alignVertical="center" space="4px">
              <TextIcon
                color={accentColor ? { custom: accentColor } : 'red'}
                height={10}
                size="icon 12px"
                textStyle={{ marginTop: -1.5 }}
                width={16}
                weight="bold"
              >
                􀙭
              </TextIcon>
              <Text color="label" size="15pt" weight="heavy">
                {getGasLabel(selectedGas?.option || GasSpeed.FAST)}
              </Text>
            </Inline>
            <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
              􀆏
            </TextIcon>
          </Box>
        </GasMenu>

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
    <GasMenu gasFeeBySpeed={gasFeeBySpeed} flashbotTransaction={false}>
      <Stack space="12px">
        <Inline alignVertical="center" space={{ custom: 5 }}>
          <Inline alignVertical="center" space="4px">
            <TextIcon
              color={accentColor ? { custom: accentColor } : 'red'}
              height={10}
              size="icon 12px"
              textStyle={{ marginTop: -1.5 }}
              width={16}
              weight="bold"
            >
              􀙭
            </TextIcon>
            <Text color="label" size="15pt" weight="heavy">
              {getGasLabel(selectedGas?.option || GasSpeed.FAST)}
            </Text>
          </Inline>
          <TextIcon color="labelSecondary" height={10} size="icon 13px" weight="bold" width={12}>
            􀆏
          </TextIcon>
        </Inline>
        <Inline alignVertical="center" space="4px">
          <TextIcon color="labelQuaternary" height={10} size="icon 11px" weight="heavy" width={16}>
            􀵟
          </TextIcon>
          <AnimatedText color="labelTertiary" size="15pt" weight="bold" text={animatedGas} />
        </Inline>
      </Stack>
    </GasMenu>
  );
};
const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginHorizontal: 8,
}))({});

const GasMenu = ({
  children,
  gasFeeBySpeed,
}: {
  flashbotTransaction: boolean;
  children: ReactNode;
  gasFeeBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed;
}) => {
  const { SwapNavigation, SwapGas } = useSwapContext();
  const { gasFeeParamsBySpeed, setSelectedGas } = useGasStore();
  // this needs to be moved up or out shouldnt need asset just the color

  const handlePressSpeedOption = useCallback(
    (selectedGasSpeed: GasSpeed) => {
      // TODO: Handle updating SwapGas references
      // SwapGas.selectGasOption(selectedGasSpeed);
      if (selectedGasSpeed === CUSTOM) {
        runOnUI(SwapNavigation.handleShowGas)({});
        return;
      }
      setSelectedGas({ selectedGas: gasFeeBySpeed[selectedGasSpeed] });
    },
    [setSelectedGas, gasFeeBySpeed, SwapNavigation.handleShowGas]
  );
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => {
      handlePressSpeedOption(actionKey as GasSpeed);
    },
    [handlePressSpeedOption]
  );

  const handlePressActionSheet = useCallback(
    (buttonIndex: number) => {
      switch (buttonIndex) {
        case 0:
          setSelectedGas({ selectedGas: gasFeeParamsBySpeed[GasSpeed.NORMAL] });
          break;
        case 1:
          setSelectedGas({ selectedGas: gasFeeParamsBySpeed[GasSpeed.FAST] });
          break;
        case 2:
          setSelectedGas({ selectedGas: gasFeeParamsBySpeed[GasSpeed.URGENT] });
          break;
        case 3:
          setSelectedGas({ selectedGas: gasFeeParamsBySpeed[GasSpeed.CUSTOM] });
          runOnUI(SwapNavigation.handleShowGas)({});
      }
    },
    [SwapNavigation.handleShowGas, gasFeeParamsBySpeed, setSelectedGas]
  );

  const menuConfig = useMemo(() => {
    const menuOptions = Object.keys(gasFeeBySpeed)
      .reverse()
      .map(gasOption => {
        if (IS_ANDROID) return gasOption as GasSpeed;
        const { display } = gasFeeBySpeed[gasOption as GasSpeed] ?? {};

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
  }, [gasFeeBySpeed]);
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
