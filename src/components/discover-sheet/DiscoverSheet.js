import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  findNodeHandle,
  NativeModules,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
// import {
//   useAnimatedScrollHandler,
//   useDerivedValue,
//   useSharedValue,
// } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import { SlackSheet } from '../sheet';
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
import DiscoverSheetHeader from './DiscoverSheetHeader';

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

function useAreHeaderButtonVisible() {
  const [isSearchModeEnabled, setIsSearchModeEnabled] = useState(false);
  return [{ isSearchModeEnabled, setIsSearchModeEnabled }, isSearchModeEnabled];
}

const DiscoverSheetAndroid = () => {
  const [headerButtonsHandlers, deps] = useAreHeaderButtonVisible();

  const value = useMemo(
    () => ({
      ...headerButtonsHandlers,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deps]
  );
  const bottomSheetModalRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '80%'], []);
  // const scrollHandler = useAnimatedScrollHandler(event => {
  //   console.log(event.contentOffset.y);
  // });
  //
  // const yPos = useSharedValue(0);
  // const y = useDerivedValue(() => {
  //   console.log(yPos.value);
  // });

  return (
    <DiscoverSheetContext.Provider value={value}>
      <ScrollView
        contentContainerStyle={{ height: '100.1%' }}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={StyleSheet.absoluteFillObject}
      >
        <BottomSheet
          activeOffsetY={[-0.5, 0.5]}
          // animatedPosition={yPos}
          animationDuration={300}
          failOffsetX={[-10, 10]}
          index={1}
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
        >
          <BottomSheetScrollView
          // onScroll={scrollHandler}
          >
            <DiscoverSheetContent />
            {/* placeholder for now */}
            <View style={{ backgroundColor: 'red', height: 400, width: 100 }} />
          </BottomSheetScrollView>
        </BottomSheet>
      </ScrollView>
    </DiscoverSheetContext.Provider>
  );
};

function DiscoverSheetIOS(_, forwardedRef) {
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
      jumpToLong() {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.ModalView.jumpTo(true, screen);
        }
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

  useImperativeHandle(forwardedRef, () => value);

  // noinspection JSConstructorReturnsPrimitive
  return (
    <DiscoverSheetContext.Provider value={value}>
      <SlackBottomSheet
        allowsDragToDismiss={false}
        allowsTapToDismiss={false}
        backgroundOpacity={0}
        blocksBackgroundTouches={false}
        cornerRadius={30}
        gestureEnabled={!headerButtonsHandlers.isSearchModeEnabled}
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
        <SlackSheet
          limitScrollViewContent={headerButtonsHandlers.isSearchModeEnabled}
          renderHeader={renderHeader}
          scrollEnabled={!headerButtonsHandlers.isSearchModeEnabled}
        >
          <DiscoverSheetContent />
        </SlackSheet>
      </SlackBottomSheet>
    </DiscoverSheetContext.Provider>
  );
}

export default ios ? forwardRef(DiscoverSheetIOS) : DiscoverSheetAndroid;
