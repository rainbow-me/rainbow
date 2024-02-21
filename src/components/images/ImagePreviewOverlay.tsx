import { BlurView } from '@react-native-community/blur';
import { uniqueId } from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, LayoutChangeEvent, Pressable, PressableProps, StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { atom, atomFamily, RecoilRoot, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { ZoomableWrapper } from '../expanded-state/unique-token/ZoomableWrapper';
import { SheetHandleFixedToTopHeight } from '../sheet';
import AvatarCoverPhotoMaskSvg from '../svg/AvatarCoverPhotoMaskSvg';
import { BackgroundProvider, Box, BoxProps, Cover, useColorMode } from '@/design-system';
import { useDimensions, usePersistentAspectRatio } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { colors, position } from '@/styles';
import { safeAreaInsetValues } from '@/utils';
import { FULL_NFT_IMAGE_SIZE } from '@/utils/handleNFTImages';

const idsAtom = atom<string[]>({
  default: [],
  key: 'imagePreviewOverlay.ids',
});

const aspectRatioAtom = atomFamily<number | null, string>({
  default: null,
  key: 'imagePreviewOverlay.aspectRatio',
});
const backgroundMaskAtom = atomFamily<string | null, string>({
  default: null,
  key: 'imagePreviewOverlay.backgroundMaskAtom',
});
const borderRadiusAtom = atomFamily({
  default: 16,
  key: 'imagePreviewOverlay.borderRadius',
});
const disableAnimationsAtom = atomFamily({
  default: false,
  key: 'imagePreviewOverlay.disableAnimations',
});
const disableEnteringWithPinchAtom = atomFamily({
  default: false,
  key: 'imagePreviewOverlay.disableEnteringWithPinch',
});
const hasShadowAtom = atomFamily({
  default: false,
  key: 'imagePreviewOverlay.hasShadow',
});
const heightAtom = atomFamily({
  default: 0,
  key: 'imagePreviewOverlay.height',
});
const hideStatusBarAtom = atomFamily({
  default: true,
  key: 'imagePreviewOverlay.hideStatusBar',
});
const hostComponentAtom = atomFamily<React.ReactElement, string>({
  default: <Box />,
  key: 'imagePreviewOverlay.hostComponent',
});
const imageUrlAtom = atomFamily({
  default: '',
  key: 'imagePreviewOverlay.imageUrl',
});
const widthAtom = atomFamily({
  default: 0,
  key: 'imagePreviewOverlay.width',
});
const xOffsetAtom = atomFamily({
  default: -1,
  key: 'imagePreviewOverlay.xOffset',
});
const yOffsetAtom = atomFamily({
  default: 0,
  key: 'imagePreviewOverlay.yOffset',
});
const zIndexAtom = atomFamily({
  default: 0,
  key: 'imagePreviewOverlay.zIndex',
});

const ImageOverlayConfigContext = createContext<{
  enableZoom: boolean;
  useBackgroundOverlay?: boolean;
  yPosition?: SharedValue<number>;
}>({
  enableZoom: false,
});

const enterConfig = {
  damping: 40,
  mass: 1.5,
  stiffness: 600,
};
const exitConfig = {
  damping: 68,
  mass: 2,
  stiffness: 800,
};

type ImagePreviewOverlayProps = {
  backgroundOverlay?: React.ReactElement;
  children: React.ReactNode;
  enableZoom?: boolean;
  opacity?: SharedValue<number>;
  useBackgroundOverlay?: boolean;
  yPosition?: SharedValue<number>;
};

export default function ImagePreviewOverlay({
  backgroundOverlay,
  children,
  enableZoom = true,
  opacity,
  useBackgroundOverlay = true,
  yPosition: givenYPosition,
}: ImagePreviewOverlayProps) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const yPosition = givenYPosition || useSharedValue(0);

  return (
    <RecoilRoot>
      <ImageOverlayConfigContext.Provider value={{ enableZoom, useBackgroundOverlay, yPosition }}>
        {children}
        {enableZoom && <ImagePreviews backgroundOverlay={backgroundOverlay} opacity={opacity} yPosition={yPosition} />}
      </ImageOverlayConfigContext.Provider>
    </RecoilRoot>
  );
}

