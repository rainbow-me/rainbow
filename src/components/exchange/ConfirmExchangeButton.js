import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';
import { darkModeThemeColors } from '../../styles/colors';
import { HoldToAuthorizeButton } from '../buttons';
import { Box, Row, Rows } from '@rainbow-me/design-system';
import { ExchangeModalTypes, NetworkTypes } from '@rainbow-me/helpers';
import { useColorForAsset, useGas, useSwapCurrencies } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { lightModeThemeColors } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

export default function ConfirmExchangeButton({
  currentNetwork,
  disabled,
  loading,
  isHighPriceImpact,
  insufficientLiquidity,
  onPressViewDetails,
  onSubmit,
  testID,
  tradeDetails,
  type = ExchangeModalTypes.swap,
  isSufficientBalance,
  ...props
}) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const asset = outputCurrency ?? inputCurrency;
  const { isSufficientGas, isValidGas } = useGas();
  const { name: routeName } = useRoute();
  const { navigate } = useNavigation();

  const isSavings =
    type === ExchangeModalTypes.withdrawal ||
    type === ExchangeModalTypes.deposit;
  const isSwapDetailsRoute = routeName === Routes.SWAP_DETAILS_SHEET;
  const shouldOpenSwapDetails =
    tradeDetails && !isSwapDetailsRoute && !isSavings;

  const { colors, isDarkMode } = useTheme();

  const shadows = useMemo(
    () => ({
      default: [[0, 10, 30, darkModeThemeColors.shadow, 0.4]],
      disabled: [
        [0, 10, 30, colors.shadow, isDarkMode ? 0 : 0.2],
        [
          0,
          5,
          15,
          isDarkMode ? colors.shadow : lightModeThemeColors.blueGreyDark50,
          0.4,
        ],
      ],
    }),
    [colors, isDarkMode]
  );

  const colorForAsset = useColorForAsset(asset, undefined, true, true);

  const disabledButtonColor = isSwapDetailsRoute
    ? isDarkMode
      ? darkModeThemeColors.blueGreyDark04
      : lightModeThemeColors.blueGreyDark50
    : darkModeThemeColors.blueGreyDark04;

  const { buttonColor, shadowsForAsset } = useMemo(() => {
    const color = insufficientLiquidity
      ? disabledButtonColor
      : asset.address === ETH_ADDRESS
      ? colors.appleBlue
      : isSwapDetailsRoute
      ? colorForAsset
      : makeColorMoreChill(
          colorForAsset,
          (isSwapDetailsRoute ? colors : darkModeThemeColors).light
        );

    return {
      buttonColor: color,
      shadowsForAsset: [
        [0, 10, 30, colors.shadow, 0.2],
        [0, 5, 15, isDarkMode ? colors.trueBlack : color, 0.4],
      ],
    };
  }, [
    asset.address,
    colorForAsset,
    colors,
    disabledButtonColor,
    insufficientLiquidity,
    isDarkMode,
    isSwapDetailsRoute,
  ]);

  let label = '';
  if (type === ExchangeModalTypes.deposit) {
    label = lang.t('button.confirm_exchange.deposit');
  } else if (type === ExchangeModalTypes.swap) {
    label = `􀕹 ${lang.t('button.confirm_exchange.review')}`;
  } else if (type === ExchangeModalTypes.withdrawal) {
    label = lang.t('button.confirm_exchange.withdraw');
  }

  if (loading) {
    label = lang.t('button.confirm_exchange.fetching_quote');
  } else if (!isSufficientBalance) {
    label = lang.t('button.confirm_exchange.insufficient_funds');
  } else if (isSufficientGas != null && !isSufficientGas) {
    label =
      currentNetwork === NetworkTypes.polygon
        ? lang.t('button.confirm_exchange.insufficient_matic')
        : lang.t('button.confirm_exchange.insufficient_eth');
  } else if (!isValidGas) {
    label = lang.t('button.confirm_exchange.invalid_fee');
  } else if (isSwapDetailsRoute) {
    label = isHighPriceImpact
      ? lang.t('button.confirm_exchange.swap_anyway')
      : `${lang.t('button.confirm_exchange.swap')}`;
  } else if (disabled) {
    label = lang.t('button.confirm_exchange.enter_amount');
  }

  if (insufficientLiquidity) {
    label = lang.t('button.confirm_exchange.insufficient_liquidity');
  }

  const handleShowLiquidityExplainer = useCallback(() => {
    android && Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'insufficientLiquidity',
    });
  }, [navigate]);

  const isDisabled =
    disabled ||
    !isSufficientBalance ||
    !isSufficientGas ||
    !isValidGas ||
    !isSufficientGas;

  return (
    <Box>
      <Rows alignHorizontal="center" alignVertical="bottom" space="8px">
        <Row height="content">
          <HoldToAuthorizeButton
            backgroundColor={buttonColor}
            disableLongPress={shouldOpenSwapDetails && !insufficientLiquidity}
            disableShimmerAnimation={insufficientLiquidity}
            disabled={isDisabled && !insufficientLiquidity}
            disabledBackgroundColor={disabledButtonColor}
            hideInnerBorder
            label={label}
            loading={loading}
            onLongPress={
              loading
                ? () => null
                : insufficientLiquidity
                ? handleShowLiquidityExplainer
                : shouldOpenSwapDetails
                ? onPressViewDetails
                : onSubmit
            }
            shadows={
              isSwapDetailsRoute
                ? isDisabled || insufficientLiquidity
                  ? shadows.disabled
                  : shadowsForAsset
                : shadows.default
            }
            showBiometryIcon={isSwapDetailsRoute}
            testID={testID}
            {...props}
            parentHorizontalPadding={19}
          />
        </Row>
      </Rows>
    </Box>
  );
}
