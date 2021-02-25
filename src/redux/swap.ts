import { AnyAction } from 'redux';
import { fetchAssetPrices } from './explorer';
import { UniswapCurrency } from '@rainbow-me/entities';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppDispatch, AppGetState } from '@rainbow-me/redux/store';

export interface SwapAmount {
  display: string | null;
  value: string | null;
}

export enum SwapModalField {
  input = 'input',
  native = 'native',
  output = 'output',
}

interface TypeSpecificParameters {
  cTokenBalance?: string;
  supplyBalanceUnderlying?: string;
}

interface SwapState {
  inputCurrency: UniswapCurrency | null;
  independentField: SwapModalField;
  independentValue: string | null;
  isMax: boolean;
  type: string;
  typeSpecificParameters: TypeSpecificParameters | null;
  outputCurrency: UniswapCurrency | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_INPUT_AMOUNT = 'swap/SWAP_UPDATE_INPUT_AMOUNT';
const SWAP_UPDATE_NATIVE_AMOUNT = 'swap/SWAP_UPDATE_NATIVE_AMOUNT';
const SWAP_UPDATE_OUTPUT_AMOUNT = 'swap/SWAP_UPDATE_OUTPUT_AMOUNT';
const SWAP_UPDATE_INPUT_CURRENCY = 'swap/SWAP_UPDATE_INPUT_CURRENCY';
const SWAP_UPDATE_OUTPUT_CURRENCY = 'swap/SWAP_UPDATE_OUTPUT_CURRENCY';
const SWAP_FLIP_CURRENCIES = 'swap/SWAP_FLIP_CURRENCIES';
const SWAP_UPDATE_TYPE_DETAILS = 'swap/SWAP_UPDATE_TYPE_DETAILS';
const SWAP_CLEAR_STATE = 'swap/SWAP_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const updateSwapTypeDetails = (
  type: string,
  typeSpecificParameters: TypeSpecificParameters
) => (dispatch: AppDispatch) => {
  dispatch({
    payload: {
      type,
      typeSpecificParameters,
    },
    type: SWAP_UPDATE_TYPE_DETAILS,
  });
};

export const updateSwapInputAmount = (value: string | null, isMax = false) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: { independentValue: value, isMax },
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
  newInputCurrency: UniswapCurrency | null
) => (dispatch: AppDispatch) => {
  dispatch({ payload: newInputCurrency, type: SWAP_UPDATE_INPUT_CURRENCY });
  if (newInputCurrency) {
    dispatch(fetchAssetPrices(newInputCurrency.address));
  }
};

export const updateSwapOutputCurrency = (
  newOutputCurrency: UniswapCurrency | null
) => (dispatch: AppDispatch) => {
  dispatch({ payload: newOutputCurrency, type: SWAP_UPDATE_OUTPUT_CURRENCY });
  if (newOutputCurrency) {
    dispatch(fetchAssetPrices(newOutputCurrency.address));
  }
};

export const flipSwapCurrencies = (useOutputAmount: boolean) => (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { inputCurrency, outputCurrency, independentValue } = getState().swap;
  dispatch({
    payload: {
      newInputCurrency: outputCurrency,
      newOutputCurrency: inputCurrency,
    },
    type: SWAP_FLIP_CURRENCIES,
  });

  if (useOutputAmount) {
    dispatch(updateSwapInputAmount(independentValue));
  } else {
    dispatch(updateSwapOutputAmount(independentValue));
  }
};

export const swapClearState = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: SwapState = {
  independentField: SwapModalField.input,
  independentValue: null,
  inputCurrency: null,
  isMax: false,
  outputCurrency: null,
  type: ExchangeModalTypes.swap,
  typeSpecificParameters: null,
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case SWAP_UPDATE_TYPE_DETAILS:
      return {
        ...state,
        type: action.payload.type,
        typeSpecificParameters: action.payload.typeSpecificParameters,
      };
    case SWAP_UPDATE_INPUT_AMOUNT:
      return {
        ...state,
        independentField: SwapModalField.input,
        independentValue: action.payload.independentValue,
        isMax: action.payload.isMax,
      };
    case SWAP_UPDATE_NATIVE_AMOUNT:
      return {
        ...state,
        independentField: SwapModalField.native,
        independentValue: action.payload,
        isMax: false,
      };
    case SWAP_UPDATE_OUTPUT_AMOUNT:
      return {
        ...state,
        independentField: SwapModalField.output,
        independentValue: action.payload,
        isMax: false,
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
        isMax: false,
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
