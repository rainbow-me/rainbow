import {
  createNavigatorFactory,
  StackActions,
  StackRouter,
  useNavigationBuilder,
} from '@react-navigation/native';
import * as React from 'react';

import NativeStackView from './NativeStackView';

function NativeStackNavigator(props) {
  const { children, initialRouteName, screenOptions, ...rest } = props;
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
    <NativeStackView
      {...rest}
      descriptors={descriptors}
      navigation={navigation}
      state={state}
    />
  );
}

export default createNavigatorFactory(NativeStackNavigator);
