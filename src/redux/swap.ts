import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { AnyAction } from 'redux';
import { fetchAssetPrices } from './explorer';
import { SwappableAsset } from '@/entities';
import { ExchangeModalTypes } from '@/helpers';
import { AppDispatch, AppGetState } from '@/redux/store';

export interface SwapAmount {
  display: string | null;
  value: string | null;
}

export enum SwapModalField {
  input = 'inputAmount',
  native = 'nativeAmount',
  output = 'outputAmount',
}

export enum Source {
  AggregatorRainbow = 'rainbow',
  Aggregator0x = '0x',
  Aggregator1inch = '1inch',
}

export interface TypeSpecificParameters {
  cTokenBalance: string;
  supplyBalanceUnderlying: string;
}

interface SwapState {
  derivedValues: any;
  displayValues: any;
  quoteError: QuoteError | null;
  inputCurrency: SwappableAsset | null;
  independentField: SwapModalField;
  independentValue: string | null;
  maxInputUpdate: boolean;
  flipCurrenciesUpdate: boolean;
  slippageInBips: number;
  source: Source;
  type: string;
  tradeDetails: Quote | CrosschainQuote | null;
  typeSpecificParameters?: TypeSpecificParameters | null;
  outputCurrency: SwappableAsset | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_SLIPPAGE = 'swap/SWAP_UPDATE_SLIPPAGE';
const SWAP_UPDATE_SOURCE = 'swap/SWAP_UPDATE_SOURCE';
const SWAP_UPDATE_INPUT_AMOUNT = 'swap/SWAP_UPDATE_INPUT_AMOUNT';
const SWAP_UPDATE_NATIVE_AMOUNT = 'swap/SWAP_UPDATE_NATIVE_AMOUNT';
const SWAP_UPDATE_OUTPUT_AMOUNT = 'swap/SWAP_UPDATE_OUTPUT_AMOUNT';
const SWAP_UPDATE_INPUT_CURRENCY = 'swap/SWAP_UPDATE_INPUT_CURRENCY';
const SWAP_UPDATE_OUTPUT_CURRENCY = 'swap/SWAP_UPDATE_OUTPUT_CURRENCY';
const SWAP_FLIP_CURRENCIES = 'swap/SWAP_FLIP_CURRENCIES';
const SWAP_UPDATE_TYPE_DETAILS = 'swap/SWAP_UPDATE_TYPE_DETAILS';
const SWAP_UPDATE_QUOTE = 'swap/SWAP_UPDATE_QUOTE';
const SWAP_CLEAR_STATE = 'swap/SWAP_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const updateSwapTypeDetails = (
  type: string,
  typeSpecificParameters?: TypeSpecificParameters | null
) => (dispatch: AppDispatch) => {
  dispatch({
    payload: {
      type,
      typeSpecificParameters,
    },
    type: SWAP_UPDATE_TYPE_DETAILS,
  });
};

export const updateSwapSlippage = (slippage: number) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: slippage,
    type: SWAP_UPDATE_SLIPPAGE,
  });
};

export const updateSwapSource = (newSource: Source) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: newSource,
    type: SWAP_UPDATE_SOURCE,
  });
};

export const updateSwapInputAmount = (
  value: string | null,
  maxInputUpdate = false
) => (dispatch: AppDispatch) => {
  dispatch({
    payload: { independentValue: value, maxInputUpdate },
    type: SWAP_UPDATE_INPUT_AMOUNT,
  });
};

export const updateSwapNativeAmount = (value: string | null) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: value,
    type: SWAP_UPDATE_NATIVE_AMOUNT,
  });
};

export const updateSwapOutputAmount = (value: string | null) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: value,
    type: SWAP_UPDATE_OUTPUT_AMOUNT,
  });
};

export const updateSwapInputCurrency = (
  newInputCurrency: SwappableAsset | null,
  ignoreTypeCheck = false
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { independentField, outputCurrency, type } = getState().swap;
  if (
    type === ExchangeModalTypes.swap &&
    newInputCurrency?.uniqueId === outputCurrency?.uniqueId &&
    newInputCurrency
  ) {
    dispatch(flipSwapCurrencies(false));
  } else {
    dispatch({ payload: newInputCurrency, type: SWAP_UPDATE_INPUT_CURRENCY });
    if (
      type === ExchangeModalTypes.swap &&
      newInputCurrency?.type !== outputCurrency?.type &&
      newInputCurrency &&
      !ignoreTypeCheck
    ) {
      dispatch(updateSwapOutputCurrency(null, true));
    }

    if (newInputCurrency) {
      dispatch(fetchAssetPrices(newInputCurrency.address));
    }
    if (independentField === SwapModalField.input) {
      dispatch(updateSwapInputAmount(null));
    }
  }
};

