import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import lang from 'i18n-js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, StatusBar } from 'react-native';
import { useSetRecoilState } from 'recoil';
import ButtonPressAnimation from '../components/animations/ButtonPressAnimation';
import { Icon } from '../components/icons';
import {
  CurrencySettingsSheet,
  SettingsSection,
} from '../components/settings-menu';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import { sharedCoolModalTopOffset } from './config';
import { avatarMetadataAtom } from '@/components/ens-registration/RegistrationAvatar/RegistrationAvatar';
import { Box, Inline, Text } from '@rainbow-me/design-system';
import { accentColorAtom } from '@rainbow-me/helpers/ens';
import { useDimensions, usePrevious } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';
import { deviceUtils } from '@rainbow-me/utils';
import { useNavigation } from '@rainbow-me/navigation';

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
  [Routes.SETTINGS_SECTION]: {
    scrollEnabled: true,
    useAccentAsSheetBackground: false,
  },
  [Routes.CURRENCY_SETTINGS_SHEET]: {
    scrollEnabled: true,
    useAccentAsSheetBackground: false,
  },
};

export default function SettingsNavigator() {
  const sheetRef = useRef<any>();
  const { navigate } = useNavigation();
  const { height: deviceHeight, isSmallPhone } = useDimensions();

  const setAccentColor = useSetRecoilState(accentColorAtom);
  const setAvatarMetadata = useSetRecoilState(avatarMetadataAtom);

  const { colors } = useTheme();

  const contentHeight =
    deviceHeight -
    SheetHandleFixedToTopHeight -
    (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  const [label, setLabel] = useState('Settings');

  const initialRouteName = Routes.SETTINGS_SECTION;
  const [currentRouteName, setCurrentRouteName] = useState(initialRouteName);
  const previousRouteName = usePrevious(currentRouteName);

  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(
    contentHeight
  );

  const screenOptions = useMemo(() => defaultScreenOptions[currentRouteName], [
    currentRouteName,
  ]);

  useEffect(() => {
    if (screenOptions.scrollEnabled) {
      setTimeout(() => setWrapperHeight(undefined), 200);
      return;
    }
    setWrapperHeight(contentHeight);
  }, [contentHeight, screenOptions.scrollEnabled]);

  useEffect(() => {
    if (!screenOptions.scrollEnabled) {
      sheetRef.current?.scrollTo({ animated: false, x: 0, y: 0 });
    }
  }, [screenOptions.scrollEnabled]);

  const renderHeader = useCallback(
    () => (
      <Box
        background="cardBackdrop"
        height={{ custom: 58 }}
        justifyContent="center"
        width="full"
      >
        <Inline alignHorizontal="justify" alignVertical="center">
          <Box paddingLeft="19px" width={{ custom: 100 }}>
            {currentRouteName !== Routes.SETTINGS_SECTION && (
              <ButtonPressAnimation onPress={() => navigate(previousRouteName)}>
                <Icon color={colors.appleBlue} direction="left" name="caret" />
              </ButtonPressAnimation>
            )}
          </Box>
          <Text size="18px" weight="heavy">
            {label}
          </Text>
          <Box
            alignItems="flex-end"
            paddingRight="19px"
            width={{ custom: 100 }}
          >
            <ButtonPressAnimation>
              <Text
                color={{ custom: colors.appleBlue }}
                size="18px"
                weight="medium"
              >
                {lang.t('settings.done')}
              </Text>
            </ButtonPressAnimation>
          </Box>
        </Inline>
      </Box>
    ),
    [colors.appleBlue, currentRouteName, label]
  );

  return (
    <SlackSheet
      additionalTopPadding={android ? StatusBar.currentHeight : false}
      contentHeight={contentHeight}
      height="100%"
      hideHandle
      ref={sheetRef}
      removeTopPadding
      renderHeader={renderHeader}
      scrollEnabled
    >
      <StatusBar barStyle="light-content" />
      <Box
        background="cardBackdrop"
        flexGrow={1}
        style={{
          height: wrapperHeight,
          overflow: 'hidden',
        }}
        testID="settings-sheet"
        {...(android && { borderTopRadius: 30, marginTop: { custom: 8 } })}
      >
        <Swipe.Navigator
          initialLayout={deviceUtils.dimensions}
          initialRouteName={Routes.SETTINGS_SECTION}
          pager={renderPager}
          swipeEnabled={false}
          tabBar={renderTabBar}
        >
          <Swipe.Screen
            component={SettingsSection}
            initialParams={{
              contentHeight,
            }}
            listeners={{
              focus: () => {
                setCurrentRouteName(Routes.SETTINGS_SECTION);
              },
            }}
            name={Routes.SETTINGS_SECTION}
          />
          <Swipe.Screen
            component={CurrencySettingsSheet}
            initialParams={{
              contentHeight,
            }}
            listeners={{
              focus: () => {
                setCurrentRouteName(Routes.CURRENCY_SETTINGS_SHEET);
              },
            }}
            name={Routes.CURRENCY_SETTINGS_SHEET}
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
      </Box>
    </SlackSheet>
  );
}
