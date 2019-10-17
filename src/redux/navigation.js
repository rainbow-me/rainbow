import Animated from 'react-native-reanimated';

// -- Constants --------------------------------------- //
const UPDATE_TRANSITION_PROPS = 'navigation/UPDATE_TRANSITION_PROPS';

export const updateTransitionProps = payload => (dispatch, getState) => {
  if (
    getState().navigation.transitionProps.position &&
    payload.position === getState().navigation.transitionProps.position
  ) {
    return;
  }
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

export default (state = INITIAL_STATE, action) => {
  if (action.type === UPDATE_TRANSITION_PROPS) {
    if (action.payload.position === state.transitionProps.position) {
      return state;
    }

    return {
      ...state,
      transitionProps: {
        ...state.transitionProps,
        ...action.payload,
      },
    };
  }
  return state;
};
