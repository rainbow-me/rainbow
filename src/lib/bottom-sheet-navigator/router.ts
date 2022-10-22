import {
  CommonNavigationAction,
  Router,
  StackActionType,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
} from '@react-navigation/native';
import { actions } from './actions';

export const router = (
  routerOptions: StackRouterOptions
): Router<StackNavigationState, CommonNavigationAction | StackActionType> => {
  const stackRouter = StackRouter(routerOptions);

  return {
    ...stackRouter,

    actionCreators: {
      ...stackRouter.actionCreators,
      ...actions,
    },

    getStateForAction(state, action, options) {
      switch (action.type) {
        // TODO
        default:
          return stackRouter.getStateForAction(state, action, options);
      }
    },
  };
};
