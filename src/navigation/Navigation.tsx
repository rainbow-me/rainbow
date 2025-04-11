import {
  CommonActions,
  useNavigation as oldUseNavigation,
  StackActions,
  useIsFocused,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { useCallbackOne } from 'use-memo-one';
import Routes, { NATIVE_ROUTES } from '@/navigation/routesNames';
import type { RootStackParamList } from './types';

let TopLevelNavigationRef: NavigationContainerRef<RootStackParamList> | null = null;

const poppingCounter = { isClosing: false, pendingActions: [] as (() => void)[] };

export function addActionAfterClosingSheet(action: () => void) {
  if (poppingCounter.isClosing) {
    poppingCounter.pendingActions.push(action);
  } else {
    action();
  }
}

export function onWillPop() {
  poppingCounter.isClosing = true;
}

export function onDidPop() {
  poppingCounter.isClosing = false;
  if (poppingCounter.pendingActions.length !== 0) {
    setImmediate(() => {
      poppingCounter.pendingActions.forEach(action => action());
      poppingCounter.pendingActions = [];
    });
  }
}

// --- Type Overloads for Navigation Functions ---

// Overloads for navigate/replace functions (used in useNavigation and handleAction)
type NavigateFunction = {
  // Overload 1: Direct navigation with params
  <RouteName extends keyof RootStackParamList>(routeName: RouteName, params: RootStackParamList[RouteName]): void;
  // Overload 2a: Nested navigation where INNER route takes UNDEFINED params
  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params: RootStackParamList[InnerRouteName] extends undefined
      ? { screen: InnerRouteName; params?: undefined } // params optional and must be undefined
      : never
  ): void;
  // Overload 2b: Nested navigation where INNER route takes NON-UNDEFINED params
  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params: RootStackParamList[InnerRouteName] extends undefined
      ? never
      : { screen: InnerRouteName; params: RootStackParamList[InnerRouteName] } // params REQUIRED
  ): void;
  // Overload 3: Navigation without params (handles undefined/empty params)
  <RouteName extends keyof RootStackParamList>(
    // Requires params argument to be optional only if RootStackParamList[RouteName] can be undefined
    // This check is complex, so we simplify by allowing 'undefined' if no params provided.
    routeName: RouteName,
    params?: RootStackParamList[RouteName] extends undefined ? undefined : RootStackParamList[RouteName]
  ): void;
};

// Overloads for the global handleAction
type HandleActionFunction = {
  // Overload 1: Direct navigation with params
  <RouteName extends keyof RootStackParamList>(name: RouteName, params: RootStackParamList[RouteName], replace?: boolean): void;
  // Overload 2a: Nested navigation where INNER route takes UNDEFINED params
  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    name: RouteName,
    params: RootStackParamList[InnerRouteName] extends undefined
      ? { screen: InnerRouteName; params?: undefined } // params optional and must be undefined
      : never,
    replace?: boolean
  ): void;
  // Overload 2b: Nested navigation where INNER route takes NON-UNDEFINED params
  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    name: RouteName,
    params: RootStackParamList[InnerRouteName] extends undefined
      ? never
      : { screen: InnerRouteName; params: RootStackParamList[InnerRouteName] }, // params REQUIRED
    replace?: boolean
  ): void;
  // Overload 3: Direct navigation without params
  <RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName] extends undefined ? undefined : RootStackParamList[RouteName],
    replace?: boolean
  ): void;
};

