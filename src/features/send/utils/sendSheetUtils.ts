import { greaterThan } from '@/helpers/utilities';
import * as i18n from '@/languages';

type GetSendSubmitButtonStateParams = {
  assetAmount: string;
  canUseSponsoredSend: boolean;
  hasResolvedSponsoredSend: boolean;
  hasPaidSendGasEstimateFailed: boolean;
  isENSProfileLoaded: boolean;
  isENS: boolean;
  isGasFeeReady: boolean;
  isPreparingSponsoredSend: boolean;
  isSponsoredSend: boolean;
  isSufficientBalance: boolean;
  isSufficientGas: boolean;
  isValidGas: boolean;
  nativeAssetSymbol: string | undefined;
  sponsoredAmountIsStale: boolean;
};

export function getSendSubmitButtonState({
  assetAmount,
  canUseSponsoredSend,
  hasResolvedSponsoredSend,
  hasPaidSendGasEstimateFailed,
  isENS,
  isENSProfileLoaded,
  isGasFeeReady,
  isPreparingSponsoredSend,
  isSponsoredSend,
  isSufficientBalance,
  isSufficientGas,
  isValidGas,
  nativeAssetSymbol,
  sponsoredAmountIsStale,
}: GetSendSubmitButtonStateParams) {
  const isZeroAssetAmount = !greaterThan(assetAmount, 0);
  const hasSufficientGasForSend = isSponsoredSend || isSufficientGas;
  const hasValidGasForSend = isSponsoredSend || isValidGas;
  const isWaitingForGas = !isSponsoredSend && !isGasFeeReady;
  const isWaitingForSponsoredSend =
    canUseSponsoredSend && !isZeroAssetAmount && (isPreparingSponsoredSend || sponsoredAmountIsStale || !hasResolvedSponsoredSend);

  if (isZeroAssetAmount) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.enter_amount),
    };
  }

  if (isENS && !isENSProfileLoaded) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.loading),
    };
  }

  if (!isSufficientBalance) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_funds),
    };
  }

  if (isWaitingForSponsoredSend || (isWaitingForGas && !hasPaidSendGasEstimateFailed)) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.loading),
    };
  }

  if (!isSponsoredSend && hasPaidSendGasEstimateFailed) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.unable_to_send),
    };
  }

  if (!hasSufficientGasForSend) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_token, {
        tokenName: nativeAssetSymbol ?? '',
      }),
    };
  }

  if (!hasValidGasForSend) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.invalid_fee),
    };
  }

  return {
    buttonDisabled: false,
    buttonLabel: `􀕹 ${i18n.t(i18n.l.button.confirm_exchange.review)}`,
  };
}
