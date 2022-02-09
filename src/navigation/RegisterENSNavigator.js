import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import ENSAssignRecordsSheet from '../screens/ENSAssignRecordsSheet';
import ENSSearchSheet from '../screens/ENSSearchSheet';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { sharedCoolModalTopOffset } from './config';
import { Box } from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { deviceUtils } from '@rainbow-me/utils';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;
const renderPager = props => (
  <ScrollPagerWrapper {...props} initialScrollPosition={1} />
);

export default function RegisterENSNavigator() {
  const { height: deviceHeight } = useDimensions();

  const extraTopPadding = android ? 10 : 0;
  const contentHeight =
    deviceHeight -
    SheetHandleFixedToTopHeight -
    sharedCoolModalTopOffset -
    extraTopPadding;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <SlackSheet
      removeTopPadding
      contentHeight={contentHeight}
      height="100%"
      scrollEnabled={false}
    >
      <Box
        style={{
          height: contentHeight,
        }}
      >
        <Swipe.Navigator
          initialLayout={deviceUtils.dimensions}
          initialRouteName={Routes.SEARCH_ENS_SHEET}
          pager={renderPager}
          swipeEnabled={false}
          tabBar={renderTabBar}
        >
          <Swipe.Screen
            component={ENSSearchSheet}
            name={Routes.ENS_SEARCH_SHEET}
          />
          <Swipe.Screen
            component={ENSAssignRecordsSheet}
            name={Routes.ENS_ASSIGN_RECORDS_SHEET}
          />
        </Swipe.Navigator>
      </Box>
    </SlackSheet>
  );
}
