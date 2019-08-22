import produce from 'immer';
import { Animated } from 'react-native';

const { Value } = Animated;

// -- Constants --------------------------------------- //
const UPDATE_STACK_TRANSITION_PROPS = 'navigation/UPDATE_STACK_TRANSITION_PROPS';
const UPDATE_TABS_TRANSITION_PROPS = 'navigation/UPDATE_TABS_TRANSITION_PROPS';

export const updateStackTransitionProps = (payload) => (dispatch) => {
  dispatch({ payload, type: UPDATE_STACK_TRANSITION_PROPS });
};

export const updateTabsTransitionProps = (payload) => (dispatch) => {
  dispatch({ payload, type: UPDATE_TABS_TRANSITION_PROPS });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  stackTransitionProps: {
    isTransitioning: false,
    position: new Value(0),
  },
  tabsTransitionProps: {
    isTransitioning: false,
  },
};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === UPDATE_STACK_TRANSITION_PROPS) {
      Object.assign(draft.stackTransitionProps, action.payload);
    }
    if (action.type === UPDATE_TABS_TRANSITION_PROPS) {
      Object.assign(draft.tabsTransitionProps, action.payload);
    }
  })
);
