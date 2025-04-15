import {
  CommonActions,
  useNavigation as oldUseNavigation,
  StackActions,
  useIsFocused,
  type NavigationContainerRef,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import { StackNavigationOptions, type StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { useCallbackOne } from 'use-memo-one';
import { NATIVE_ROUTES } from '@/navigation/routesNames';
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

type AreAllPropertiesOptional<T> = undefined extends T ? true : object extends T ? true : false;

export type NavigateFunction = {
  <RouteName extends keyof RootStackParamList>(routeName: RouteName, params: RootStackParamList[RouteName], replace: true): void;

  <RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    ...params: AreAllPropertiesOptional<RootStackParamList[RouteName]> extends true
      ? [params?: RootStackParamList[RouteName]]
      : [params: RootStackParamList[RouteName]]
  ): void;

  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    ...rest: RootStackParamList[RouteName] extends NavigatorScreenParams<infer P> | undefined
      ? InnerRouteName extends keyof P
        ? P[InnerRouteName] extends infer InnerParams
          ? InnerParams extends undefined
            ? [params: { screen: InnerRouteName; params?: undefined; initial?: boolean }]
            : InnerParams extends object
              ? AreAllPropertiesOptional<InnerParams> extends true
                ? [params: { screen: InnerRouteName; params?: InnerParams; initial?: boolean }]
                : never
              : never
          : never
        : never
      : never
  ): void;

  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    ...rest: RootStackParamList[RouteName] extends NavigatorScreenParams<infer P> | undefined
      ? InnerRouteName extends keyof P
        ? P[InnerRouteName] extends infer InnerParams
          ? InnerParams extends object
            ? AreAllPropertiesOptional<InnerParams> extends false
              ? [params: { screen: InnerRouteName; params: InnerParams; initial?: boolean }]
              : never
            : InnerParams extends undefined
              ? never
              : [params: { screen: InnerRouteName; params: InnerParams; initial?: boolean }]
          : never
        : never
      : never
  ): void;

  <RouteName extends keyof RootStackParamList>(
    ...args: RootStackParamList[RouteName] extends undefined
      ? RootStackParamList[RouteName] extends NavigatorScreenParams<any>
        ? never
        : [routeName: RouteName, params?: undefined]
      : never
  ): void;

  <RouteName extends keyof RootStackParamList>(
    ...args: RootStackParamList[RouteName] extends object
      ? RootStackParamList[RouteName] extends NavigatorScreenParams<any>
        ? never
        : AreAllPropertiesOptional<RootStackParamList[RouteName]> extends true
          ? [routeName: RouteName, params?: RootStackParamList[RouteName]]
          : never
      : never
  ): void;

  <RouteName extends keyof RootStackParamList>(
    ...args: RootStackParamList[RouteName] extends undefined | NavigatorScreenParams<any>
      ? never
      : RootStackParamList[RouteName] extends object
        ? AreAllPropertiesOptional<RootStackParamList[RouteName]> extends true
          ? [routeName: RouteName, params?: RootStackParamList[RouteName]]
          : [routeName: RouteName, params: RootStackParamList[RouteName]]
        : [routeName: RouteName, params: RootStackParamList[RouteName]]
  ): void;
};

export type HandleActionFunction = {
  <RouteName extends keyof RootStackParamList>(name: RouteName, params: RootStackParamList[RouteName], replace?: boolean): void;

  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    name: RouteName,
    ...rest: RootStackParamList[RouteName] extends NavigatorScreenParams<infer P> | undefined
      ? InnerRouteName extends keyof P
        ? P[InnerRouteName] extends infer InnerParams
          ? InnerParams extends undefined
            ? [params: { screen: InnerRouteName; params?: undefined }, replace?: boolean]
            : InnerParams extends object
              ? AreAllPropertiesOptional<InnerParams> extends true
                ? [params: { screen: InnerRouteName; params?: InnerParams }, replace?: boolean]
                : never
              : never
          : never
        : never
      : never
  ): void;

  <RouteName extends keyof RootStackParamList, InnerRouteName extends keyof RootStackParamList>(
    name: RouteName,
    ...rest: RootStackParamList[RouteName] extends NavigatorScreenParams<infer P> | undefined
      ? InnerRouteName extends keyof P
        ? P[InnerRouteName] extends infer InnerParams
          ? InnerParams extends object
            ? AreAllPropertiesOptional<InnerParams> extends false
              ? [params: { screen: InnerRouteName; params: InnerParams }, replace?: boolean]
              : never
            : InnerParams extends undefined
              ? never
              : [params: { screen: InnerRouteName; params: InnerParams }, replace?: boolean]
          : never
        : never
      : never
  ): void;

  <RouteName extends keyof RootStackParamList>(
    ...args: RootStackParamList[RouteName] extends undefined
      ? RootStackParamList[RouteName] extends NavigatorScreenParams<any>
        ? never
        : [name: RouteName, params?: undefined, replace?: false]
      : never
  ): void;

  <RouteName extends keyof RootStackParamList>(
    ...args: RootStackParamList[RouteName] extends object
      ? RootStackParamList[RouteName] extends NavigatorScreenParams<any>
        ? never
        : AreAllPropertiesOptional<RootStackParamList[RouteName]> extends true
          ? [name: RouteName, params?: RootStackParamList[RouteName], replace?: false]
          : never
      : never
  ): void;

  <RouteName extends keyof RootStackParamList>(
    ...args: RootStackParamList[RouteName] extends undefined | NavigatorScreenParams<any>
      ? never
      : RootStackParamList[RouteName] extends object
        ? AreAllPropertiesOptional<RootStackParamList[RouteName]> extends true
          ? never
          : [name: RouteName, params: RootStackParamList[RouteName], replace?: false]
        : [name: RouteName, params: RootStackParamList[RouteName], replace?: false]
  ): void;
};

type ExtendedSetOptionsFunction = Partial<StackNavigationOptions> & {
  limitActiveModals?: boolean;
  longFormHeight?: number;
  shortFormHeight?: number;
  onWillDismiss?: () => void;
};

type SetParamsFunction<T extends keyof RootStackParamList> = RootStackParamList[T] extends undefined
  ? () => void
  : (params: Partial<RootStackParamList[T]>) => void;

export function useNavigation<RouteName extends keyof RootStackParamList>() {
  const navigation = oldUseNavigation<StackNavigationProp<RootStackParamList>>();

  const handleNavigate: NavigateFunction = useCallbackOne(
    (routeName: keyof RootStackParamList, params?: any, replace?: boolean) => {
      if (replace) {
        (navigation.navigate as any)(routeName, params, replace);
      } else {
        (navigation.navigate as any)(routeName, params);
      }
    },
    [navigation.navigate]
  );

  const handleReplace: NavigateFunction = useCallbackOne(
    (routeName: keyof RootStackParamList, params?: any) => {
      (navigation.replace as any)(routeName, params);
    },
    [navigation.replace]
  );

  const handleSetParams = useCallbackOne(
    (...args: any[]) => {
      if (args.length === 0) {
        navigation.setParams(undefined);
      } else {
        navigation.setParams(args[0]);
      }
    },
    [navigation.setParams]
  ) as SetParamsFunction<RouteName>;

  const handleSetOptions = useCallbackOne(
    (params: Partial<ExtendedSetOptionsFunction>) => navigation.setOptions(params),
    [navigation.setOptions]
  );

  return {
    ...navigation,
    navigate: handleNavigate,
    replace: handleReplace,
    setOptions: handleSetOptions,
    setParams: handleSetParams,
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
export function navigate(navigationAction: (...args: any[]) => void, ...args: any[]) {
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
