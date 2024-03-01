import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Keyboard, View, ViewStyle } from 'react-native';
import { isKeyboardOpen } from '../../../helpers';
import { CONTAINER_HEIGHT, DEFAULT_BACKDROP_COLOR, DEFAULT_BACKDROP_OPACITY, DEFAULT_HEIGHT } from '../constants';
import { BottomSheetNavigatorContext } from '../contexts/internal';
import type { BottomSheetDescriptor } from '../types';

interface Props {
  routeKey: string;
  descriptor: BottomSheetDescriptor;
  removing?: boolean;
  onDismiss: (key: string, removed: boolean) => void;
}

const BottomSheetRoute = ({ routeKey, descriptor: { options, render, navigation }, onDismiss, removing = false }: Props) => {
  // #region extract options
  const {
    enableContentPanningGesture,
    enableHandlePanningGesture,
    index = 0,
    snapPoints = ['100%'],
    backdropColor = DEFAULT_BACKDROP_COLOR,
    backdropOpacity = DEFAULT_BACKDROP_OPACITY,
    backdropPressBehavior = 'close',
    height = DEFAULT_HEIGHT,
    offsetY = android ? 20 : 3,
  } = options || {};
  // #endregion

  // #region refs
  const ref = useRef<BottomSheet>(null);

  const removingRef = useRef(false);
  removingRef.current = removing;

  // const
  // #endregion

  // #region styles
  // @ts-ignore type mismatch
  const screenContainerStyle: ViewStyle = useMemo(
    () => ({
      bottom: 0,
      height,
      position: 'absolute',
      width: '100%',
    }),
    [height]
  );

  const backdropStyle = useMemo(
    () => ({
      backgroundColor: backdropColor,
    }),
    [backdropColor]
  );
  // #endregion

  // #region context methods
  const handleSettingSnapPoints = useCallback(
    (_snapPoints: (string | number)[]) => {
      navigation.setOptions({ snapPoints: _snapPoints });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleSettingEnableContentPanningGesture = useCallback(
    (value: boolean) => {
      navigation.setOptions({ enableContentPanningGesture: value });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleSettingEnableHandlePanningGesture = useCallback(
    (value: boolean) => {
      navigation.setOptions({ enableHandlePanningGesture: value });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const contextVariables = useMemo(
    () => ({
      setEnableContentPanningGesture: handleSettingEnableContentPanningGesture,
      setEnableHandlePanningGesture: handleSettingEnableHandlePanningGesture,
      setSnapPoints: handleSettingSnapPoints,
    }),
    [handleSettingEnableContentPanningGesture, handleSettingEnableHandlePanningGesture, handleSettingSnapPoints]
  );
  // #endregion

  // #region callbacks
  const handleOnClose = useCallback(() => {
    onDismiss(routeKey, removingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // #endregion

  // #region effects
  useEffect(() => {
    if (removing === true && ref.current) {
      // close keyboard before closing the modal
      if (isKeyboardOpen() && android) {
        Keyboard.dismiss();

        ref.current.close();
      } else {
        ref.current.close();
      }
    }
  }, [removing]);
  // #endregion

  // #region renders
  const renderBackdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={backdropOpacity}
        style={backdropStyle}
        pressBehavior={backdropPressBehavior}
        {...props}
      />
    ),
    [backdropOpacity, backdropStyle]
  );

  return (
    <BottomSheetNavigatorContext.Provider value={contextVariables}>
      <BottomSheet
        activeOffsetY={[-offsetY, offsetY]}
        animateOnMount
        backdropComponent={renderBackdropComponent}
        backgroundComponent={null}
        containerHeight={CONTAINER_HEIGHT}
        enableContentPanningGesture={enableContentPanningGesture}
        enableHandlePanningGesture={enableHandlePanningGesture}
        enablePanDownToClose
        handleComponent={null}
        index={index}
        onClose={handleOnClose}
        ref={ref}
        simultaneousHandlers={[]}
        snapPoints={snapPoints}
        waitFor={[]}
      >
        <View style={screenContainerStyle}>{render()}</View>
      </BottomSheet>
    </BottomSheetNavigatorContext.Provider>
  );
};

export default BottomSheetRoute;
