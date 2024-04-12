import React, { useMemo, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { InteractionManager } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Inline, Stack, Text, TextIcon } from '@/design-system';
import { useGasStore } from '@/state/gas/gasStore';
import { Centered } from '@/components/layout';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import { getNetworkObj } from '@/networks';
import { useRoute } from '@react-navigation/native';
import { useAccountSettings, useColorForAsset } from '@/hooks';
import { ContextMenu } from '@/components/context-menu';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { isEmpty } from 'lodash';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, gasUtils } from '@/utils';
import styled from '@/styled-thing';
import { useMeteorology } from '@/__swaps__/utils/meteorology';
import { parseGasFeeParamsBySpeed } from '@/__swaps__/utils/gasUtils';
import { useDerivedValue } from 'react-native-reanimated';
import { ParsedAddressAsset } from '@/entities';
import { GasFeeLegacyParamsBySpeed, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';
import { ParsedAsset } from '@/__swaps__/types/assets';
const { GasSpeedOrder, CUSTOM, GAS_ICONS, GAS_EMOJIS, getGasLabel, getGasFallback } = gasUtils;
const mockedGasLimit = '21000';

export const GasButton = ({ accentColor }: { accentColor?: string }) => {
  const { params } = useRoute();
  const { currentNetwork } = (params as any) || {};
  const chainId = getNetworkObj(currentNetwork).id;
  const { selectedGas, setSelectedGas } = useGasStore();
  const { data, isLoading, isFetched } = useMeteorology({ chainId });
  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | undefined>();
  const { nativeCurrency } = useAccountSettings();
  useEffect(() => {
    const getNativeAsset = async () => {
      const theNativeAsset = await ethereumUtils.getNativeAssetForNetwork(currentNetwork);
      setNativeAsset(theNativeAsset);
    };
    getNativeAsset();
  }, [currentNetwork, setNativeAsset]);

  let gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | any = useMemo(() => {
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
  }, [isLoading, nativeAsset]);
  const gasFallback = getGasFallback(nativeCurrency);
  const [showGasOptions, setShowGasOptions] = useState(false);
  const animatedGas = useDerivedValue(() => {
    return gasFeeParamsBySpeed[selectedGas?.option]?.gasFee?.display ?? gasFallback;
  }, [gasFeeParamsBySpeed, selectedGas]);

  return (
    <ButtonPressAnimation onPress={() => setShowGasOptions(!showGasOptions)}>
      <GasMenu gasFeeParamsBySpeed={gasFeeParamsBySpeed} flashbotTransaction={false}>
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
    </ButtonPressAnimation>
  );
};
const GasSpeedPagerCentered = styled(Centered).attrs(() => ({
  marginHorizontal: 8,
}))({});

const GasMenu = ({
  flashbotTransaction,
  children,
  gasFeeParamsBySpeed,
}: {
  flashbotTransaction: boolean;
  children: ReactNode;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed;
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const { navigate } = useNavigation();
  const { selectedGas, setGasFeeParamsBySpeed, setSelectedGas } = useGasStore();
  const { params } = useRoute();
  // this needs to be moved up or out shouldnt need asset just the color
  const { currentNetwork, asset, fallbackColor } = (params as any) || {};
  const speedOptions = useMemo(() => {
    return getNetworkObj(currentNetwork).gas.speeds as GasSpeed[];
  }, [currentNetwork]);
  const gasOptionsAvailable = useMemo(() => speedOptions.length > 1, [speedOptions.length]);
  const rawColorForAsset = useColorForAsset(asset || {}, fallbackColor, false, true);
  const [shouldOpenCustomGasSheet, setShouldOpenCustomGasSheet] = useState({
    focusTo: null,
    shouldOpen: false,
  });

  const gasIsNotReady: boolean = useMemo(
    () => isEmpty(gasFeeParamsBySpeed) || isEmpty(selectedGas?.gasFee),
    [gasFeeParamsBySpeed, selectedGas]
  );

  const openCustomOptionsRef = useRef<((focusTo: any) => void) | null>(null);

  const openCustomGasSheet = useCallback(() => {
    if (gasIsNotReady && !__DEV__) return;
    setSelectedGas({ selectedGas: gasFeeParamsBySpeed[GasSpeed.CUSTOM] });
    navigate(Routes.CUSTOM_GAS_SHEET, {
      asset,
      fallbackColor,
      flashbotTransaction,
      focusTo: shouldOpenCustomGasSheet.focusTo,
      openCustomOptions: (focusTo: any) => openCustomOptionsRef.current?.(focusTo),
      speeds: GasSpeedOrder,
      type: 'custom_gas',
    });
  }, [gasIsNotReady, navigate, asset, shouldOpenCustomGasSheet.focusTo, flashbotTransaction, fallbackColor]);

  const handlePressSpeedOption = useCallback(
    (selectedGasSpeed: GasSpeed) => {
      if (selectedGasSpeed === CUSTOM) {
        if (ios) {
          InteractionManager.runAfterInteractions(() => {
            setShouldOpenCustomGasSheet({
              focusTo: null,
              shouldOpen: true,
            });
            openCustomGasSheet();
          });
        } else {
          openCustomGasSheet();
          setTimeout(() => setGasFeeParamsBySpeed({ gasFeeParamsBySpeed }), 500);
          return;
        }
      }
      setSelectedGas({ selectedGas: gasFeeParamsBySpeed[selectedGasSpeed] });
    },
    [setSelectedGas, openCustomGasSheet]
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
      }
    },
    [setGasFeeParamsBySpeed]
  );

  const menuConfig = useMemo(() => {
    const menuOptions = speedOptions.map((gasOption: GasSpeed) => {
      if (IS_ANDROID) return gasOption;
      const { display } = gasFeeParamsBySpeed[gasOption] ?? {};

      return {
        actionKey: gasOption,
        actionTitle: android ? `${GAS_EMOJIS[gasOption]}  ` : getGasLabel(gasOption || ''),
        discoverabilityTitle: display,
        icon: {
          iconType: 'ASSET',
          iconValue: GAS_ICONS[gasOption],
        },
      };
    });
    return {
      menuItems: menuOptions,
      menuTitle: '',
    };
  }, [selectedGas]);
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
  }, [colors, currentNetwork, gasIsNotReady, gasOptionsAvailable, handlePressMenuItem, menuConfig, rawColorForAsset, theme]);
  return <GasSpeedPagerCentered testID="gas-speed-pager">{renderGasSpeedPager}</GasSpeedPagerCentered>;
};