type ImagePreviewsProps = {
  backgroundOverlay?: React.ReactElement;
  opacity?: SharedValue<number>;
  yPosition: SharedValue<number>;
};

function ImagePreviews({ backgroundOverlay, opacity, yPosition }: ImagePreviewsProps) {
  const ids = useRecoilValue(idsAtom);
  return (
    <>
      {ids.map((id, index) => (
        <ImagePreview backgroundOverlay={backgroundOverlay} id={id} index={index} key={index} opacity={opacity} yPosition={yPosition} />
      ))}
    </>
  );
}

type ImagePreviewProps = {
  backgroundOverlay?: React.ReactElement;
  index: number;
  id: string;
  opacity?: SharedValue<number>;
  yPosition: SharedValue<number>;
};

function ImagePreview({ backgroundOverlay, index, id, opacity: givenOpacity, yPosition }: ImagePreviewProps) {
  const { useBackgroundOverlay } = useContext(ImageOverlayConfigContext);
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const aspectRatio = useRecoilValue(aspectRatioAtom(id));
  const backgroundMask = useRecoilValue(backgroundMaskAtom(id));
  const borderRadius = useRecoilValue(borderRadiusAtom(id));
  const disableAnimations = useRecoilValue(disableAnimationsAtom(id));
  const disableEnteringWithPinch = useRecoilValue(disableEnteringWithPinchAtom(id));
  const hasShadow = useRecoilValue(hasShadowAtom(id));
  const height = useRecoilValue(heightAtom(id));
  const hideStatusBar = useRecoilValue(hideStatusBarAtom(id));
  const hostComponent = useRecoilValue(hostComponentAtom(id));
  const imageUrl = useRecoilValue(imageUrlAtom(id));
  const width = useRecoilValue(widthAtom(id));
  const xOffset = useRecoilValue(xOffsetAtom(id));
  const yOffset = useRecoilValue(yOffsetAtom(id));
  const zIndexOverride = useRecoilValue(zIndexAtom(id));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const opacity = givenOpacity || useSharedValue(1);
  const zIndex = zIndexOverride ?? index;

  const { colorMode } = useColorMode();

  const progress = useSharedValue(0);

  const yDisplacement = useDerivedValue(() => {
    return yPosition.value - yOffset;
  });

  const handleZoomOut = useCallback(() => {
    'worklet';
    progress.value = withSpring(0, exitConfig);
  }, [progress]);

  const handleZoomIn = useCallback(() => {
    'worklet';
    progress.value = withSpring(1, enterConfig);
  }, [progress]);

  const backgroundMaskStyle = useAnimatedStyle(() => ({
    zIndex: progress.value > 0 ? zIndex + 1 : zIndex,
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 * progress.value,
    transform: [
      {
        translateY: yPosition.value - (hideStatusBar ? SheetHandleFixedToTopHeight : 0),
      },
    ],
    zIndex: progress.value > 0 ? zIndex + 2 : -2,
  }));
  const containerStyle = useAnimatedStyle(() => ({
    zIndex: progress.value > 0 ? zIndex + 10 : zIndex,
  }));

  const ready = id && imageUrl && height > 0 && width > 0 && xOffset >= 0 && aspectRatio;

  if (!ready) return null;
  return (
    <>
      {backgroundMask === 'avatar' && (
        <Box
          as={Animated.View}
          style={[
            {
              left: xOffset + 35,
              position: 'absolute',
              top: yOffset + 68,
            },
            backgroundMaskStyle,
          ]}
        >
          <Cover alignHorizontal="center">
            <BackgroundProvider color="body (Deprecated)">
              {({ backgroundColor }) => <AvatarCoverPhotoMaskSvg backgroundColor={backgroundColor as any} />}
            </BackgroundProvider>
          </Cover>
        </Box>
      )}
      {useBackgroundOverlay && (
        <>
          {backgroundOverlay ? (
            <Box as={Animated.View} style={[overlayStyle, StyleSheet.absoluteFillObject]}>
              {backgroundOverlay}
            </Box>
          ) : (
            <Box as={Animated.View} style={[overlayStyle, StyleSheet.absoluteFillObject]}>
              {ios && (
                <Box
                  as={View}
                  height={{
                    custom: hideStatusBar ? deviceHeight : deviceHeight - safeAreaInsetValues.top,
                  }}
                  left="0px"
                  position="absolute"
                  shouldRasterizeIOS
                  style={{
                    backgroundColor: colors.trueBlack,
                    overflow: 'hidden',
                  }}
                  width={{ custom: deviceWidth }}
                >
                  <Box style={position.coverAsObject}>
                    <Box as={ImgixImage} height="full" source={{ uri: imageUrl }} width="full" size={FULL_NFT_IMAGE_SIZE} />
                    <Box as={BlurView} blurAmount={100} blurType="light" style={position.coverAsObject} />
                  </Box>
                </Box>
              )}
              <Box
                height={{
                  custom: hideStatusBar ? deviceHeight : deviceHeight - safeAreaInsetValues.top,
                }}
                style={{
                  backgroundColor: colorMode === 'dark' ? `rgba(22, 22, 22, ${ios ? 0.8 : 1})` : `rgba(26, 26, 26, ${ios ? 0.8 : 1})`,
                }}
                width="full"
              />
            </Box>
          )}
        </>
      )}
      <Box
        as={Animated.View}
        style={[
          {
            left: xOffset,
            position: 'absolute',
            top: yOffset + 68,
          },
          containerStyle,
        ]}
      >
        <ZoomableWrapper
          aspectRatio={aspectRatio}
          borderRadius={borderRadius}
          disableAnimations={disableAnimations}
          disableEnteringWithPinch={disableEnteringWithPinch}
          hasShadow={hasShadow}
          height={height}
          hideStatusBar={hideStatusBar}
          horizontalPadding={0}
          onZoomInWorklet={handleZoomIn}
          onZoomOutWorklet={handleZoomOut}
          opacity={opacity}
          width={width}
          xOffset={xOffset}
          yDisplacement={yDisplacement}
          yOffset={yOffset}
        >
          <Box flexBasis={0} flexGrow={1} flexShrink={1}>
            {hostComponent}
          </Box>
        </ZoomableWrapper>
      </Box>
    </>
  );
}

