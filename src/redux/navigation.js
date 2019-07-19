import Animated from 'react-native-reanimated';

const { Value } = Animated;

// -- Constants --------------------------------------- //
const UPDATE_TRANSITION_PROPS = 'navigation/UPDATE_TRANSITION_PROPS';

export const updateTransitionProps = (payload) => (dispatch) => {
  dispatch({ payload, type: UPDATE_TRANSITION_PROPS });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  transitionProps: {
    isExpanded: false,
    isTransitioning: false,
    position: new Value(0),
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
