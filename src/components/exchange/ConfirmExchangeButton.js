import { useRoute } from '@react-navigation/native';
import makeColorMoreChill from 'make-color-more-chill';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { HoldToAuthorizeButton } from '../buttons';
import { Centered } from '../layout';
import { useTheme } from '@rainbow-me/context';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  useColorForAsset,
  useGas,
  usePriceImpactDetails,
  useSwapInputOutputTokens,
  useSwapIsSufficientBalance,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';

const paddingHorizontal = 19;

const ConfirmButton = styled(HoldToAuthorizeButton).attrs({
  hideInnerBorder: true,
  parentHorizontalPadding: paddingHorizontal,
  theme: 'dark',
})`
  flex: 1;
`;

const Container = styled(Centered)`
  ${padding(5, paddingHorizontal, 0)};
  width: 100%;
`;

export default function ConfirmExchangeButton({
  disabled,
  isSufficientLiquidity,
  onPressViewDetails,
  onSubmit,
  type = ExchangeModalTypes.swap,
  ...props
}) {
  const isSufficientBalance = useSwapIsSufficientBalance();
  const { outputCurrency: asset } = useSwapInputOutputTokens();
  const { isSufficientGas } = useGas();
  const { name: routeName } = useRoute();
  const { isHighPriceImpact } = usePriceImpactDetails();

  const isSwapDetailsRoute = routeName === Routes.SWAP_DETAILS_SHEET;
  const shouldOpenSwapDetails = isHighPriceImpact && !isSwapDetailsRoute;

  const { colors, darkScheme } = useTheme();

  const shadows = useMemo(
    () => ({
      default: [[0, 10, 30, colors.black, 0.4]],
      disabled: [
        [0, 10, 30, colors.dark, 0.2],
        [0, 5, 15, colors.blueGreyDark50, 0.4],
      ],
    }),
    [colors]
  );

  const colorForAsset = useColorForAsset(asset);
  const { buttonColor, shadowsForAsset } = useMemo(() => {
    const color = isSwapDetailsRoute
      ? colorForAsset
      : makeColorMoreChill(colorForAsset, colors.dark);

    return {
      buttonColor: color,
      shadowsForAsset: [
        [0, 10, 30, colors.dark, 0.2],
        [0, 5, 15, color, 0.4],
      ],
    };
  }, [colors, colorForAsset, isSwapDetailsRoute]);

  let label = '';
  if (type === ExchangeModalTypes.deposit) {
    label = 'Hold to Deposit';
  } else if (type === ExchangeModalTypes.swap) {
    label = 'Hold to Swap';
  } else if (type === ExchangeModalTypes.withdrawal) {
    label = 'Hold to Withdraw';
  }

  if (!isSufficientBalance) {
    label = 'Insufficient Funds';
  } else if (!isSufficientLiquidity) {
    label = 'Insufficient Liquidity';
  } else if (!isSufficientGas) {
    label = 'Insufficient ETH';
  } else if (isHighPriceImpact) {
    label = isSwapDetailsRoute ? 'Swap Anyway' : '􀕹 View Details';
  } else if (disabled) {
    label = 'Enter an Amount';
  }

  const isDisabled =
    disabled ||
    !isSufficientBalance ||
    !isSufficientGas ||
    !isSufficientLiquidity;

  return (
    <Container>
      <ConfirmButton
        backgroundColor={buttonColor}
        disableLongPress={shouldOpenSwapDetails}
        disabled={isDisabled}
        disabledBackgroundColor={
          isSwapDetailsRoute
            ? colors.blueGreyDark50
            : colors.alpha(darkScheme.blueGreyDark, 0.04)
        }
        label={label}
        onLongPress={shouldOpenSwapDetails ? onPressViewDetails : onSubmit}
        shadows={
          isSwapDetailsRoute
            ? isDisabled
              ? shadows.disabled
              : shadowsForAsset
            : shadows.default
        }
        showBiometryIcon={!isDisabled && !isHighPriceImpact}
        {...props}
      />
    </Container>
  );
}
