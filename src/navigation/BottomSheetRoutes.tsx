import React from 'react';
import { Text, View } from 'react-native';
import { createBottomSheetNavigator } from './bottom-sheet-navigator/createBottomSheetNavigator';

const BottomSheet = createBottomSheetNavigator();

function ABCComponent() {
  return (
    <View>
      <Text>XDXDXD</Text>
    </View>
  );
}

export function BottomSheetRoutes() {
  return (
    <BottomSheet.Navigator initialRouteName="ABC">
      <BottomSheet.Screen name="ABC" component={ABCComponent} />
    </BottomSheet.Navigator>
  );
}
