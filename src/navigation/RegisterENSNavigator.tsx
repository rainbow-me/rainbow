import { useRoute } from '@react-navigation/native';
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
import { sharedCoolModalTopOffset } from './config';
import { avatarMetadataAtom } from '@/components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { Box } from '@/design-system';
import { accentColorAtom, REGISTRATION_MODES } from '@/helpers/ens';
import {
  useDimensions,
  useENSRegistration,
  useENSRegistrationForm,
  usePrevious,
} from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

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
  // TODO needed to add this but should check if this config is ok
  [Routes.ENS_CONFIRM_REGISTER_SHEET]: {
    scrollEnabled: true,
    useAccentAsSheetBackground: false,
  },
};

export default function RegisterENSNavigator() {
  const { params } = useRoute<any>();

  const sheetRef = useRef<any>();

  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const setAccentColor = useSetRecoilState(accentColorAtom);
  const setAvatarMetadata = useSetRecoilState(avatarMetadataAtom);

  const { colors } = useTheme();

  const contentHeight =
    deviceHeight -
    SheetHandleFixedToTopHeight -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

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
      startRegistration(ensName, REGISTRATION_MODES.EDIT);
      return Routes.ENS_ASSIGN_RECORDS_SHEET;
    }
    if (mode === REGISTRATION_MODES.SET_NAME) {
      startRegistration(ensName, REGISTRATION_MODES.SET_NAME);
      return Routes.ENS_CONFIRM_REGISTER_SHEET;
    }
    if (mode === REGISTRATION_MODES.SEARCH) {
      startRegistration('', mode);
      return Routes.ENS_SEARCH_SHEET;
    }
    return Routes.ENS_INTRO_SHEET;
  }, [params, startRegistration]);
  const [currentRouteName, setCurrentRouteName] = useState(initialRouteName);
  const previousRouteName = usePrevious(currentRouteName);

  const screenOptions = useMemo(() => defaultScreenOptions[currentRouteName], [
    currentRouteName,
  ]);

  useEffect(
    () => () => {
      clearCurrentRegistrationName();
    },
    [clearCurrentRegistrationName]
  );

  useEffect(
    () => () => {
      removeRecordByKey('avatar');
      setAvatarMetadata(undefined);
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
      setAvatarMetadata,
    ]
  );

  const enableAssignRecordsBottomActions =
    currentRouteName !== Routes.ENS_INTRO_SHEET;
  const isBottomActionsVisible =
    currentRouteName === Routes.ENS_ASSIGN_RECORDS_SHEET;

  useEffect(() => {
    if (!screenOptions.scrollEnabled) {
      sheetRef.current?.scrollTo({ animated: false, x: 0, y: 0 });
    }
  }, [screenOptions.scrollEnabled]);

  return (
    <>
      {/* @ts-expect-error JavaScript component */}
      <SlackSheet
        additionalTopPadding={android ? StatusBar.currentHeight : false}
        contentHeight={contentHeight}
        height="100%"
        ref={sheetRef}
        removeTopPadding
        scrollEnabled
      >
        <Box
          style={{
            height: contentHeight,
            overflow: 'hidden',
          }}
        >
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={currentRouteName}
            tabBar={renderTabBar}
            screenOptions={{ swipeEnabled: false }}
          >
            <Swipe.Screen
              component={ENSIntroSheet}
              initialParams={{
                contentHeight,
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
              />
            )}
            <Swipe.Screen
              component={ENSAssignRecordsSheet}
              initialParams={{
                autoFocusKey: params?.autoFocusKey,
                mode: params?.mode,
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
