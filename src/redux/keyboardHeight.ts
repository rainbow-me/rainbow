import produce from 'immer';
import { Dispatch } from 'redux';
import { getKeyboardHeight as loadKeyboardHeights, setKeyboardHeight as saveKeyboardHeight } from '@/handlers/localstorage/globalSettings';
import { KeyboardType } from '@/helpers/keyboardTypes';
import { AppGetState } from '@/redux/store';
import { deviceUtils } from '@/utils';

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
  keyboardType: KeyboardType;
  height: number;
}

interface SetKeyboardHeightFunctionParameter {
  height: number;
  keyboardType: KeyboardType;
}

// -- Actions --------------------------------------- //
function getDefaultKeyboardHeight(): number {
  let keyboardHeight = 0;
  switch (deviceUtils.dimensions.height) {
    case 568:
      keyboardHeight = 216;
      break;
    case 667:
      keyboardHeight = 216;
      break;
    case 736:
      keyboardHeight = 226;
      break;
    case 812:
      keyboardHeight = 291;
      break;
    case 844:
      keyboardHeight = 291;
      break;
    case 896:
      keyboardHeight = 301;
      break;
    default:
      keyboardHeight = Math.floor(deviceUtils.dimensions.height * 0.333);
  }
  return keyboardHeight;
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
