import {
  createNavigatorFactory,
  StackActions,
  StackRouter as OldStackRouter,
  useNavigationBuilder,
  type NavigationState,
  type ParamListBase,
  type StackNavigationState,
} from '@react-navigation/native';
import * as React from 'react';

import NativeStackView from './NativeStackView';
import { logger } from '@/logger';

type NavigatorProps = {
  children: React.ReactNode;
  initialRouteName?: string;
  screenOptions?: Record<string, unknown>;
} & Record<string, unknown>;

const StackRouter = (...args: Parameters<typeof OldStackRouter>) => {
  const oldRouter = OldStackRouter(...args);
  return {
    ...oldRouter,
    getStateForAction(state: StackNavigationState<ParamListBase>, action: any, options: any) {
      if (action.type === 'PUSH') {
        if (state.routes[state.routes.length - 1].name === action.payload.name) {
          logger.debug(`[NativeStackNavigator]: pushing twice the same name is not allowed`);
          return state;
        }
      }
      return oldRouter.getStateForAction(state, action, options);
    },
  };
};

function NativeStackNavigator(props: NavigatorProps) {
  const { children, initialRouteName, screenOptions, ...rest } = props;
  const { descriptors, navigation, state } = useNavigationBuilder<StackNavigationState<ParamListBase>, any, any, any, any>(
    StackRouter as any,
    {
      children,
      initialRouteName,
      screenOptions,
    }
  );

  React.useEffect(() => {
    if (navigation.addListener) {
      navigation.addListener('tabPress', (e: any) => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
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

  return <NativeStackView {...rest} descriptors={descriptors} navigation={navigation} state={state} />;
}

export default createNavigatorFactory(NativeStackNavigator);
