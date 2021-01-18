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

function Route({ descriptor, onDismiss}) {
    const ref = useRef<BottomSheetModal>()
    useEffect(() => ref.current?.present(), [])
    return <BottomSheetModal
        animationDuration={250}
        onDismiss={onDismiss}
        ref={ref}
        snapPoints={['25%', '50%']}
        // ref={bottomSheetRef}
        // onDismiss={handleDismiss}
        // onChange={handleChange}
    >
        {descriptor.render()}
    </BottomSheetModal>
}

function StackView({ descriptors, state, navigation }) {
    console.log(state.routes.map(route => descriptors[route.key]))
    const [firstKey, ...restKeys] = state.routes.map(route => route.key)
    const previousKeys = useRef([])
    const [keys, setKeys] = React.useState([])
    const newKeys = restKeys.map(key => previousKeys.current.indexOf(key))
    if (newKeys.length) {
        setKeys(ks => ks.concat(newKeys))
    }
    const removingKeys = previousKeys.current.map(key => restKeys.indexOf(key))

    console.log("CCC", keys)

    previousKeys.current = restKeys;
    return (
        <>
            {descriptors[firstKey].render()}
            {keys.map(key => (
                <Route descriptor={descriptors[key]} key={key} onDismiss={() => setKeys(routesKeys => routesKeys.filter(routeKey => routeKey !== key))} />
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
