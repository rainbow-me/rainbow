import * as i18n from '@/languages';

import { getSendSubmitButtonState } from './sendSheetUtils';

const readySendState = {
  assetAmount: '1',
  canUseSponsoredSend: false,
  hasResolvedSponsoredSend: false,
  hasPaidSendGasEstimateFailed: false,
  isENS: false,
  isENSProfileLoaded: false,
  isGasFeeReady: true,
  isPreparingSponsoredSend: false,
  isSponsoredSend: false,
  isSufficientBalance: true,
  isSufficientGas: true,
  isValidGas: true,
  nativeAssetSymbol: 'ETH',
};

describe('getSendSubmitButtonState', () => {
  it('does not leave paid sends loading after gas-limit estimation fails', () => {
    expect(
      getSendSubmitButtonState({
        ...readySendState,
        hasPaidSendGasEstimateFailed: true,
        isGasFeeReady: false,
      })
    ).toEqual({
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.unable_to_send),
    });
  });

  it('keeps amount validation ahead of gas-limit estimation failure', () => {
    expect(
      getSendSubmitButtonState({
        ...readySendState,
        assetAmount: '0',
        hasPaidSendGasEstimateFailed: true,
      })
    ).toEqual({
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.enter_amount),
    });
  });

  it('keeps insufficient balance ahead of gas-limit estimation failure', () => {
    expect(
      getSendSubmitButtonState({
        ...readySendState,
        hasPaidSendGasEstimateFailed: true,
        isGasFeeReady: false,
        isSufficientBalance: false,
      })
    ).toEqual({
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_funds),
    });
  });

  it('keeps insufficient balance ahead of sponsored preparation', () => {
    expect(
      getSendSubmitButtonState({
        ...readySendState,
        canUseSponsoredSend: true,
        hasResolvedSponsoredSend: false,
        isPreparingSponsoredSend: true,
        isSufficientBalance: false,
      })
    ).toEqual({
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.insufficient_funds),
    });
  });

  it('keeps sponsored preparation ahead of paid gas-limit estimation failure', () => {
    expect(
      getSendSubmitButtonState({
        ...readySendState,
        canUseSponsoredSend: true,
        hasPaidSendGasEstimateFailed: true,
        hasResolvedSponsoredSend: false,
        isGasFeeReady: false,
        isPreparingSponsoredSend: true,
      })
    ).toEqual({
      buttonDisabled: true,
      buttonLabel: i18n.t(i18n.l.button.confirm_exchange.loading),
    });
  });

  it('does not apply paid gas-limit estimation failures to sponsored sends', () => {
    expect(
      getSendSubmitButtonState({
        ...readySendState,
        hasPaidSendGasEstimateFailed: true,
        isGasFeeReady: false,
        isSponsoredSend: true,
      })
    ).toEqual({
      buttonDisabled: false,
      buttonLabel: `􀕹 ${i18n.t(i18n.l.button.confirm_exchange.review)}`,
    });
  });
});
