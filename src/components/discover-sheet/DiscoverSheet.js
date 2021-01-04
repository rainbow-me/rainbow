import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import React, { useMemo, useRef } from 'react';
import { findNodeHandle, NativeModules, View } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
// eslint-disable-next-line import/no-unresolved
import SlackBottomSheet from 'react-native-slack-bottom-sheet';
import { SlackSheet } from '../sheet';
import DiscoverSheetContent from './DiscoverSheetContent';
import DiscoverSheetContext from './DiscoverSheetContext';
import DiscoverSheetHeader from './DiscoverSheetHeader';

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

const DiscoverSheetAndroid = () => {
  const bottomSheetModalRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '80%'], []);

  return (
    <BottomSheet index={1} ref={bottomSheetModalRef} snapPoints={snapPoints}>
      <BottomSheetScrollView>
        <DiscoverSheetContent />
        {/* placeholder for now */}
        <View style={{ backgroundColor: 'red', height: 400, width: 100 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

function DiscoverSheetIOS() {
  const insets = useSafeArea();
  const isFocused = useIsFocused();
  const ref = useRef();
  const listeners = useRef([]);
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
    }),
    []
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
