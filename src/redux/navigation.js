import { Animated } from 'react-native';

// -- Constants --------------------------------------- //
const UPDATE_TRANSITION_PROPS = 'navigation/UPDATE_TRANSITION_PROPS';

export const updateTransitionProps = (payload) => (dispatch) => {
  dispatch({ type: UPDATE_TRANSITION_PROPS, payload });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  transitionProps: {
    effect: '',
    prevIndex: 0,
    nextIndex: 1,
    position: new Animated.Value(0),
    isTransitioning: false,
  },
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case UPDATE_TRANSITION_PROPS:
    return {
      ...state,
      transitionProps: {
        ...state.transitionProps,
        ...action.payload,
      },
    };
  default:
    return state;
  }
};
