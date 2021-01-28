import { AnyAction } from 'redux';
import { Asset } from '@rainbow-me/entities';
import { AppDispatch } from '@rainbow-me/redux/store';

interface SwapState {
  inputCurrency: Asset | null;
  outputCurrency: Asset | null;
}

// -- Constants --------------------------------------- //
const SWAP_UPDATE_INPUT_CURRENCY = 'swap/SWAP_UPDATE_INPUT_CURRENCY';
const SWAP_UPDATE_OUTPUT_CURRENCY = 'swap/SWAP_UPDATE_OUTPUT_CURRENCY';
const SWAP_CLEAR_STATE = 'swap/SWAP_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const updateSwapInputCurrency = (newInputCurrency: Asset) => (
  dispatch: AppDispatch
) => {
  dispatch({ payload: newInputCurrency, type: SWAP_UPDATE_INPUT_CURRENCY });
};

export const updateSwapOutputCurrency = (newOutputCurrency: Asset) => (
  dispatch: AppDispatch
) => {
  dispatch({ payload: newOutputCurrency, type: SWAP_UPDATE_OUTPUT_CURRENCY });
};

export const swapClearState = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: SwapState = {
  inputCurrency: null,
  outputCurrency: null,
};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
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
