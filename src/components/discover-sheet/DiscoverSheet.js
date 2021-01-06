import { useIsFocused } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import { findNodeHandle, NativeModules, StyleSheet } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import { SlackSheet } from '../sheet';
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import { deviceUtils } from '@rainbow-me/utils';
import {
  YABSForm,
  YABSScrollView,
} from 'react-native-yet-another-bottom-sheet';
const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

function useAreHeaderButtonVisible() {
  const [isBackButtonVisible, setIsBackButtonVisible] = useState(true);
  return [{ isBackButtonVisible, setIsBackButtonVisible }, isBackButtonVisible];
}

function DiscoverSheetAndroid() {
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();

  const value = useMemo(
    () => ({
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );
  return (
    <DiscoverSheetContext.Provider value={value}>
      <YABSForm
        panGHProps={{
          maxPointers: 17, // magic number for duck typing on native side
          simultaneousHandlers: 'AnimatedScrollViewPager',
        }}
        points={[0, 200, deviceUtils.dimensions.height - 200]}
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: 'white',
            bottom: 0,
            top: 100,
          },
        ]}
      >
        <YABSScrollView style={{ flex: 1, height: '100%' }}>
          <DiscoverSheetContent />
        </YABSScrollView>
      </YABSForm>
    </DiscoverSheetContext.Provider>
  );
}

function DiscoverSheetIOS() {
  const insets = useSafeArea();
  const isFocused = useIsFocused();
  const ref = useRef();
  const listeners = useRef([]);
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();
  const value = useMemo(
    () => ({
      addOnCrossMagicBorderListener(listener) {
        listeners.current.push(listener);
        const index = listeners.current.length - 1;
        return () => listeners.current.splice(index, 1);
      },
      jumpToShort() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.ModalView.jumpTo(false, screen);
        }
      },
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );

  // noinspection JSConstructorReturnsPrimitive
  return (
    <DiscoverSheetContext.Provider value={value}>
      <SlackBottomSheet
        allowsDragToDismiss={false}
        allowsTapToDismiss={false}
        backgroundOpacity={0}
        blocksBackgroundTouches={false}
        cornerRadius={30}
        initialAnimation={false}
        interactsWithOuterScrollView
        isHapticFeedbackEnabled={false}
        onCrossMagicBorder={({ nativeEvent }) =>
          listeners.current.forEach(listener => listener(nativeEvent))
        }
        presentGlobally={false}
        ref={ref}
        scrollsToTopOnTapStatusBar={isFocused}
        showDragIndicator={false}
        topOffset={insets.top}
        unmountAnimation={false}
      >
        <SlackSheet renderHeader={renderHeader}>
          <DiscoverSheetContent />
        </SlackSheet>
      </SlackBottomSheet>
    </DiscoverSheetContext.Provider>
  );
}

export default ios ? DiscoverSheetIOS : DiscoverSheetAndroid;
