import { Dispatch } from 'redux';

// -- Constants --------------------------------------- //

const APP_STATE_UPDATE = 'contacts/APP_STATE_UPDATE';

// -- Actions ---------------------------------------- //

/**
 * Represents the current state of the `appState` reducer. Since the reducer
 * is called `appState`, matching the pattern used by other reducers makes
 * this interface `AppStateState` :).
 */
interface AppStateState {
  /**
   * Whether or not the user's wallet has loaded.
   */
  walletReady: boolean;
}

/**
 * The action for updating the `appState` reducer's state.
 */
interface AppStateUpdateAction {
  payload: Partial<AppStateState>;
  type: typeof APP_STATE_UPDATE;
}

/**
 * Updates the state by changing any keys found in `stateToUpdate` to their
 * new values.
 *
 * @param stateToUpdate The updates to apply to the state.
 */
export const appStateUpdate = (stateToUpdate: Partial<AppStateState>) => (dispatch: Dispatch<AppStateUpdateAction>) => {
  dispatch({
    payload: stateToUpdate,
    type: APP_STATE_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //

const INITIAL_STATE: AppStateState = {
  walletReady: false,
};

export default (state: AppStateState = INITIAL_STATE, action: AppStateUpdateAction): AppStateState => {
  switch (action.type) {
    case APP_STATE_UPDATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