const ASPECT_RATIOS = {
  avatar: 1,
  cover: 3,
};

export function ImagePreviewOverlayTarget({
  aspectRatioType,
  backgroundMask,
  borderRadius = 16,
  children: children_,
  deferOverlayTimeout = 0,
  disableEnteringWithPinch = false,
  enableZoomOnPress = true,
  hasShadow = false,
  height: givenHeight,
  hideStatusBar = true,
  imageUrl = '',
  onPress,
  topOffset = 85,
  uri,
  zIndex = 0,
}: {
  backgroundMask?: 'avatar';
  borderRadius?: number;
  children: React.ReactElement;
  enableZoomOnPress?: boolean;
  deferOverlayTimeout?: number;
  disableEnteringWithPinch?: boolean;
  hasShadow?: boolean;
  onPress?: PressableProps['onPress'];
  height?: BoxProps['height'];
  hideStatusBar?: boolean;
  imageUrl?: string;
  topOffset?: number;
  zIndex?: number;
} & (
  | {
      aspectRatioType?: never;
      uri: string;
    }
  | {
      aspectRatioType: 'avatar' | 'cover';
      uri?: never;
    }
)) {
  const { enableZoom: enableZoom_, yPosition } = useContext(ImageOverlayConfigContext);
  const enableZoom = enableZoom_ && imageUrl;

  const id = useMemo(() => uniqueId(), []);

  const [height, setHeight] = useRecoilState(heightAtom(id));
  const [width, setWidth] = useRecoilState(widthAtom(id));

  const setIds = useSetRecoilState(idsAtom);
  const setHostComponent = useSetRecoilState(hostComponentAtom(id));

  const setAspectRatio = useSetRecoilState(aspectRatioAtom(id));
  const setBackgroundMask = useSetRecoilState(backgroundMaskAtom(id));
  const setBorderRadius = useSetRecoilState(borderRadiusAtom(id));
  const setDisableAnimations = useSetRecoilState(disableAnimationsAtom(id));
  const setDisableEnteringWithPinch = useSetRecoilState(disableEnteringWithPinchAtom(id));
  const setHasShadow = useSetRecoilState(hasShadowAtom(id));
  const setHideStatusBar = useSetRecoilState(hideStatusBarAtom(id));
  const setImageUrl = useSetRecoilState(imageUrlAtom(id));
  const setXOffset = useSetRecoilState(xOffsetAtom(id));
  const setYOffset = useSetRecoilState(yOffsetAtom(id));
  const setZIndex = useSetRecoilState(zIndexAtom(id));

  useEffect(() => {
    if (backgroundMask) {
      setBackgroundMask(backgroundMask);
    }
    setBorderRadius(borderRadius);
    setDisableAnimations(!enableZoomOnPress);
    setDisableEnteringWithPinch(disableEnteringWithPinch);
    setHasShadow(hasShadow);
    setHideStatusBar(hideStatusBar);
    setImageUrl(imageUrl);
    setIds(ids => [...ids, id]);
    setZIndex(zIndex);
  }, [
    backgroundMask,
    borderRadius,
    disableEnteringWithPinch,
    enableZoomOnPress,
    hasShadow,
    hideStatusBar,
    id,
    imageUrl,
    setBackgroundMask,
    setBorderRadius,
    setDisableAnimations,
    setDisableEnteringWithPinch,
    setHasShadow,
    setHideStatusBar,
    setIds,
    setImageUrl,
    setZIndex,
    zIndex,
  ]);

  // If we are not given an `aspectRatioType`, then we will need to
  // calculate it from the uri.
  const calculatedAspectRatio = usePersistentAspectRatio(uri || '');

  const aspectRatio = useMemo(
    () => (aspectRatioType ? ASPECT_RATIOS[aspectRatioType] : calculatedAspectRatio.result),
    [aspectRatioType, calculatedAspectRatio]
  );
  useEffect(() => {
    if (aspectRatio) {
      setAspectRatio(aspectRatio);
      if (width) {
        setHeight(width / aspectRatio);
      }
    }
  }, [aspectRatio, width, setAspectRatio, setHeight]);

  const zoomableWrapperRef = useRef<any>();
  const hasMounted = useRef<any>(false);

  const handleLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const {
        layout: { width },
      } = nativeEvent;
      if (width && aspectRatio) {
        setWidth(width);
      }
      setTimeout(
        () => {
          if (zoomableWrapperRef.current && !hasMounted.current) {
            zoomableWrapperRef.current?.measure((...args: any) => {
              const xOffset = args[4];
              const yOffset = args[5];
              typeof xOffset === 'number' && setXOffset(xOffset);
              typeof yOffset === 'number' && setYOffset(yOffset - topOffset + (yPosition?.value ?? 0));
              hasMounted.current = true;
            });
          }
        },
        android ? 500 : 0
      );
    },
    [aspectRatio, setWidth, setXOffset, setYOffset, topOffset, yPosition?.value]
  );

  const children = useMemo(() => {
    if (!onPress) return children_;
    return <Pressable onPress={onPress}>{children_}</Pressable>;
  }, [children_, onPress]);

  useEffect(() => {
    if (!enableZoom) return;

    if (deferOverlayTimeout) {
      setTimeout(() => setHostComponent(children), deferOverlayTimeout);
    } else {
      setHostComponent(children);
    }
  }, [children, enableZoom, setHostComponent, deferOverlayTimeout, uri]);

  const [renderPlaceholder, setRenderPlaceholder] = useState(true);
  useEffect(() => {
    if (!enableZoom) return;
    if (width) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => setRenderPlaceholder(false), 500 + deferOverlayTimeout);
      });
    }
  }, [enableZoom, deferOverlayTimeout, width]);

  return (
    <Box flexShrink={1} width="full">
      <Box
        borderRadius={borderRadius}
        height={givenHeight ? givenHeight : height ? { custom: height } : { custom: 0 }}
        onLayout={handleLayout}
        ref={zoomableWrapperRef}
        style={{ opacity: renderPlaceholder ? 1 : 0, overflow: 'hidden' }}
        width="full"
      >
        {children}
      </Box>
    </Box>
  );
}
