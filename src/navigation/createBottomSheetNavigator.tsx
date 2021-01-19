import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
    createNavigatorFactory,
    DefaultNavigatorOptions,
    EventArg,
    ParamListBase,
    StackActionHelpers,
    StackActions,
    StackNavigationState,
    StackRouter,
    StackRouterOptions,
    useNavigationBuilder,
} from '@react-navigation/native';
import type {
    StackNavigationConfig,
    StackNavigationEventMap,
    StackNavigationOptions,
} from '@react-navigation/stack/src/types';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type Props = DefaultNavigatorOptions<StackNavigationOptions> &
    StackRouterOptions &
    StackNavigationConfig;

function Route({ descriptor, onDismiss, removing }) {
    const ref = useRef<BottomSheetModal>()
    useEffect(() => {
        console.log(ref)
        ref.current?.present()
    }, [])
    useEffect(() => {
        removing && ref.current.dismiss(true)
    }, [removing])
    return <BottomSheetModal
        animationDuration={250}
        onAnimate={(prev, curr) => prev === 1 && curr === -1 && onDismiss(removing)}
        onDismiss={() => onDismiss(removing)}
        ref={ref}
        snapPoints={['100%']}
        //stackBehavior="push"
        // ref={bottomSheetRef}
        // onDismiss={handleDismiss}
        // onChange={handleChange}
    >
        {descriptor.render()}
    </BottomSheetModal>
}

function StackView({ descriptors, state, navigation }) {
    const descriptorsCache = useRef({})
    const [firstKey, ...restKeys] = state.routes.map(route => route.key)
    const previousKeys = useRef([])
    const [keys, setKeys] = React.useState([])
    const newKeys = restKeys.filter(key => previousKeys.current.indexOf(key) === -1)
    const removingKeys = useRef({})

    if (newKeys.length) {
        newKeys.forEach(key => descriptorsCache.current[key] = descriptors[key])
        setKeys(ks => ks.concat(newKeys))
    }
    const newRemovingKeys = previousKeys.current.filter(key => restKeys.indexOf(key) === -1)
    for (let removingKey of newRemovingKeys) {
        removingKeys.current[removingKey] = true
    }

    previousKeys.current = restKeys


    console.log("CCC", keys)

    return (
        <>
            {descriptors[firstKey].render()}
            {keys.map(key => (
                descriptorsCache.current[key] && <Route descriptor={descriptorsCache.current[key]} key={key} onDismiss={(removing) => {
                    setTimeout(() => {
                        console.log("onDismiss")
                        !removing && navigation?.dispatch?.({
                            ...StackActions.pop(),
                            source: key,
                            target: state.key,
                        });
                        descriptorsCache.current[key] = undefined;
                        removingKeys.current[key] = undefined;
                        setKeys(routesKeys => routesKeys.filter(routeKey => routeKey !== key))
                    }, 500)
                }}
                    removing={removingKeys.current[key]}
                />
            ))}
        </>

    )

}


function StackNavigator({
                            initialRouteName,
                            children,
                            screenOptions,
                            ...rest
                        }: Props) {
    const defaultOptions = {
        gestureEnabled: true,
        animationEnabled:
            Platform.OS !== 'web' &&
            Platform.OS !== 'windows' &&
            Platform.OS !== 'macos',
    };

    const { state, descriptors, navigation } = useNavigationBuilder<
        StackNavigationState<ParamListBase>,
        StackRouterOptions,
        StackActionHelpers<ParamListBase>,
        StackNavigationOptions,
        StackNavigationEventMap
        >(StackRouter, {
        initialRouteName,
        children,
        screenOptions:
            typeof screenOptions === 'function'
                ? (...args) => ({
                    ...defaultOptions,
                    ...screenOptions(...args),
                })
                : {
                    ...defaultOptions,
                    ...screenOptions,
                },
    });

    React.useEffect(
        () =>
            navigation.addListener?.('tabPress', (e) => {
                const isFocused = navigation.isFocused();

                // Run the operation in the next frame so we're sure all listeners have been run
                // This is necessary to know if preventDefault() has been called
                requestAnimationFrame(() => {
                    if (
                        state.index > 0 &&
                        isFocused &&
                        !(e as EventArg<'tabPress', true>).defaultPrevented
                    ) {
                        // When user taps on already focused tab and we're inside the tab,
                        // reset the stack to replicate native behaviour
                        navigation.dispatch({
                            ...StackActions.popToTop(),
                            target: state.key,
                        });
                    }
                });
            }),
        [navigation, state.index, state.key]
    );

    return (
        <BottomSheetModalProvider>

        <StackView
            {...rest}
            descriptors={descriptors}
            navigation={navigation}
            state={state}
    />
        </BottomSheetModalProvider>
);
}


export default createNavigatorFactory<
    StackNavigationState<ParamListBase>,
    StackNavigationOptions,
    StackNavigationEventMap,
    typeof StackNavigator
    >(StackNavigator);
