import { type QueryClient } from '@tanstack/react-query';

import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { type ParsedAddressAsset } from '@/entities/tokens';
import { type NewTransaction } from '@/entities/transactions';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import * as i18n from '@/languages';
import { interactionsCountQueryKey } from '@/resources/addys/interactions';
import { type ChainId } from '@/state/backendNetworks/types';

type BuildBaseSendTransactionDetailsParams = {
  amount: string;
  asset: ParsedAddressAsset | UniqueAsset;
  chainId: ChainId;
  from: string;
  network: string;
  nonce: number;
  to: string;
};

type GetSendSubmitButtonStateParams = {
  assetAmount: string;
  canUseSponsoredSend: boolean;
  isENSProfileLoaded: boolean;
  isENS: boolean;
  isGasFeeReady: boolean;
  isPreparingSponsoredSend: boolean;
  isSponsoredSend: boolean;
  isSufficientBalance: boolean;
  isSufficientGas: boolean;
  isValidGas: boolean;
  nativeAssetSymbol: string | undefined;
};

type GetSendSubmitEligibilityParams = {
  hasSelectedGasEstimate: boolean;
  isSponsoredSend: boolean;
  isSufficientBalance: boolean;
  isSufficientGas: boolean;
  isValidAddress: boolean;
  isValidGas: boolean;
};

type InvalidateSendInteractionsCountParams = {
  accountAddress: string | undefined;
  nativeCurrency: NativeCurrencyKey | undefined;
  queryClient: QueryClient;
  toAddress: string;
};

export function buildBaseSendTransactionDetails({
  amount,
  asset,
  chainId,
  from,
  network,
  nonce,
  to,
}: BuildBaseSendTransactionDetailsParams): Pick<NewTransaction, 'amount' | 'asset' | 'chainId' | 'from' | 'network' | 'nonce' | 'to'> {
  return {
    amount,
    asset: 'address' in asset ? asset : undefined,
    from,
    network,
    chainId,
    nonce,
    to,
  };
}

export function getSendSubmitEligibility({
  hasSelectedGasEstimate,
  isSponsoredSend,
  isSufficientBalance,
  isSufficientGas,
  isValidAddress,
  isValidGas,
}: GetSendSubmitEligibilityParams) {
  const hasSufficientGasForSend = isSponsoredSend || isSufficientGas;
  const hasValidGasForSend = isSponsoredSend || isValidGas;

  return {
    hasSufficientGasForSend,
    hasValidGasForSend,
    validTransaction: isValidAddress && isSufficientBalance && hasSufficientGasForSend && hasValidGasForSend,
    hasRequiredGasEstimate: isSponsoredSend || hasSelectedGasEstimate,
  };
}

export function getSendSubmitButtonState({
  assetAmount,
  canUseSponsoredSend,
  isENS,
  isENSProfileLoaded,
  isGasFeeReady,
  isPreparingSponsoredSend,
  isSponsoredSend,
  isSufficientBalance,
  isSufficientGas,
  isValidGas,
  nativeAssetSymbol,
}: GetSendSubmitButtonStateParams) {
  const isZeroAssetAmount = Number(assetAmount) <= 0;
  const hasSufficientGasForSend = isSponsoredSend || isSufficientGas;
  const hasValidGasForSend = isSponsoredSend || isValidGas;
  const isWaitingForGas = !isSponsoredSend && !isGasFeeReady;
  const isWaitingForSponsoredSend = canUseSponsoredSend && isPreparingSponsoredSend;

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

export function invalidateSendInteractionsCount({
  accountAddress,
  nativeCurrency,
  queryClient,
  toAddress,
}: InvalidateSendInteractionsCountParams) {
  if (!accountAddress || !toAddress || !nativeCurrency) return;

  queryClient.invalidateQueries(
    interactionsCountQueryKey({
      fromAddress: accountAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      currency: nativeCurrency,
    })
  );
}
