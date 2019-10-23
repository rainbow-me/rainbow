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
  },
};

export default (state = INITIAL_STATE, action) => {
  if (action.type === UPDATE_TRANSITION_PROPS) {
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
