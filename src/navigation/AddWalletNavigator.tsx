import { useRoute } from '@react-navigation/core';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StatusBar } from 'react-native';
import { useSetRecoilState } from 'recoil';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import ENSAssignRecordsSheet, {
  ENSAssignRecordsBottomActions,
} from '../screens/ENSAssignRecordsSheet';
import ENSIntroSheet from '../screens/ENSIntroSheet';
import ENSSearchSheet from '../screens/ENSSearchSheet';
import ScrollPagerWrapper from './ScrollPagerWrapper';
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
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';
import { IS_ANDROID, IS_IOS } from '@/env';
import { AddFirstWalletSheet } from '@/screens/AddFirstWalletSheet';
import RestoreFromCloudSheet from '@/screens/RestoreFromCloudSheet';
import ImportSeedPhraseSheet from '@/screens/ImportSeedPhraseSheet';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;
const renderPager = (props: any) => (
  <ScrollPagerWrapper
    {...props}
    {...(android && {
      style: { height: Dimensions.get('window').height },
    })}
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

export const AddWalletNavigator = () => {
  const {
    params: { userData },
  } = useRoute<any>();

  const { setParams } = useNavigation();

  const sheetRef = useRef<any>();

  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const setAccentColor = useSetRecoilState(accentColorAtom);
  const setAvatarMetadata = useSetRecoilState(avatarMetadataAtom);

  const { colors } = useTheme();

  const [sheetHeight, setSheetHeight] = useState(0);
  const [currentScreenHeight, setCurrentScreenHeight] = useState(0);

  const contentHeight =
    deviceHeight -
    SheetHandleFixedToTopHeight -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const [isSearchEnabled, setIsSearchEnabled] = useState(true);

  const { clearValues } = useENSRegistrationForm();

  const initialRouteName = Routes.ADD_FIRST_WALLET_SHEET;
  const [currentRouteName, setCurrentRouteName] = useState(initialRouteName);
  const previousRouteName = usePrevious(currentRouteName);

  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(
    contentHeight
  );

  // const screenOptions = useMemo(() => defaultScreenOptions[currentRouteName], [
  //   currentRouteName,
  // ]);

  const enableAssignRecordsBottomActions =
    currentRouteName !== Routes.ENS_INTRO_SHEET;
  const isBottomActionsVisible =
    currentRouteName === Routes.ENS_ASSIGN_RECORDS_SHEET;

  // useEffect(() => {
  //   if (screenOptions.scrollEnabled) {
  //     setTimeout(() => setWrapperHeight(undefined), 200);
  //     return;
  //   }
  //   setWrapperHeight(contentHeight);
  // }, [contentHeight, screenOptions.scrollEnabled]);

  useEffect(() => setParams({ sheetHeight }), [sheetHeight, setParams]);

  console.log(sheetHeight);
  return (
    <SlackSheet
      additionalTopPadding={android ? StatusBar.currentHeight : false}
      contentHeight={sheetHeight}
      backgroundColor={'#fff'}
      height={IS_IOS ? '100%' : sheetHeight}
      ref={sheetRef}
      removeTopPadding
      deferredHeight={IS_ANDROID}
      scrollEnabled={false}
    >
      <Swipe.Navigator
        initialLayout={deviceUtils.dimensions}
        initialRouteName={Routes.ADD_FIRST_WALLET_SHEET}
        pager={renderPager}
        swipeEnabled={false}
        tabBar={renderTabBar}
      >
        <Swipe.Screen
          component={AddFirstWalletSheet}
          initialParams={{
            userData,

            // contentHeight,
            // onSearchForNewName: () => setIsSearchEnabled(true),
            // onSelectExistingName: () => setIsSearchEnabled(false),
          }}
          listeners={{
            focus: () => {
              setCurrentRouteName(Routes.ADD_FIRST_WALLET_SHEET);
              setSheetHeight(500);
            },
          }}
          name={Routes.ADD_FIRST_WALLET_SHEET}
        />
        <Swipe.Screen
          component={RestoreFromCloudSheet}
          initialParams={{
            userData,

            // contentHeight,
            // onSearchForNewName: () => setIsSearchEnabled(true),
            // onSelectExistingName: () => setIsSearchEnabled(false),
          }}
          listeners={{
            focus: () => {
              setCurrentRouteName(Routes.RESTORE_FROM_CLOUD_SHEET);
              setSheetHeight(deviceHeight);
            },
          }}
          name={Routes.RESTORE_FROM_CLOUD_SHEET}
        />
        <Swipe.Screen
          component={ImportSeedPhraseSheet}
          initialParams={{
            userData,

            // contentHeight,
            // onSearchForNewName: () => setIsSearchEnabled(true),
            // onSelectExistingName: () => setIsSearchEnabled(false),
          }}
          listeners={{
            focus: () => {
              setCurrentRouteName(Routes.IMPORT_SEED_PHRASE_SHEET);
              setSheetHeight(deviceHeight);
            },
          }}
          name={Routes.IMPORT_SEED_PHRASE_SHEET}
        />
        {/* {isSearchEnabled && (
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
        /> */}
      </Swipe.Navigator>
    </SlackSheet>
  );
};
