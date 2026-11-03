import React, { useEffect, useMemo, useRef, useState } from 'react';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useSetRecoilState } from 'recoil';

import { SlackSheet } from '@/components/sheet';
import { Box } from '@/design-system';
import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import useDimensions from '@/hooks/useDimensions';
import usePrevious from '@/hooks/usePrevious';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { deviceUtils } from '@/utils/deviceUtils';

import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { ENSAssignRecordsBottomActions, ENSAssignRecordsSheet } from '../screens/ENSAssignRecordsSheet';
import { ENSIntroSheet } from '../screens/ENSIntroSheet';
import { ENSSearchSheet } from '../screens/ENSSearchSheet';
import { accentColorAtom } from '../utils/helpers';

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

export type ENSRoutes = keyof typeof defaultScreenOptions;

export function RegisterENSNavigator() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.REGISTER_ENS_NAVIGATOR>>();

  const sheetRef = useRef<any>(undefined);

  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const setAccentColor = useSetRecoilState(accentColorAtom);

  const { colors } = useTheme();

  const contentHeight = deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const [isSearchEnabled, setIsSearchEnabled] = useState(true);

  const accountAddress = useAccountAddress();

  const initialRouteName = useMemo(() => {
    const { ensName, mode } = params || { mode: REGISTRATION_MODES.CREATE };
    if (ensName && mode === REGISTRATION_MODES.EDIT) {
      useEnsRegistrationStore.getState().start(accountAddress, ensName, REGISTRATION_MODES.EDIT);
      return Routes.ENS_ASSIGN_RECORDS_SHEET;
    }
    if (ensName && mode === REGISTRATION_MODES.SET_NAME) {
      useEnsRegistrationStore.getState().start(accountAddress, ensName, REGISTRATION_MODES.SET_NAME);
      return Routes.ENS_CONFIRM_REGISTER_SHEET;
    }
    if (mode === REGISTRATION_MODES.SEARCH) {
      useEnsRegistrationStore.getState().start(accountAddress, '', mode);
      return Routes.ENS_SEARCH_SHEET;
    }
    return Routes.ENS_INTRO_SHEET;
  }, [params, accountAddress]);
  const [currentRouteName, setCurrentRouteName] = useState(initialRouteName);
  const previousRouteName = usePrevious(currentRouteName);

  const screenOptions = useMemo(() => defaultScreenOptions[currentRouteName], [currentRouteName]);

  useEffect(
    () => () => {
      useEnsRegistrationStore.getState().clear();
    },
    []
  );

  useEffect(
    () => () => {
      setAccentColor(colors.purple);
    },
    [colors.purple, setAccentColor]
  );

  const enableAssignRecordsBottomActions = currentRouteName !== Routes.ENS_INTRO_SHEET;
  const isBottomActionsVisible = currentRouteName === Routes.ENS_ASSIGN_RECORDS_SHEET;

  useEffect(() => {
    if (!screenOptions.scrollEnabled) {
      sheetRef.current?.scrollTo({ animated: false, x: 0, y: 0 });
    }
  }, [screenOptions.scrollEnabled]);

  return (
    <>
      <SlackSheet additionalTopPadding contentHeight={contentHeight} height="100%" ref={sheetRef} removeTopPadding scrollEnabled>
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
