import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useMemo } from 'react';
import { darkModeThemeColors } from '../../styles/colors';
import { HoldToAuthorizeButton } from '../buttons';
import ImgixImage from '../images/ImgixImage';
import { Centered } from '../layout';
import {
  ColorModeProvider,
  Column,
  Columns,
  Text,
} from '@rainbow-me/design-system';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  useColorForAsset,
  useGas,
  useSwapCurrencies,
  useSwapIsSufficientBalance,
} from '@rainbow-me/hooks';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { lightModeThemeColors, padding } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

const paddingHorizontal = 19;

const ConfirmButton = styled(HoldToAuthorizeButton).attrs({
  hideInnerBorder: true,
  parentHorizontalPadding: paddingHorizontal,
  theme: 'dark',
})({
  flex: 1,
});

const Container = styled(Centered)({
  ...padding.object(5, paddingHorizontal, 0),
  width: '100%',
});

export default function ConfirmExchangeButton({
  disabled,
  loading,
  inputAmount,
  isHighPriceImpact,
  insufficientLiquidity,
  onPressViewDetails,
  onSubmit,
  testID,
  tradeDetails,
  flashbots,
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
    label = lang.t('button.confirm_exchange.insufficient_eth');
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
    <Container>
      {flashbots && (
        <ColorModeProvider value="dark">
          <Columns alignHorizontal="center" height="content">
            <Column height="content" width="content">
              <ImgixImage
                source={{
                  uri: 'https://docs.flashbots.net/img/logo.png',
                }}
                style={{ height: 24, marginTop: -7, width: 24 }}
              />
            </Column>
            <Column height="content" width="content">
              <Text color="primary" weight="semibold">
                {` ${lang.t('exchange.flashbots_protected')} 􀅵`}
              </Text>
            </Column>
          </Columns>
        </ColorModeProvider>
      )}
      <ConfirmButton
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
        label={label}
        loading={loading}
        marginTop={ios ? 15 : 0}
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
      />
    </Container>
  );
}
