import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useCallback, useMemo } from 'react';
import { Keyboard } from 'react-native';
import { darkModeThemeColors } from '../../styles/colors';
import { HoldToAuthorizeButton } from '../buttons';
import { Box, Row, Rows } from '@/design-system';
import { ExchangeModalTypes } from '@/helpers';
import {
  useColorForAsset,
  useGas,
  useSwapCurrencies,
  useWallets,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import { ETH_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { lightModeThemeColors } from '@/styles';
import { useTheme } from '@/theme';
import handleSwapErrorCodes from '@/utils/exchangeErrorCodes';
import { getNetworkObj } from '@/networks';

const NOOP = () => null;

export default function ConfirmExchangeButton({
  currentNetwork,
  disabled,
  loading,
  isHighPriceImpact,
  quoteError,
  onPressViewDetails,
  onSubmit,
  testID,
  tradeDetails,
  type = ExchangeModalTypes.swap,
  isSufficientBalance,
  isBridgeSwap,
  ...props
}) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const asset = outputCurrency ?? inputCurrency;
  const { isSufficientGas, isValidGas, isGasReady } = useGas();
  const { name: routeName } = useRoute();
  const { navigate } = useNavigation();
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false);
  const { isHardwareWallet } = useWallets();

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

  const disabledButtonColor = isSwapDetailsRoute
    ? isDarkMode
      ? darkModeThemeColors.blueGreyDark04
      : lightModeThemeColors.blueGreyDark50
    : darkModeThemeColors.blueGreyDark04;

  const { buttonColor, shadowsForAsset } = useMemo(() => {
    const color = quoteError
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
    quoteError,
    isDarkMode,
    isSwapDetailsRoute,
  ]);

  let label = '';
  let explainerType = null;

  if (type === ExchangeModalTypes.swap) {
    label = `􀕹 ${lang.t('button.confirm_exchange.review')}`;
  }
  if (loading) {
    label = lang.t('button.confirm_exchange.fetching_quote');
  } else if (!isSufficientBalance) {
    label = lang.t('button.confirm_exchange.insufficient_funds');
  } else if (isSufficientGas != null && !isSufficientGas) {
    label = lang.t('button.confirm_exchange.insufficient_token', {
      tokenName: getNetworkObj(currentNetwork).nativeCurrency.symbol,
    });
  } else if (!isValidGas && isGasReady) {
    label = lang.t('button.confirm_exchange.invalid_fee');
  } else if (isSwapDetailsRoute) {
    if (isSwapSubmitting) {
      label = lang.t('button.confirm_exchange.submitting');
    } else if (isBridgeSwap) {
      label = `${lang.t('button.confirm_exchange.bridge')}`;
    } else {
      label = isHighPriceImpact
        ? lang.t('button.confirm_exchange.swap_anyway')
        : `${lang.t('button.confirm_exchange.swap')}`;
    }
  } else if (disabled) {
    label = lang.t('button.confirm_exchange.enter_amount');
  }

  if (quoteError) {
    const error = handleSwapErrorCodes(quoteError);
    label = error.buttonLabel;
    explainerType = error.explainerType;
  }

  const handleExplainer = useCallback(() => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      inputCurrency,
      outputCurrency,
      type: explainerType,
    });
  }, [explainerType, inputCurrency, navigate, outputCurrency]);

  const isDisabled =
    disabled ||
    !isSufficientBalance ||
    !isSufficientGas ||
    !isValidGas ||
    !isSufficientGas;

  const onSwap = useCallback(async () => {
    setIsSwapSubmitting(true);
    const submitted = await onSubmit(setIsSwapSubmitting);
    setIsSwapSubmitting(submitted);
  }, [onSubmit]);

  return (
    <Box>
      <Rows alignHorizontal="center" alignVertical="bottom" space="8px">
        <Row height="content">
          <HoldToAuthorizeButton
            backgroundColor={buttonColor}
            disableLongPress={
              (shouldOpenSwapDetails && !quoteError) ||
              loading ||
              isSwapSubmitting
            }
            disableShimmerAnimation={quoteError}
            disabled={isDisabled && !quoteError}
            disabledBackgroundColor={
              isSwapSubmitting ? buttonColor : disabledButtonColor
            }
            hideInnerBorder
            isAuthorizing={isSwapSubmitting}
            label={label}
            loading={loading || isSwapSubmitting}
            ignoreHardwareWallet={
              loading ||
              isSwapSubmitting ||
              shouldOpenSwapDetails ||
              !!explainerType
            }
            onLongPress={
              loading || isSwapSubmitting
                ? NOOP
                : explainerType
                ? handleExplainer
                : shouldOpenSwapDetails
                ? onPressViewDetails
                : onSwap
            }
            shadows={
              isSwapDetailsRoute
                ? isDisabled || quoteError
                  ? shadows.disabled
                  : shadowsForAsset
                : shadows.default
            }
            showBiometryIcon={isSwapDetailsRoute && !isSwapSubmitting}
            testID={testID}
            {...props}
            parentHorizontalPadding={19}
            isHardwareWallet={isHardwareWallet}
          />
        </Row>
      </Rows>
    </Box>
  );
}
