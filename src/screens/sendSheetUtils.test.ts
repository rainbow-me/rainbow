import { getSendSubmitButtonState, getSendSubmitEligibility } from './sendSheetUtils';

jest.mock('@/languages', () => ({
  l: {
    button: {
      confirm_exchange: {
        enter_amount: 'enter_amount',
        insufficient_funds: 'insufficient_funds',
        insufficient_token: 'insufficient_token',
        invalid_fee: 'invalid_fee',
        loading: 'loading',
        review: 'review',
      },
    },
  },
  t: (key: string, params?: { tokenName?: string }) => (params?.tokenName ? `${key}:${params.tokenName}` : key),
}));

jest.mock('@/resources/addys/interactions', () => ({
  interactionsCountQueryKey: jest.fn(),
}));

describe('getSendSubmitEligibility', () => {
  it('requires a gas estimate for normal sends', () => {
    expect(
      getSendSubmitEligibility({
        hasSelectedGasEstimate: false,
        isSponsoredSend: false,
        isSufficientBalance: true,
        isSufficientGas: true,
        isValidAddress: true,
        isValidGas: true,
      })
    ).toMatchObject({
      hasRequiredGasEstimate: false,
      validTransaction: true,
    });
  });

  it('allows sponsored sends to bypass gas sufficiency and gas estimate requirements', () => {
    expect(
      getSendSubmitEligibility({
        hasSelectedGasEstimate: false,
        isSponsoredSend: true,
        isSufficientBalance: true,
        isSufficientGas: false,
        isValidAddress: true,
        isValidGas: false,
      })
    ).toMatchObject({
      hasRequiredGasEstimate: true,
      validTransaction: true,
    });
  });
});

describe('getSendSubmitButtonState', () => {
  const defaultParams = {
    assetAmount: '1',
    canUseSponsoredSend: false,
    isENS: false,
    isENSProfileLoaded: true,
    isGasFeeReady: true,
    isPreparingSponsoredSend: false,
    isSponsoredSend: false,
    isSufficientBalance: true,
    isSufficientGas: true,
    isValidGas: true,
    nativeAssetSymbol: 'ETH',
  };

  it('waits for sponsored-send preparation before review', () => {
    expect(
      getSendSubmitButtonState({
        ...defaultParams,
        canUseSponsoredSend: true,
        isPreparingSponsoredSend: true,
      })
    ).toEqual({
      buttonDisabled: true,
      buttonLabel: 'loading',
    });
  });

  it('does not require gas readiness once the send is sponsored', () => {
    const buttonState = getSendSubmitButtonState({
      ...defaultParams,
      isGasFeeReady: false,
      isSponsoredSend: true,
    });

    expect(buttonState.buttonDisabled).toBe(false);
    expect(buttonState.buttonLabel).toContain('review');
  });
});
