import { useRoute } from '@react-navigation/core';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { useSetRecoilState } from 'recoil';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import ENSAssignRecordsSheet, {
  ENSAssignRecordsBottomActions,
} from '../screens/ENSAssignRecordsSheet';
import ENSIntroSheet from '../screens/ENSIntroSheet';
import ENSSearchSheet from '../screens/ENSSearchSheet';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { sharedCoolModalTopOffset } from './config';
import { useTheme } from '@rainbow-me/context';
import { Box } from '@rainbow-me/design-system';
import { accentColorAtom, REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import {
  useDimensions,
  useENSRegistration,
  useENSRegistrationForm,
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
  [Routes.ENS_INTRO_SHEET]: {
    scrollEnabled: false,
    useAccentAsSheetBackground: false,
  },
  [Routes.ENS_SEARCH_SHEET]: {
    scrollEnabled: true,
    useAccentAsSheetBackground: false,
  },
};

export default function RegisterENSNavigator() {
  const { params } = useRoute();

  const sheetRef = useRef();

  const { height: deviceHeight } = useDimensions();

  const setAccentColor = useSetRecoilState(accentColorAtom);

  const { colors } = useTheme();

  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  const [isSearchEnabled, setIsSearchEnabled] = useState(true);

  const { clearValues } = useENSRegistrationForm();

  const {
    removeRecordByKey,
    clearCurrentRegistrationName,
    startRegistration,
  } = useENSRegistration();

  const initialRouteName = useMemo(() => {
    const { ensName, mode } = params || { mode: REGISTRATION_MODES.CREATE };
    if (mode === REGISTRATION_MODES.EDIT) {
      startRegistration(ensName, mode);
      return Routes.ENS_ASSIGN_RECORDS_SHEET;
    }
    if (mode === REGISTRATION_MODES.SET_NAME) {
      startRegistration(ensName, mode);
      return Routes.ENS_CONFIRM_REGISTER_SHEET;
    }
    return Routes.ENS_INTRO_SHEET;
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

  useEffect(() => () => clearCurrentRegistrationName(), [
    clearCurrentRegistrationName,
  ]);

  useEffect(() => {
    if (!screenOptions.scrollEnabled) {
      sheetRef.current.scrollTo({ animated: false, x: 0, y: 0 });
    }
  }, [screenOptions.scrollEnabled]);

  useEffect(
    () => () => {
      removeRecordByKey('avatar');
      setAccentColor(colors.purple);
      clearValues();
      clearCurrentRegistrationName();
    },
    [
      clearCurrentRegistrationName,
      clearValues,
      colors.purple,
      removeRecordByKey,
      setAccentColor,
    ]
  );

  const enableAssignRecordsBottomActions =
    currentRouteName !== Routes.ENS_INTRO_SHEET;
  const isBottomActionsVisible =
    currentRouteName === Routes.ENS_ASSIGN_RECORDS_SHEET;

  const wrapperStyle = useMemo(
    () => (!scrollEnabled ? { height: contentHeight } : {}),
    [contentHeight, scrollEnabled]
  );

  return (
    <>
      <SlackSheet
        contentHeight={contentHeight}
        height="100%"
        ref={sheetRef}
        removeTopPadding
        scrollEnabled
      >
        <StatusBar barStyle="light-content" />
        <Box style={wrapperStyle}>
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={currentRouteName}
            pager={renderPager}
            swipeEnabled={false}
            tabBar={renderTabBar}
          >
            <Swipe.Screen
              component={ENSIntroSheet}
              initialParams={{
                onSearchForNewName: () => setIsSearchEnabled(true),
                onSelectExistingName: () => setIsSearchEnabled(false),
              }}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.ENS_INTRO_SHEET);
                },
              }}
              name={Routes.ENS_INTRO_SHEET}
            />
            {isSearchEnabled && (
              <Swipe.Screen
                component={ENSSearchSheet}
                listeners={{
                  focus: () => setCurrentRouteName(Routes.ENS_SEARCH_SHEET),
                }}
                name={Routes.ENS_SEARCH_SHEET}
                visible={isSearchEnabled}
              />
            )}
            <Swipe.Screen
              component={ENSAssignRecordsSheet}
              initialParams={{
                autoFocusKey: params?.autoFocusKey,
                sheetRef,
              }}
              listeners={{
                focus: () => {
                  setCurrentRouteName(Routes.ENS_ASSIGN_RECORDS_SHEET);
                },
              }}
              name={Routes.ENS_ASSIGN_RECORDS_SHEET}
            />
          </Swipe.Navigator>
        </Box>
      </SlackSheet>

      {/**
       * The `ENSAssignRecordsBottomActions` is a component that is external from the ENS navigator and only
       * appears when the ENSAssignRecordsSheet is active.
       * The reason why is because we can't achieve fixed positioning (as per designs) within SlackSheet's
       * ScrollView, so this seems like the best workaround.
       */}
      {enableAssignRecordsBottomActions && (
        <ENSAssignRecordsBottomActions
          currentRouteName={currentRouteName}
          previousRouteName={previousRouteName}
          visible={isBottomActionsVisible}
        />
      )}
    </>
  );
}
