import {
  CommonNavigationAction,
  PartialState,
  Router,
  StackActionType,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
} from '@react-navigation/native';
import { actions } from './actions';
import { RootStackParamList } from '@/navigation/types';

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
