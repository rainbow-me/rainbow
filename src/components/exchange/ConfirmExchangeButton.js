import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useMemo } from 'react';
import { darkModeThemeColors } from '../../styles/colors';
import { HoldToAuthorizeButton } from '../buttons';
import { Box, Row, Rows } from '@rainbow-me/design-system';
import { ExchangeModalTypes, NetworkTypes } from '@rainbow-me/helpers';
import {
  useColorForAsset,
  useGas,
  useSwapCurrencies,
  useSwapIsSufficientBalance,
} from '@rainbow-me/hooks';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { lightModeThemeColors } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

export default function ConfirmExchangeButton({
  currentNetwork,
  disabled,
  loading,
  inputAmount,
  isHighPriceImpact,
  insufficientLiquidity,
  onPressViewDetails,
  onSubmit,
  testID,
  tradeDetails,
  type = ExchangeModalTypes.swap,
  ...props
}) {
  const isSufficientBalance = useSwapIsSufficientBalance(inputAmount);
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const asset = outputCurrency ?? inputCurrency;
  const { isSufficientGas, isValidGas } = useGas();
  const { name: routeName } = useRoute();

  const isSwapDetailsRoute = routeName === Routes.SWAP_DETAILS_SHEET;
  const shouldOpenSwapDetails = tradeDetails && !isSwapDetailsRoute;

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

  const { buttonColor, shadowsForAsset } = useMemo(() => {
    const color =
      asset.address === ETH_ADDRESS
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
  }, [asset.address, colorForAsset, colors, isDarkMode, isSwapDetailsRoute]);

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
    let nativeToken = 'gas';
    switch (currentNetwork) {
      case NetworkTypes.arbitrum:
      case NetworkTypes.mainnet:
        nativeToken = 'ETH';
        break;
      case NetworkTypes.polygon:
        nativeToken = 'MATIC';
        break;
      case NetworkTypes.optimism:
        nativeToken = 'OP';
        break;
      default:
        break;
    }
    label = lang.t('button.confirm_exchange.insufficient_gas', { nativeToken });
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

  const isDisabled =
    disabled ||
    !isSufficientBalance ||
    insufficientLiquidity ||
    !isSufficientGas ||
    !isValidGas ||
    !isSufficientGas;

  return (
    <Box>
      <Rows alignHorizontal="center" alignVertical="bottom" space="8px">
        <Row height="content">
          <HoldToAuthorizeButton
            backgroundColor={buttonColor}
            disableLongPress={shouldOpenSwapDetails}
            disabled={isDisabled}
            disabledBackgroundColor={
              isSwapDetailsRoute
                ? isDarkMode
                  ? darkModeThemeColors.blueGreyDark04
                  : lightModeThemeColors.blueGreyDark50
                : darkModeThemeColors.blueGreyDark04
            }
            hideInnerBorder
            label={label}
            loading={loading}
            onLongPress={shouldOpenSwapDetails ? onPressViewDetails : onSubmit}
            shadows={
              isSwapDetailsRoute
                ? isDisabled
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
