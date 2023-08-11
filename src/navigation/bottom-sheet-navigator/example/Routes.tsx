import React, { useState } from 'react';
import { createBottomSheetNavigator } from '../createBottomSheetNavigator';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, SafeAreaView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/core';
import { AdaptiveBottomSheet } from '../components/AdaptiveBottomSheet';
import { StaticBottomSheet } from '../components/StaticBottomSheet';

const RootStack = createStackNavigator();
const BottomSheetNav = createBottomSheetNavigator();

const MainScreen = () => {
  const { navigate } = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView>
        <TouchableOpacity onPress={() => navigate('FullScreenSheetScreen')}>
          <Text>Open Full Screen Sheet</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('SnapPointsSheetScreen')}>
          <Text>Open Sheet With Snap Points</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('AdaptiveSheetScreen')}>
          <Text>Open Adaptive Sheet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigate('ScrollableFullScreenSheetScreen')}
        >
          <Text>Open Scrollable Full Screen Sheet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigate('ScrollableSnapPointsSheetScreen')}
        >
          <Text>Open Scrollable Snap Points Sheet</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const FullScreenSheetScreen = () => {
  return (
    <StaticBottomSheet>
      <View>
        <Text>Full Screen Sheet</Text>
      </View>
    </StaticBottomSheet>
  );
};

const SnapPointsSheetScreen = () => {
  return (
    <StaticBottomSheet snapPoints={['25%', '50%', '75%', '100%']}>
      <View>
        <Text>Snap Points Sheet</Text>
      </View>
    </StaticBottomSheet>
  );
};

const AdaptiveSheetScreen = () => {
  const [itemsNumber, setItemsNumber] = useState(10);

  return (
    <AdaptiveBottomSheet>
      <Text>Adaptive Sheet</Text>
      <TouchableOpacity
        onPress={() => setItemsNumber(i => (i === 10 ? 50 : 10))}
      >
        <Text>Change number of items</Text>
      </TouchableOpacity>
      {new Array(itemsNumber).fill(0).map((_, i) => (
        <Text key={i}>Item {i}</Text>
      ))}
    </AdaptiveBottomSheet>
  );
};

const ScrollableFullScreenSheetScreen = () => {
  return (
    <StaticBottomSheet scrollable>
      {new Array(100).fill(0).map((_, i) => (
        <Text key={i}>Scrollable Full Screen Sheet {i}</Text>
      ))}
    </StaticBottomSheet>
  );
};

const ScrollableSnapPointsSheetScreen = () => {
  return (
    <StaticBottomSheet scrollable snapPoints={['25%', '50%', '75%', '100%']}>
      {new Array(100).fill(0).map((_, i) => (
        <Text key={i}>Scrollable Snap Point Sheet {i}</Text>
      ))}
    </StaticBottomSheet>
  );
};

const MainStack = () => (
  <RootStack.Navigator initialRouteName="MAIN_SCREEN" headerMode="none">
    <RootStack.Screen component={MainScreen} name="MAIN_SCREEN" />
  </RootStack.Navigator>
);

export const Routes = () => {
  return (
    <BottomSheetNav.Navigator>
      <BottomSheetNav.Screen component={MainStack} name={'MAIN_STACK'} />
      <BottomSheetNav.Screen
        component={FullScreenSheetScreen}
        name={'FullScreenSheetScreen'}
      />
      <BottomSheetNav.Screen
        component={SnapPointsSheetScreen}
        name={'SnapPointsSheetScreen'}
      />
      <BottomSheetNav.Screen
        component={AdaptiveSheetScreen}
        name={'AdaptiveSheetScreen'}
      />
      <BottomSheetNav.Screen
        component={ScrollableFullScreenSheetScreen}
        name={'ScrollableFullScreenSheetScreen'}
      />
      <BottomSheetNav.Screen
        component={ScrollableSnapPointsSheetScreen}
        name={'ScrollableSnapPointsSheetScreen'}
      />
    </BottomSheetNav.Navigator>
  );
};
