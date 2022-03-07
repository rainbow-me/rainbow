import { useRoute } from '@react-navigation/core';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ConditionalWrap from 'conditional-wrap';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import ENSAssignRecordsSheet, {
  ENSAssignRecordsBottomActions,
} from '../screens/ENSAssignRecordsSheet';
import ENSSearchSheet from '../screens/ENSSearchSheet';
import { useNavigation } from './Navigation';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { sharedCoolModalTopOffset } from './config';
import { Box } from '@rainbow-me/design-system';
import {
  useDimensions,
  useENSRegistration,
  usePrevious,
} from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { deviceUtils } from '@rainbow-me/utils';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;
const renderPager = props => (
  <ScrollPagerWrapper
    {...props}
    initialScrollPosition={1}
    useViewPagerAdaptor={false}
  />
);

const defaultScreenOptions = {
  [Routes.ENS_ASSIGN_RECORDS_SHEET]: {
    scrollEnabled: true,
    useAccentAsSheetBackground: true,
  },
  [Routes.ENS_SEARCH_SHEET]: {
    scrollEnabled: false,
    useAccentAsSheetBackground: false,
  },
};

export default function RegisterENSNavigator() {
  const { params } = useRoute();
  const navigation = useNavigation();

  const sheetRef = useRef();

  const { height: deviceHeight } = useDimensions();

  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  const {
    startRegistration,
    clearCurrentRegistrationName,
  } = useENSRegistration();

  const initialRouteName = useMemo(() => {
    const { ensName, mode } = params || { mode: 'create' };
    if (mode === 'edit') {
      startRegistration(ensName, mode);
      return Routes.ENS_ASSIGN_RECORDS_SHEET;
    }
    return Routes.ENS_SEARCH_SHEET;
  }, [params, startRegistration]);
  const [currentRouteName, setCurrentRouteName] = useState(initialRouteName);
  const previousRouteName = usePrevious(currentRouteName);

  const screenOptions = useMemo(() => defaultScreenOptions[currentRouteName], [
    currentRouteName,
  ]);

  const [scrollEnabled, setScrollEnabled] = useState(
    screenOptions.scrollEnabled
  );
  useEffect(() => {
    if (previousRouteName) {
      // Wait 500ms to prevent transition lag
      setTimeout(() => {
        setScrollEnabled(screenOptions.scrollEnabled);
      }, 500);
    }
  }, [previousRouteName, screenOptions.scrollEnabled]);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  useEffect(() => {
    if (!screenOptions.scrollEnabled) {
      sheetRef.current.scrollTo({ animated: false, x: 0, y: 0 });
    }
  }, [screenOptions.scrollEnabled]);

  useEffect(() => {
    navigation.addListener('dismiss', clearCurrentRegistrationName);
    return () =>
      navigation.removeListener('dismiss', clearCurrentRegistrationName);
  });

  const isBottomActionsVisible =
    currentRouteName === Routes.ENS_ASSIGN_RECORDS_SHEET;

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  return (
    <>
      <SlackSheet
        contentHeight={contentHeight}
        height="100%"
        ref={sheetRef}
        removeTopPadding
        scrollEnabled={scrollEnabled}
      >
        <ConditionalWrap
          condition={!scrollEnabled}
          wrap={children => <Box style={wrapperStyle}>{children}</Box>}
        >
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={currentRouteName}
            pager={renderPager}
            swipeEnabled={false}
            tabBar={renderTabBar}
          >
            <Swipe.Screen
              component={ENSSearchSheet}
              listeners={{
                focus: () => setCurrentRouteName(Routes.ENS_SEARCH_SHEET),
              }}
              name={Routes.ENS_SEARCH_SHEET}
            />
            <Swipe.Screen
              component={ENSAssignRecordsSheet}
              initialParams={{
                autoFocusKey: params.autoFocusKey,
                sheetRef,
              }}
              listeners={{
                focus: () =>
                  setCurrentRouteName(Routes.ENS_ASSIGN_RECORDS_SHEET),
              }}
              name={Routes.ENS_ASSIGN_RECORDS_SHEET}
            />
          </Swipe.Navigator>
        </ConditionalWrap>
      </SlackSheet>

      {/**
       * The `ENSAssignRecordsBottomActions` is a component that is external from the ENS navigator and only
       * appears when the ENSAssignRecordsSheet is active.
       * The reason why is because we can't achieve fixed positioning (as per designs) within SlackSheet's
       * ScrollView, so this seems like the best workaround.
       */}
      <ENSAssignRecordsBottomActions visible={isBottomActionsVisible} />
    </>
  );
}
