import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ViewStyle } from 'react-native';
import { View } from 'react-native';
import {
  CONTAINER_HEIGHT,
  DEFAULT_ANIMATION_DURATION,
  DEFAULT_BACKDROP_COLOR,
  DEFAULT_BACKDROP_OPACITY,
  DEFAULT_HEIGHT,
} from '../constants';
import { BottomSheetNavigatorContext } from '../contexts/internal';
// eslint-disable-next-line import/no-unresolved
import type { BottomSheetDescriptor } from '../types';

interface Props {
  routeKey: string;
  descriptor: BottomSheetDescriptor;
  removing?: boolean;
  onDismiss: (key: string, removed: boolean) => void;
}

const BottomSheetRoute = ({
  routeKey,
  descriptor: { options, render, navigation },
  onDismiss,
  removing = false,
}: Props) => {
  //#region extract options
  const {
    enableContentPanningGesture,
    enableHandlePanningGesture,
    index = 1,
    snapPoints = ['100%'],
    backdropColor = DEFAULT_BACKDROP_COLOR,
    backdropOpacity = DEFAULT_BACKDROP_OPACITY,
    height = DEFAULT_HEIGHT,
  } = options || {};
  //#endregion

  //#region refs
  const ref = useRef<BottomSheet>(null);

  const removingRef = useRef(false);
  removingRef.current = removing;

  // const
  //#endregion

  //#region variables
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const enhancedSpanPoints = useMemo(() => [0, ...snapPoints], [...snapPoints]);
  //#endregion

  //#region styles
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
  //#endregion

  //#region context methods
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
    [
      handleSettingEnableContentPanningGesture,
      handleSettingEnableHandlePanningGesture,
      handleSettingSnapPoints,
    ]
  );
  //#endregion

  //#region callbacks
  const handleOnChange = useCallback((index: number) => {
    if (index === 0) {
      onDismiss(routeKey, removingRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //#endregion

  //#region effects
  useEffect(() => {
    if (removing === true && ref.current) {
      ref.current.close();
    }
  }, [removing]);
  //#endregion

  //#region renders
  const renderBackdropComponent = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        appearsOnIndex={1}
        disappearsOnIndex={0}
        opacity={backdropOpacity}
        style={backdropStyle}
        {...props}
      />
    ),
    [backdropOpacity, backdropStyle]
  );

  return (
    <BottomSheetNavigatorContext.Provider value={contextVariables}>
      <BottomSheet
        animateOnMount
        animationDuration={DEFAULT_ANIMATION_DURATION}
        backdropComponent={renderBackdropComponent}
        backgroundComponent={null}
        containerHeight={CONTAINER_HEIGHT}
        enableContentPanningGesture={enableContentPanningGesture}
        enableHandlePanningGesture={enableHandlePanningGesture}
        handleComponent={null}
        index={index}
        onChange={handleOnChange}
        ref={ref}
        snapPoints={enhancedSpanPoints}
      >
        <View style={screenContainerStyle}>{render()}</View>
      </BottomSheet>
    </BottomSheetNavigatorContext.Provider>
  );
};

export default BottomSheetRoute;
