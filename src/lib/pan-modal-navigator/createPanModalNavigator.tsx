import {
  createNavigatorFactory,
  DefaultNavigatorOptions,
  StackActions,
  StackRouter as BaseStackRouter,
  useNavigationBuilder,
} from '@react-navigation/native';
import * as React from 'react';
import { logger } from '@/logger';
import {
  CommonNavigationAction,
  Router,
} from '@react-navigation/routers/src/types';
import {
  StackActionType,
  StackNavigationState,
  StackRouterOptions,
} from '@react-navigation/routers/src/StackRouter';
import {
  StackNavigationConfig,
  StackNavigationOptions,
} from '@react-navigation/stack/src/types';
import PanModalStackView from './PanModalStackView';

type RouterType = Router<
  StackNavigationState,
  CommonNavigationAction | StackActionType
>;

function NativeStackRouter(options: StackRouterOptions) {
  const baseStackRouter = BaseStackRouter(options);

  const getStateForAction: RouterType['getStateForAction'] = (
    state,
    action,
    options
  ) => {
    if (action.type === 'PUSH') {
      if (state.routes[state.routes.length - 1].name === action.payload.name) {
        logger.warn('pushing twice the same name is not allowed');
        return state;
      }
    }
    return baseStackRouter.getStateForAction(state, action, options);
  };

  const router: RouterType = {
    ...baseStackRouter,
    getStateForAction,
  };

  return router;
}

type Props = DefaultNavigatorOptions<StackNavigationOptions> &
  StackRouterOptions &
  StackNavigationConfig;

function NativeStackNavigator(props: Props) {
  const { children, initialRouteName, screenOptions, ...rest } = props;

  const { descriptors, navigation, state } = useNavigationBuilder(
    NativeStackRouter,
    {
      children,
      initialRouteName,
      screenOptions,
    }
  );

  React.useEffect(() => {
    if (navigation.addListener) {
      navigation.addListener('tabPress', e => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          // @ts-expect-error TS says defaultPrevented is not in the event data, and our event data type is loosely specified
          if (state.index > 0 && isFocused && e.defaultPrevented) {
            // When user taps on already focused tab and we're inside the tab,
            // reset the stack to replicate native behaviour
            navigation.dispatch({
              ...StackActions.popToTop(),
              target: state.key,
            });
          }
        });
      });
    }
  }, [navigation, state.index, state.key]);

  return (
    <PanModalStackView
      {...rest}
      descriptors={descriptors}
      navigation={navigation}
      state={state}
    />
  );
}

export default createNavigatorFactory(NativeStackNavigator);
