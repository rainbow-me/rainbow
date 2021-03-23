import { AnyAction } from 'redux';
import { fetchAssetPrices } from './explorer';
import { UniswapCurrency } from '@rainbow-me/entities';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { AppDispatch, AppGetState } from '@rainbow-me/redux/store';
import { convertAmountFromNativeValue } from '@rainbow-me/utilities';

export interface SwapAmount {
  display: string | null;
  value: string | null;
}

export enum SwapModalField {
  input = 'inputAmount',
  native = 'nativeAmount',
  output = 'outputAmount',
}

export interface TypeSpecificParameters {
  cTokenBalance: string;
  supplyBalanceUnderlying: string;
}

interface SwapState {
  depositCurrency: UniswapCurrency | null;
  inputCurrency: UniswapCurrency | null;
  independentField: SwapModalField;
  independentValue: string | null;
  slippageInBips: number;
  type: string;
  typeSpecificParameters?: TypeSpecificParameters | null;
  outputCurrency: UniswapCurrency | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_DEPOSIT_CURRENCY = 'swap/SWAP_UPDATE_DEPOSIT_CURRENCY';
const SWAP_UPDATE_SLIPPAGE = 'swap/SWAP_UPDATE_SLIPPAGE';
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
  newDepositCurrency: UniswapCurrency | null
) => (dispatch: AppDispatch) => {
  dispatch({ payload: newDepositCurrency, type: SWAP_UPDATE_DEPOSIT_CURRENCY });
};

export const updateSwapInputCurrency = (
  newInputCurrency: UniswapCurrency | null
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const {
    depositCurrency,
    independentField,
    outputCurrency,
    type,
  } = getState().swap;
  if (
    type === ExchangeModalTypes.swap &&
    newInputCurrency?.address === outputCurrency?.address
  ) {
    dispatch(flipSwapCurrencies());
  } else {
    dispatch({ payload: newInputCurrency, type: SWAP_UPDATE_INPUT_CURRENCY });
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
  newOutputCurrency: UniswapCurrency | null
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { independentField, inputCurrency } = getState().swap;
  if (newOutputCurrency?.address === inputCurrency?.address) {
    dispatch(flipSwapCurrencies());
  } else {
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
  const { genericAssets } = getState().data;
  const {
    independentField,
    independentValue,
    inputCurrency,
    outputCurrency,
  } = getState().swap;
  dispatch({
    payload: {
      newInputCurrency: outputCurrency,
      newOutputCurrency: inputCurrency,
    },
    type: SWAP_FLIP_CURRENCIES,
  });
  if (independentField === SwapModalField.output) {
    dispatch(updateSwapInputAmount(independentValue));
  } else if (independentField === SwapModalField.native) {
    const nativeAmount = independentValue;
    const inputPrice = genericAssets[inputCurrency?.address]?.price?.value ?? 0;
    const inputAmount = nativeAmount
      ? convertAmountFromNativeValue(
          nativeAmount,
          inputPrice,
          inputCurrency?.decimals
        )
      : null;
    dispatch(updateSwapOutputAmount(inputAmount));
  } else {
    dispatch(updateSwapOutputAmount(independentValue));
  }
};

export const swapClearState = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: SwapState = {
  depositCurrency: null,
  independentField: SwapModalField.input,
  independentValue: null,
  inputCurrency: null,
  outputCurrency: null,
  slippageInBips: 50,
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
    case SWAP_UPDATE_SLIPPAGE:
      return {
        ...state,
        slippageInBips: action.payload,
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
