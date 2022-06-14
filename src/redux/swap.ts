import { Quote } from '@rainbow-me/swaps';
import { AnyAction } from 'redux';
import { fetchAssetPrices } from './explorer';
import { SwappableAsset } from '@rainbow-me/entities';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppDispatch, AppGetState } from '@rainbow-me/redux/store';

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
  depositCurrency: SwappableAsset | null;
  inputCurrency: SwappableAsset | null;
  independentField: SwapModalField;
  independentValue: string | null;
  slippageInBips: number;
  source: Source;
  type: string;
  tradeDetails: Quote | null;
  typeSpecificParameters?: TypeSpecificParameters | null;
  outputCurrency: SwappableAsset | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_DEPOSIT_CURRENCY = 'swap/SWAP_UPDATE_DEPOSIT_CURRENCY';
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

export const updateSwapInputAmount = (value: string | null) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: { independentValue: value },
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

export const updateSwapDepositCurrency = (
  newDepositCurrency: SwappableAsset | null
) => (dispatch: AppDispatch) => {
  dispatch({ payload: newDepositCurrency, type: SWAP_UPDATE_DEPOSIT_CURRENCY });
};

export const updateSwapInputCurrency = (
  newInputCurrency: SwappableAsset | null,
  ignoreTypeCheck = false
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    depositCurrency,
    independentField,
    outputCurrency,
    type,
  } = getState().swap;
  if (
    type === ExchangeModalTypes.swap &&
    newInputCurrency?.address === outputCurrency?.address &&
    newInputCurrency
  ) {
    dispatch(flipSwapCurrencies());
  } else {
    dispatch({ payload: newInputCurrency, type: SWAP_UPDATE_INPUT_CURRENCY });
    if (
      type === ExchangeModalTypes.swap &&
      newInputCurrency?.type !== outputCurrency?.type &&
      newInputCurrency &&
      !ignoreTypeCheck
    ) {
      dispatch({ payload: null, type: SWAP_UPDATE_OUTPUT_CURRENCY });
    }

    if (newInputCurrency) {
      dispatch(fetchAssetPrices(newInputCurrency.address));
    }
    if (independentField === SwapModalField.input) {
      dispatch(updateSwapInputAmount(null));
    }
  }

  if (type === ExchangeModalTypes.deposit) {
    if (newInputCurrency?.address === depositCurrency?.address) {
      dispatch(updateSwapOutputCurrency(null));
    } else {
      dispatch(updateSwapOutputCurrency(depositCurrency));
    }
  }
};

export const updateSwapOutputCurrency = (
  newOutputCurrency: SwappableAsset | null,
  ignoreTypeCheck = false
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { independentField, inputCurrency, type } = getState().swap;
  if (
    newOutputCurrency?.address === inputCurrency?.address &&
    newOutputCurrency
  ) {
    dispatch(flipSwapCurrencies());
  } else {
    if (
      type === ExchangeModalTypes.swap &&
      newOutputCurrency?.type !== inputCurrency?.type &&
      newOutputCurrency &&
      !ignoreTypeCheck
    ) {
      dispatch({ payload: null, type: SWAP_UPDATE_INPUT_CURRENCY });
    }

    dispatch({ payload: newOutputCurrency, type: SWAP_UPDATE_OUTPUT_CURRENCY });
    if (newOutputCurrency) {
      dispatch(fetchAssetPrices(newOutputCurrency.address));
    }
    if (independentField === SwapModalField.output) {
      dispatch(updateSwapOutputAmount(null));
    }
  }
};

export const flipSwapCurrencies = () => (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  // const { genericAssets } = getState().data;
  const {
    // independentField,
    // independentValue,
    inputCurrency,
    outputCurrency,
    derivedValues,
  } = getState().swap;
  dispatch({
    payload: {
      newInputCurrency: outputCurrency,
      newOutputCurrency: inputCurrency,
    },
    type: SWAP_FLIP_CURRENCIES,
  });

  // This is not like uniswap anymore
  // we should always try to get a quote based on the input
  dispatch(updateSwapInputAmount(derivedValues?.outputAmount));
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
  depositCurrency: null,
  derivedValues: null,
  displayValues: null,
  independentField: SwapModalField.input,
  independentValue: null,
  inputCurrency: null,
  outputCurrency: null,
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
        independentField: SwapModalField.input,
        independentValue: action.payload.independentValue,
      };
    case SWAP_UPDATE_NATIVE_AMOUNT:
      return {
        ...state,
        independentField: SwapModalField.native,
        independentValue: action.payload,
      };
    case SWAP_UPDATE_OUTPUT_AMOUNT:
      return {
        ...state,
        independentField: SwapModalField.output,
        independentValue: action.payload,
      };
    case SWAP_UPDATE_DEPOSIT_CURRENCY:
      return {
        ...state,
        depositCurrency: action.payload,
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
        inputCurrency: action.payload.newInputCurrency,
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