export const updateSwapOutputCurrency = (
  newOutputCurrency: SwappableAsset | null,
  ignoreTypeCheck = false
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { independentField, inputCurrency, type } = getState().swap;
  if (
    newOutputCurrency?.uniqueId === inputCurrency?.uniqueId &&
    newOutputCurrency
  ) {
    dispatch(flipSwapCurrencies(true));
  } else {
    if (
      type === ExchangeModalTypes.swap &&
      newOutputCurrency?.type !== inputCurrency?.type &&
      newOutputCurrency &&
      !ignoreTypeCheck
    ) {
      dispatch(updateSwapInputCurrency(null, true));
    }

    dispatch({ payload: newOutputCurrency, type: SWAP_UPDATE_OUTPUT_CURRENCY });
    if (newOutputCurrency) {
      dispatch(fetchAssetPrices(newOutputCurrency.address));
    }
    if (
      independentField === SwapModalField.output ||
      newOutputCurrency === null
    ) {
      dispatch(updateSwapOutputAmount(null));
    }
  }
};

export const flipSwapCurrencies = (
  outputIndependentField: boolean,
  independentValue?: string | null
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { inputCurrency, outputCurrency } = getState().swap;
  dispatch({
    payload: {
      flipCurrenciesUpdate: true,
      independentField: outputIndependentField
        ? SwapModalField.output
        : SwapModalField.input,
      independentValue,
      newInputCurrency: outputCurrency,
      newOutputCurrency: inputCurrency,
    },
    type: SWAP_FLIP_CURRENCIES,
  });
};

export const updateSwapQuote = (value: any) => (dispatch: AppDispatch) => {
  dispatch({
    payload: value,
    type: SWAP_UPDATE_QUOTE,
  });
};

export const swapClearState = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: SwapState = {
  derivedValues: null,
  displayValues: null,
  flipCurrenciesUpdate: false,
  independentField: SwapModalField.input,
  independentValue: null,
  inputCurrency: null,
  maxInputUpdate: false,
  outputCurrency: null,
  quoteError: null,
  slippageInBips: 100,
  source: Source.AggregatorRainbow,
  tradeDetails: null,
  type: ExchangeModalTypes.swap,
  typeSpecificParameters: null,
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case SWAP_UPDATE_QUOTE:
      return {
        ...state,
        derivedValues: action.payload.derivedValues,
        displayValues: action.payload.displayValues,
        quoteError: action.payload.quoteError,
        tradeDetails: action.payload.tradeDetails,
      };
    case SWAP_UPDATE_TYPE_DETAILS:
      return {
        ...state,
        type: action.payload.type,
        typeSpecificParameters: action.payload.typeSpecificParameters,
      };
    case SWAP_UPDATE_SLIPPAGE:
      return {
        ...state,
        slippageInBips: action.payload,
      };
    case SWAP_UPDATE_SOURCE:
      return {
        ...state,
        source: action.payload,
      };
    case SWAP_UPDATE_INPUT_AMOUNT:
      return {
        ...state,
        flipCurrenciesUpdate: false,
        independentField: SwapModalField.input,
        independentValue: action.payload.independentValue,
        maxInputUpdate: action.payload.maxInputUpdate,
      };
    case SWAP_UPDATE_NATIVE_AMOUNT:
      return {
        ...state,
        flipCurrenciesUpdate: false,
        independentField: SwapModalField.native,
        independentValue: action.payload,
        maxInputUpdate: false,
      };
    case SWAP_UPDATE_OUTPUT_AMOUNT:
      return {
        ...state,
        flipCurrenciesUpdate: false,
        independentField: SwapModalField.output,
        independentValue: action.payload,
        maxInputUpdate: false,
      };
    case SWAP_UPDATE_OUTPUT_CURRENCY:
      return {
        ...state,
        outputCurrency: action.payload,
      };
    case SWAP_UPDATE_INPUT_CURRENCY:
      return {
        ...state,
        inputCurrency: action.payload,
      };
    case SWAP_FLIP_CURRENCIES:
      return {
        ...state,
        flipCurrenciesUpdate: action.payload.flipCurrenciesUpdate,
        independentField: action.payload.independentField,
        independentValue:
          action.payload.independentValue ?? state.independentValue,
        inputCurrency: action.payload.newInputCurrency,
        maxInputUpdate: false,
        outputCurrency: action.payload.newOutputCurrency,
      };
    case SWAP_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
