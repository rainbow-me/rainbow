import React from 'react';
import {
  DefaultNavigatorOptions,
  ParamListBase,
  StackActionHelpers,
  StackActions,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
  createNavigatorFactory,
  useNavigationBuilder,
} from '@react-navigation/native';
import { StackNavigationConfig } from '@react-navigation/stack/lib/typescript/src/types';
import { BottomSheetContainer } from './BottomSheetContainer';
import { BottomSheetNavigationContext } from './context/BottomSheetNavigationContext';

export type BottomNavigationOptions = {
  snapPoints?: Array<number | string>;
};
export type BottomNavigationEventMap = {};

// TODO: Update this type to contain BottomSheet types instead of Stack
type Props = DefaultNavigatorOptions<
  ParamListBase,
  StackNavigationState<ParamListBase>,
  BottomNavigationOptions,
  BottomNavigationEventMap
> &
  StackRouterOptions &
  StackNavigationConfig;

function BottomSheetNavigator({
  id,
  initialRouteName,
  children,
  screenListeners,
  screenOptions,
  ...rest
}: Props) {
  const {
    state,
    descriptors,
    navigation,
    NavigationContent,
  } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    BottomNavigationOptions,
    BottomNavigationEventMap
  >(StackRouter, {
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions,
  });

  const closeSheet = () => {
    navigation.pop();
    // navigation?.dispatch?.({
    //   ...StackActions.pop(),
    //   source: route.key,
    //   // target: state.key,
    // });
  };

  return (
    <BottomSheetNavigationContext.Provider value={{ closeSheet }}>
      <NavigationContent>
        {descriptors[state.routes[0].key].render()}
        {state.routes.slice(1).map(route => (
          <React.Fragment key={route.key}>
            {descriptors[route.key].render()}
          </React.Fragment>
        ))}
        {/* {state.routes.slice(1).map(route => (
          <BottomSheetContainer
            key={route.key}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...rest}
            state={state}
            descriptors={descriptors}
            navigation={navigation}
            route={route}
          />
        ))} */}
      </NavigationContent>
    </BottomSheetNavigationContext.Provider>
  );
}

export const createBottomSheetNavigator = createNavigatorFactory<
  StackNavigationState<ParamListBase>,
  BottomNavigationOptions,
  BottomNavigationEventMap,
  typeof BottomSheetNavigator
>(BottomSheetNavigator);
