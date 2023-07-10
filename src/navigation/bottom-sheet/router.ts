import {
  CommonNavigationAction,
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
): Router<
  StackNavigationState<RootStackParamList>,
  CommonNavigationAction | StackActionType
> => {
  const stackRouter = StackRouter(routerOptions);

  return {
    ...stackRouter,

    actionCreators: {
      ...stackRouter.actionCreators,
      ...actions,
    },

    // @ts-expect-error doesn't like the typing of RootStackParamList
    getStateForAction(state, action, options) {
      switch (action.type) {
        // TODO
        default:
          return stackRouter.getStateForAction(state, action, options);
      }
    },
  };
};
