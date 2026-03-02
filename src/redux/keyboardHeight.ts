import produce from 'immer';
import { type Dispatch } from 'redux';
import { getKeyboardHeight as loadKeyboardHeights, setKeyboardHeight as saveKeyboardHeight } from '@/handlers/localstorage/globalSettings';
import type KeyboardTypes from '@/helpers/keyboardTypes';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { type AppGetState } from '@/redux/store';
import { getDefaultKeyboardHeight } from '@/utils/keyboardHeight';

// -- Constants --------------------------------------- //
const LOAD = 'keyboardHeight/LOAD';
const SAVE = 'keyboardHeight/SAVE';

// -- Interfaces --------------------------------------- //

/**
 * Represents the state of the `keyboardHeight` rducer.
 */
interface KeyboardHeightState {
  keyboardHeight: {
    [keyboardType in KeyboardType]?: number;
  };
}

/**
 * An action for the `keyboardHeight` reducer.
 */
type KeyboardHeightAction = KeyboardHeightLoadAction | KeyboardHeightSaveAction;

interface KeyboardHeightLoadAction {
  type: typeof LOAD;
  payload: KeyboardHeightState['keyboardHeight'];
}

interface KeyboardHeightSaveAction {
  type: typeof SAVE;
  keyboardType: keyof typeof KeyboardTypes;
  height: number;
}

interface SetKeyboardHeightFunctionParameter {
  height: number;
  keyboardType: keyof typeof KeyboardTypes;
}

const INITIAL_STATE: KeyboardHeightState = {
  keyboardHeight: {
    [KeyboardType.default]: getDefaultKeyboardHeight(),
  },
};

export const keyboardHeightsLoadState = () => async (dispatch: Dispatch<KeyboardHeightLoadAction>) => {
  const cachedKeyboardHeights = await loadKeyboardHeights();

  dispatch({
    payload: {
      ...INITIAL_STATE.keyboardHeight,
      ...cachedKeyboardHeights,
    },
    type: LOAD,
  });
};

export const setKeyboardHeight =
  ({ height, keyboardType = KeyboardType.default }: SetKeyboardHeightFunctionParameter) =>
  async (dispatch: Dispatch<KeyboardHeightSaveAction>, getState: AppGetState) => {
    await dispatch({
      height,
      keyboardType,
      type: SAVE,
    });

    const prevState = getState().keyboardHeight.keyboardHeight;
    saveKeyboardHeight({
      ...prevState,
      [keyboardType]: height,
    });
  };

// -- Reducer ----------------------------------------- //
export default (state: KeyboardHeightState = INITIAL_STATE, action: KeyboardHeightAction) =>
  produce(state, draft => {
    switch (action.type) {
      case LOAD:
        draft.keyboardHeight = action.payload;
        break;
      case SAVE:
        draft.keyboardHeight[action.keyboardType] = action.height;
        break;
      default:
        break;
    }
  });
