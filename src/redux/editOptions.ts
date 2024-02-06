import { Dispatch } from 'redux';

// TODO get rid of this redux state soon. Currently we use this in a few selectors

// -- Constants --------------------------------------- //
const SET_HIDDEN_COINS = 'editOptions/SET_HIDDEN_COINS';

// -- Types ------------------------------------------- //

/**
 * The `editOptions` reducer's state.
 */
interface EditOptionsState {
  /**
   * The `uniqueId`s of coins to hide.
   */
  hiddenCoins: { [id: string]: boolean };
}

/**
 * The action for updating the hidden coins.
 */
interface EditOptionsSetHiddenCoinsAction {
  payload: EditOptionsState['hiddenCoins'];
  type: typeof SET_HIDDEN_COINS;
}

/**
 * An action for the `editOptions` reducer.
 */
type EditOptionsAction = EditOptionsSetHiddenCoinsAction;

// -- Actions --------------------------------------------------------------- //

/**
 * Updates state with new hidden coin IDs.
 *
 * @param coins The `uniqueId`s of the new hidden coins.
 */
export const setHiddenCoins = (coins: EditOptionsState['hiddenCoins']) => (dispatch: Dispatch<EditOptionsSetHiddenCoinsAction>) => {
  dispatch({
    payload: coins,
    type: SET_HIDDEN_COINS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE: EditOptionsState = {
  hiddenCoins: {},
};

export default (state = INITIAL_STATE, action: EditOptionsAction) => {
  if (action.type === SET_HIDDEN_COINS) {
    return {
      ...state,
      hiddenCoins: action.payload,
    };
  }
  return state;
};
