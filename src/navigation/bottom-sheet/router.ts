import {
  StackRouter,
  type CommonNavigationAction,
  type PartialState,
  type Router,
  type StackActionType,
  type StackNavigationState,
  type StackRouterOptions,
} from '@react-navigation/native';

import { type RootStackParamList } from '@/navigation/types';

import { actions } from './actions';

export const router = (
  routerOptions: StackRouterOptions
): Router<StackNavigationState<RootStackParamList>, CommonNavigationAction | StackActionType> => {
  const stackRouter = StackRouter(routerOptions);

  return {
    ...(stackRouter as Router<StackNavigationState<RootStackParamList>, CommonNavigationAction | StackActionType>),

    actionCreators: {
      ...stackRouter.actionCreators,
      ...actions,
    },

    getStateForAction(state, action, options) {
      switch (action.type) {
        // TODO
        default:
          return stackRouter.getStateForAction(state, action, options) as
            | StackNavigationState<RootStackParamList>
            | PartialState<StackNavigationState<RootStackParamList>>
            | null;
      }
    },
  };
};