export function useNavigation() {
  const navigation = oldUseNavigation<StackNavigationProp<RootStackParamList>>();

  // Use the overloaded NavigateFunction type
  const handleNavigate: NavigateFunction = useCallbackOne(
    (routeName: keyof RootStackParamList, params?: any) => {
      // Implementation uses 'any', overloads provide external type safety
      navigate(navigation.navigate, routeName, params);
    },
    [navigation.navigate]
  );

  // Use the overloaded NavigateFunction type
  const handleReplace: NavigateFunction = useCallbackOne(
    (routeName: keyof RootStackParamList, params?: any) => {
      // Implementation uses 'any', overloads provide external type safety
      navigation.replace(routeName as string, params);
    },
    [navigation.replace]
  );

  // Return an object explicitly listing the methods, excluding the spread
  return {
    // --- Custom Handlers ---
    navigate: handleNavigate,
    replace: handleReplace,
    // --- Passthrough Methods ---
    // Add any other methods from StackNavigationProp you rely on
    dispatch: navigation.dispatch,
    goBack: navigation.goBack,
    isFocused: navigation.isFocused,
    setParams: navigation.setParams,
    getId: navigation.getId,
    getParent: navigation.getParent,
    getState: navigation.getState,
    setOptions: navigation.setOptions,
    addListener: navigation.addListener,
    removeListener: navigation.removeListener,
    canGoBack: navigation.canGoBack,
    reset: navigation.reset,
    pop: navigation.pop,
    popToTop: navigation.popToTop,
    push: navigation.push,
  };
}

export function withNavigation<P extends object>(Component: React.ComponentType<P>) {
  return function WithNavigationWrapper(props: P) {
    const navigation = useNavigation();
    return <Component {...props} navigation={navigation} />;
  };
}

export function withNavigationFocus<P extends object>(Component: React.ComponentType<P>) {
  return function WithNavigationWrapper(props: P) {
    const isFocused = useIsFocused();

    return <Component {...props} isFocused={isFocused} />;
  };
}

let blocked = false;
let timeout: ReturnType<typeof setTimeout> | null = null;
function block() {
  blocked = true;
  if (timeout !== null) {
    clearTimeout(timeout);
    timeout = null;
  }
  setTimeout(() => (blocked = false), 200);
}

/**
 * Helper navigate function - make non-generic again
 */
export function navigate(
  navigationAction: (...args: any[]) => void, // Accept any args
  ...args: any[] // Accept any args
) {
  // Keep the string check generic for the first argument if it's a route name
  if (typeof args[0] === 'string') {
    if (NATIVE_ROUTES.indexOf(args[0] as any) !== -1) {
      const wasBlocked = blocked;
      block();
      if (wasBlocked) {
        return;
      }
    }
    addActionAfterClosingSheet(() => navigationAction(...args));
  } else {
    navigationAction(...args);
  }
}

export function getActiveRoute() {
  return TopLevelNavigationRef?.getCurrentRoute();
}

function getActiveOptions() {
  return TopLevelNavigationRef?.getCurrentOptions();
}

/**
 * Gets the current screen from navigation state
 */
function getActiveRouteName() {
  const route = getActiveRoute();
  return route?.name;
}

/**
 * Handle a navigation action or queue the action if navigation actions have been paused.
 * @param  {Object} action      The navigation action to run.
 */
// Apply the overloaded type to the standalone handleAction function
const handleAction: HandleActionFunction = (
  name: keyof RootStackParamList,
  params?: any, // Implementation uses 'any'
  replace = false
) => {
  if (!TopLevelNavigationRef) return;

  const action = (replace ? StackActions.replace : CommonActions.navigate)(
    name as string, // Cast needed for underlying call
    params as object | undefined // Use general type for implementation
  );
  TopLevelNavigationRef?.dispatch(action);
};

function goBack() {
  if (!TopLevelNavigationRef) return;
  TopLevelNavigationRef.goBack();
}

/**
 * Set Top Level Navigator
 */
function setTopLevelNavigator(navigatorRef: NavigationContainerRef<RootStackParamList> | null) {
  TopLevelNavigationRef = navigatorRef;
}

export default {
  getActiveOptions,
  getState: () => TopLevelNavigationRef?.getState(),
  getActiveRoute,
  getActiveRouteName,
  handleAction,
  setTopLevelNavigator,
  goBack,
};
