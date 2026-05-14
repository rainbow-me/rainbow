import * as i18n from '@/languages';

type GetSendSubmitButtonStateParams = {
  assetAmount: string;
  isENSProfileLoaded: boolean;
  isENS: boolean;
  isGasFeeReady: boolean;
  isSufficientBalance: boolean;
  isSufficientGas: boolean;
  isValidGas: boolean;
  nativeAssetSymbol: string | undefined;
};

export function getSendSubmitButtonState({
  assetAmount,
  isENS,
  isENSProfileLoaded,
  isGasFeeReady,
  isSufficientBalance,
  isSufficientGas,
  isValidGas,
  nativeAssetSymbol,
}: GetSendSubmitButtonStateParams) {
  const isZeroAssetAmount = Number(assetAmount) <= 0;

  if (isENS && !isENSProfileLoaded) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.loading),
    };
  }

  if (!isGasFeeReady) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.loading),
    };
  }

  if (!isZeroAssetAmount && !isSufficientGas) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_token, {
        tokenName: nativeAssetSymbol ?? '',
      }),
    };
  }

  if (!isValidGas) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.invalid_fee),
    };
  }

  if (!isZeroAssetAmount && !isSufficientBalance) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_funds),
    };
  }

  if (!isZeroAssetAmount) {
    return {
      buttonDisabled: false,
      buttonLabel: `􀕹 ${i18n.t(i18n.l.button.confirm_exchange.review)}`,
    };
  }

  return {
    buttonDisabled: true,
    buttonLabel: i18n.t(i18n.l.button.confirm_exchange.enter_amount),
  };
}
