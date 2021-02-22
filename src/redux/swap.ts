import { Trade } from '@uniswap/sdk';
import { AnyAction } from 'redux';
import { fetchAssetPrices } from './explorer';
import { UniswapCurrency } from '@rainbow-me/entities';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppDispatch, AppGetState } from '@rainbow-me/redux/store';

export interface SwapAmount {
  display: string | null;
  value: string | null;
}

interface ExtraTradeDetails {
  inputExecutionRate: string;
  inputNativePrice: string;
  inputPriceValue: string;
  outputExecutionRate: string;
  outputNativePrice: string;
  outputPriceValue: string;
}

interface TypeSpecificParameters {
  cTokenBalance?: string;
  supplyBalanceUnderlying?: string;
}

interface SwapState {
  extraTradeDetails: ExtraTradeDetails | {};
  inputCurrency: UniswapCurrency | null;
  inputAsExactAmount: boolean;
  inputAmount: SwapAmount | null;
  isMax: boolean;
  maximumAmountIn?: string;
  minimumAmountOut?: string;
  nativeAmount: string | null;
  tradeDetails: Trade | null;
  type: string;
  typeSpecificParameters: TypeSpecificParameters | null;
  outputAmount: SwapAmount | null;
  outputCurrency: UniswapCurrency | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_IS_MAX = 'swap/SWAP_UPDATE_IS_MAX';
const SWAP_UPDATE_EXTRA_TRADE_DETAILS = 'swap/SWAP_UPDATE_EXTRA_TRADE_DETAILS';
const SWAP_UPDATE_TRADE_DETAILS = 'swap/SWAP_UPDATE_TRADE_DETAILS';
const SWAP_UPDATE_NATIVE_AMOUNT = 'swap/SWAP_UPDATE_NATIVE_AMOUNT';
const SWAP_UPDATE_INPUT_AMOUNT = 'swap/SWAP_UPDATE_INPUT_AMOUNT';
const SWAP_UPDATE_OUTPUT_AMOUNT = 'swap/SWAP_UPDATE_OUTPUT_AMOUNT';
const SWAP_UPDATE_INPUT_CURRENCY = 'swap/SWAP_UPDATE_INPUT_CURRENCY';
const SWAP_UPDATE_OUTPUT_CURRENCY = 'swap/SWAP_UPDATE_OUTPUT_CURRENCY';
const SWAP_FLIP_CURRENCIES = 'swap/SWAP_FLIP_CURRENCIES';
const SWAP_UPDATE_TYPE_DETAILS = 'swap/SWAP_UPDATE_TYPE_DETAILS';
const SWAP_RESET_AMOUNTS = 'swap/SWAP_RESET_AMOUNTS';
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

export const updateSwapExtraDetails = (extraDetails: ExtraTradeDetails) => (
  dispatch: AppDispatch
) => {
  dispatch({ payload: extraDetails, type: SWAP_UPDATE_EXTRA_TRADE_DETAILS });
};

export const updateSwapTradeDetails = (tradeDetails: Trade) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: tradeDetails,
    type: SWAP_UPDATE_TRADE_DETAILS,
  });
};

export const updateIsMax = (isMax: boolean) => (dispatch: AppDispatch) => {
  dispatch({ payload: isMax, type: SWAP_UPDATE_IS_MAX });
};

export const updateSwapInputAmount = (
  value: string | null,
  display: string | null,
  inputAsExactAmount = true
) => (dispatch: AppDispatch) => {
  const inputAmount: SwapAmount = {
    display,
    value,
  };
  dispatch({
    payload: { inputAmount, inputAsExactAmount },
    type: SWAP_UPDATE_INPUT_AMOUNT,
  });
};

export const updateSwapNativeAmount = (value: string | null) => (
  dispatch: AppDispatch
) => {
  dispatch({ payload: value, type: SWAP_UPDATE_NATIVE_AMOUNT });
};

export const updateSwapOutputAmount = (
  value: string | null,
  display: string | null,
  inputAsExactAmount = false
) => (dispatch: AppDispatch) => {
  const outputAmount: SwapAmount = {
    display,
    value,
  };
  dispatch({
    payload: { inputAsExactAmount, outputAmount },
    type: SWAP_UPDATE_OUTPUT_AMOUNT,
  });
};

export const resetSwapAmounts = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_RESET_AMOUNTS });
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

export const flipSwapCurrencies = () => (
  dispatch: AppDispatch,
  getState: AppGetState
) => {
  const { inputCurrency, outputCurrency } = getState().swap;
  dispatch({
    payload: {
      newInputCurrency: outputCurrency,
      newOutputCurrency: inputCurrency,
    },
    type: SWAP_FLIP_CURRENCIES,
  });
};

export const swapClearState = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: SwapState = {
  extraTradeDetails: {},
  inputAmount: null,
  inputAsExactAmount: true,
  inputCurrency: null,
  isMax: false,
  nativeAmount: null,
  outputAmount: null,
  outputCurrency: null,
  tradeDetails: null,
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
    case SWAP_UPDATE_IS_MAX:
      return {
        ...state,
        isMax: action.payload,
      };
    case SWAP_UPDATE_EXTRA_TRADE_DETAILS:
      return {
        ...state,
        extraTradeDetails: action.payload,
      };
    case SWAP_UPDATE_TRADE_DETAILS:
      return {
        ...state,
        tradeDetails: action.payload,
      };
    case SWAP_UPDATE_NATIVE_AMOUNT:
      return {
        ...state,
        nativeAmount: action.payload,
      };
    case SWAP_UPDATE_INPUT_AMOUNT:
      return {
        ...state,
        inputAmount: action.payload.inputAmount,
        inputAsExactAmount: action.payload.inputAsExactAmount,
      };
    case SWAP_UPDATE_OUTPUT_AMOUNT:
      return {
        ...state,
        inputAsExactAmount: action.payload.inputAsExactAmount,
        outputAmount: action.payload.outputAmount,
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
    case SWAP_RESET_AMOUNTS:
      return {
        ...state,
        inputAmount: null,
        isMax: false,
        nativeAmount: null,
        outputAmount: null,
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
