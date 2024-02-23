import { AppDispatch, AppGetState } from './store';
import { getTransactionSignatures, saveTransactionSignatures } from '@/handlers/localstorage/globalSettings';

export const TRANSACTION_SIGNATURES_ADD_NEW_TRANSACTION_SIGNATURE_SUCCESS =
  'transactionSignatures/DATA_ADD_NEW_TRANSACTION_SIGNATURE_SUCCESS';
const TRANSACTION_SIGNATURES_LOAD_TRANSACTION_SIGNATURES_SUCCESS = 'transactionSignatures/DATA_LOAD_TRANSACTION_SIGNATURES_SUCCESS';

// -- Actions ---------------------------------------- //
export const transactionSignaturesLoadState = () => async (dispatch: AppDispatch) => {
  try {
    const signatures = await getTransactionSignatures();
    dispatch({
      payload: signatures,
      type: TRANSACTION_SIGNATURES_LOAD_TRANSACTION_SIGNATURES_SUCCESS,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};

export const transactionSignaturesDataAddNewSignature =
  (parsedSignature: string, bytes: string) => async (dispatch: AppDispatch, getState: AppGetState) => {
    const { signatures } = getState().transactionSignatures;
    if (parsedSignature) {
      const newTransactionSignatures = {
        ...signatures,
        [bytes]: parsedSignature,
      };
      try {
        dispatch({
          payload: newTransactionSignatures,
          type: TRANSACTION_SIGNATURES_ADD_NEW_TRANSACTION_SIGNATURE_SUCCESS,
        });
        saveTransactionSignatures(newTransactionSignatures);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
  };

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: { signatures: { [key: string]: string } } = {
  signatures: {},
};

export default (state = INITIAL_STATE, action: { type: string; payload: { [key: string]: string } }) => {
  switch (action.type) {
    case TRANSACTION_SIGNATURES_LOAD_TRANSACTION_SIGNATURES_SUCCESS:
      return {
        ...state,
        signatures: action.payload,
      };
    case TRANSACTION_SIGNATURES_ADD_NEW_TRANSACTION_SIGNATURE_SUCCESS:
      return {
        ...state,
        signatures: action.payload,
      };
    default:
      return state;
  }
};
