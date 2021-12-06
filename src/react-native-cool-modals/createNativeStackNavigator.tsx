import {
  createNavigatorFactory,
  StackRouter as OldStackRouter,
  StackActions,
  useNavigationBuilder,
} from '@react-navigation/native';
import * as React from 'react';

// @ts-expect-error ts-migrate(6142) FIXME: Module './NativeStackView' was resolved to '/Users... Remove this comment to see the full error message
import NativeStackView from './NativeStackView';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

function NativeStackNavigator(props: any) {
  const { children, initialRouteName, screenOptions, ...rest } = props;
  const StackRouter = (...args: any[]) => {
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 1 arguments, but got 0 or more.
    const oldRouter = OldStackRouter(...args);
    return {
      ...oldRouter,
      getStateForAction(state: any, action: any, options: any) {
        if (action.type === 'PUSH') {
          if (
            state.routes[state.routes.length - 1].name === action.payload.name
          ) {
            logger.log('pushing twice the same name is not allowed');
            return state;
          }
        }
        return oldRouter.getStateForAction(state, action, options);
      },
    };
  };
  const { descriptors, navigation, state } = useNavigationBuilder(StackRouter, {
    children,
    initialRouteName,
    screenOptions,
  });

  React.useEffect(() => {
    if (navigation.addListener) {
      navigation.addListener('tabPress', e => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultPrevented' does not exist on type... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NativeStackView
      {...rest}
      descriptors={descriptors}
      navigation={navigation}
      state={state}
    />
  );
}

export default createNavigatorFactory(NativeStackNavigator);
