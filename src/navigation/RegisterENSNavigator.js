import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useIsFocused } from '@react-navigation/native';
import ConditionalWrap from 'conditional-wrap';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'react-native';
import { atom, useRecoilState, useSetRecoilState } from 'recoil';
import { SheetHandleFixedToTopHeight, SlackSheet } from '../components/sheet';
import ENSAssignRecordsSheet, {
  accentColorAtom,
  ENSAssignRecordsBottomActions,
} from '../screens/ENSAssignRecordsSheet';
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

const scrollEnabledAtom = atom({
  default: false,
  key: 'ensNavigator.scrollEnabled',
});

const isAssignRecordsScreenAtom = atom({
  default: false,
  key: 'ensNavigator.isAssignRecordsScreen',
});

export default function RegisterENSNavigator() {
  const sheetRef = useRef();

  const { height: deviceHeight } = useDimensions();

  const [scrollEnabled] = useRecoilState(scrollEnabledAtom);
  const [delayedScrollEnabled, setDelayedScrollEnabled] = useState(
    scrollEnabled
  );
  useEffect(() => {
    // Wait 200ms to prevent transition lag
    setTimeout(() => {
      setDelayedScrollEnabled(scrollEnabled);
    }, 200);
  }, [scrollEnabled]);

  const [isAssignRecordsScreen] = useRecoilState(isAssignRecordsScreenAtom);
  const [accentColor] = useRecoilState(accentColorAtom);

  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  useEffect(() => {
    if (!scrollEnabled) {
      sheetRef.current.scrollTo({ animated: false, x: 0, y: 0 });
    }
  }, [scrollEnabled, isAssignRecordsScreen]);

  return (
    <>
      <SlackSheet
        backgroundColor={isAssignRecordsScreen ? accentColor : 'white'}
        contentHeight={contentHeight}
        height="100%"
        ref={sheetRef}
        removeTopPadding
        scrollEnabled={delayedScrollEnabled}
      >
        <ConditionalWrap
          condition={!delayedScrollEnabled}
          wrap={children => (
            <Box style={{ height: contentHeight }}>{children}</Box>
          )}
        >
          <Swipe.Navigator
            initialLayout={deviceUtils.dimensions}
            initialRouteName={Routes.ENS_SEARCH_SHEET}
            pager={renderPager}
            swipeEnabled={false}
            tabBar={renderTabBar}
          >
            <Swipe.Screen
              component={ENSSearchSheetWrapper}
              name={Routes.ENS_SEARCH_SHEET}
            />
            <Swipe.Screen
              component={ENSAssignRecordsSheetWrapper}
              name={Routes.ENS_ASSIGN_RECORDS_SHEET}
            />
          </Swipe.Navigator>
        </ConditionalWrap>
      </SlackSheet>
      <ENSAssignRecordsBottomActions visible={isAssignRecordsScreen} />
    </>
  );
}

function ENSSearchSheetWrapper() {
  const setScrollEnabled = useSetRecoilState(scrollEnabledAtom);
  const setIsAssignRecordsScreen = useSetRecoilState(isAssignRecordsScreenAtom);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setIsAssignRecordsScreen(false);
      setScrollEnabled(false);
    } else {
      setScrollEnabled(true);
    }
  }, [isFocused, setScrollEnabled, setIsAssignRecordsScreen]);

  return <ENSSearchSheet />;
}

function ENSAssignRecordsSheetWrapper() {
  const setIsAssignRecordsScreen = useSetRecoilState(isAssignRecordsScreenAtom);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setIsAssignRecordsScreen(true);
    }
  }, [isFocused, setIsAssignRecordsScreen]);

  return <ENSAssignRecordsSheet />;
}
