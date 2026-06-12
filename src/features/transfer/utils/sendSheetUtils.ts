import { greaterThan } from '@/helpers/utilities';
import * as i18n from '@/languages';

type GetSendSubmitButtonStateParams = {
  assetAmount: string;
  canUseSponsoredSend: boolean;
  hasResolvedSponsoredSend: boolean;
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

  if (isWaitingForGas || isWaitingForSponsoredSend) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.loading),
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

  if (!isSufficientBalance) {
    return {
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_funds),
    };
  }

  return {
    buttonDisabled: false,
    buttonLabel: `􀕹 ${i18n.t(i18n.l.button.confirm_exchange.review)}`,
  };
}
