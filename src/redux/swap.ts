import { Trade } from '@uniswap/sdk';
import { AnyAction } from 'redux';
import { Numberish, UniswapCurrency } from '@rainbow-me/entities';
import { AppDispatch } from '@rainbow-me/redux/store';

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

interface SwapState {
  extraTradeDetails: ExtraTradeDetails | {};
  inputCurrency: UniswapCurrency | null;
  inputAsExactAmount: boolean;
  inputAmount: SwapAmount | null;
  isMax: boolean;
  isSufficientBalance: boolean;
  nativeAmount: string | null;
  slippage: Numberish | null;
  tradeDetails: Trade | null;
  outputAmount: SwapAmount | null;
  outputCurrency: UniswapCurrency | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_IS_MAX = 'swap/SWAP_UPDATE_IS_MAX';
const SWAP_UPDATE_IS_SUFFICIENT_BALANCE =
  'swap/SWAP_UPDATE_IS_SUFFICIENT_BALANCE';
const SWAP_UPDATE_EXTRA_TRADE_DETAILS = 'swap/SWAP_UPDATE_EXTRA_TRADE_DETAILS';
const SWAP_UPDATE_TRADE_DETAILS = 'swap/SWAP_UPDATE_TRADE_DETAILS';
const SWAP_UPDATE_NATIVE_AMOUNT = 'swap/SWAP_UPDATE_NATIVE_AMOUNT';
const SWAP_UPDATE_INPUT_AMOUNT = 'swap/SWAP_UPDATE_INPUT_AMOUNT';
const SWAP_UPDATE_OUTPUT_AMOUNT = 'swap/SWAP_UPDATE_OUTPUT_AMOUNT';
const SWAP_UPDATE_INPUT_CURRENCY = 'swap/SWAP_UPDATE_INPUT_CURRENCY';
const SWAP_UPDATE_OUTPUT_CURRENCY = 'swap/SWAP_UPDATE_OUTPUT_CURRENCY';
const SWAP_CLEAR_STATE = 'swap/SWAP_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const updateSwapExtraDetails = (extraDetails: ExtraTradeDetails) => (
  dispatch: AppDispatch
) => {
  dispatch({ payload: extraDetails, type: SWAP_UPDATE_EXTRA_TRADE_DETAILS });
};

export const updateSwapTradeDetails = (tradeDetails: Trade) => (
  dispatch: AppDispatch
) => {
  const slippage = Number(tradeDetails.priceImpact.toFixed(2).toString()) * 100;

  dispatch({
    payload: { slippage, tradeDetails },
    type: SWAP_UPDATE_TRADE_DETAILS,
  });
};

export const updateIsMax = (isMax: boolean) => (dispatch: AppDispatch) => {
  dispatch({ payload: isMax, type: SWAP_UPDATE_IS_MAX });
};

export const updateIsSufficientBalance = (isSufficientBalance: boolean) => (
  dispatch: AppDispatch
) => {
  dispatch({
    payload: isSufficientBalance,
    type: SWAP_UPDATE_IS_SUFFICIENT_BALANCE,
  });
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

export const updateSwapInputCurrency = (newInputCurrency: UniswapCurrency) => (
  dispatch: AppDispatch
) => {
  dispatch({ payload: newInputCurrency, type: SWAP_UPDATE_INPUT_CURRENCY });
};

export const updateSwapOutputCurrency = (
  newOutputCurrency: UniswapCurrency
) => (dispatch: AppDispatch) => {
  dispatch({ payload: newOutputCurrency, type: SWAP_UPDATE_OUTPUT_CURRENCY });
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
  isSufficientBalance: true,
  nativeAmount: null,
  outputAmount: null,
  outputCurrency: null,
  slippage: null,
  tradeDetails: null,
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
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
        slippage: action.payload.slippage,
        tradeDetails: action.payload.tradeDetails,
      };
    case SWAP_UPDATE_IS_SUFFICIENT_BALANCE:
      return {
        ...state,
        isSufficientBalance: action.payload,
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
    case SWAP_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
