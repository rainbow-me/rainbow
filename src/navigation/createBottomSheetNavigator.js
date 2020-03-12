import React from 'react';
import { createNavigator, SceneView, TabRouter } from 'react-navigation';
import BottomSheet from 'react-native-slack-bottom-sheet';

function BottomSheetMainView({ descriptor, screenProps }) {
  const { navigation, getComponent } = descriptor;
  const SceneComponent = getComponent();
  return (
    <SceneView
      screenProps={screenProps}
      navigation={navigation}
      component={SceneComponent}
    />
  );
}

function BottomSheetRouteView({ descriptor, screenProps }) {
  const { navigation, getComponent } = descriptor;
  const SceneComponent = getComponent();
  return (
    <BottomSheet onDidDismiss={() => navigation.goBack()}>
      <SceneView
        screenProps={screenProps}
        navigation={navigation}
        component={SceneComponent}
      />
    </BottomSheet>
  );
}

function BottomSheetView({
  descriptors,
  navigation,
  screenProps,
  navigationConfig,
}) {
  const mainRoute = React.useRef(null);
  if (mainRoute.current === null) {
    mainRoute.current = navigationConfig.initialRouteName
      ? navigation.state.routes.find(
          r => r.key === navigationConfig.initialRouteName
        )
      : navigation.state.routes[0];
  }

  return (
    <>
      <BottomSheetMainView
        route={mainRoute.current}
        descriptor={descriptors[mainRoute.current.key]}
        screenProps={screenProps}
      />
      {navigation.state.routes[navigation.state.index].key ===
      navigationConfig.initialRouteName ? null : (
        <BottomSheetRouteView
          route={navigation.state.routes[navigation.state.index]}
          descriptor={
            descriptors[navigation.state.routes[navigation.state.index].key]
          }
          screenProps={screenProps}
        />
      )}
    </>
  );
}

export default function createBottomSheetNavigator(
  routes,
  navigationConfig = {}
) {
  const router = TabRouter(routes, navigationConfig);

  return createNavigator(BottomSheetView, router, navigationConfig);
}
