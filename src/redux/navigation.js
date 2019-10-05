import produce from 'immer';
import Animated from 'react-native-reanimated';

// -- Constants --------------------------------------- //
const UPDATE_TRANSITION_PROPS = 'navigation/UPDATE_TRANSITION_PROPS';

export const updateTransitionProps = payload => dispatch => {
  dispatch({ payload, type: UPDATE_TRANSITION_PROPS });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  transitionProps: {
    blurColor: null,
    effect: '',
    isTransitioning: false,
    position: new Animated.Value(0),
  },
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === UPDATE_TRANSITION_PROPS) {
      Object.assign(draft.transitionProps, action.payload);
    }
  });
