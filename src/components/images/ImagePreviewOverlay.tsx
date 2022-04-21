import { BlurView } from '@react-native-community/blur';
import { uniqueId } from 'lodash';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  atom,
  atomFamily,
  RecoilRoot,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { ZoomableWrapper } from '../expanded-state/unique-token/ZoomableWrapper';
import AvatarCoverPhotoMaskSvg from '../svg/AvatarCoverPhotoMaskSvg';
import {
  BackgroundProvider,
  Box,
  BoxProps,
  Cover,
  useColorMode,
} from '@rainbow-me/design-system';
import { usePersistentAspectRatio } from '@rainbow-me/hooks';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

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
const hasShadowAtom = atomFamily({
  default: false,
  key: 'imagePreviewOverlay.hasShadow',
});
const heightAtom = atomFamily({
  default: 0,
  key: 'imagePreviewOverlay.height',
});
const hostComponentAtom = atomFamily<React.ReactElement, string>({
  default: <Box />,
  key: 'imagePreviewOverlay.hostComponent',
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

const ImageOverlayConfigContext = createContext<{
  enableZoom: boolean;
  useBackgroundOverlay?: boolean;
}>({
  enableZoom: true,
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
      <ImageOverlayConfigContext.Provider
        value={{ enableZoom, useBackgroundOverlay }}
      >
        {children}
        {enableZoom && (
          <ImagePreviews
            backgroundOverlay={backgroundOverlay}
            opacity={opacity}
            yPosition={yPosition}
          />
        )}
      </ImageOverlayConfigContext.Provider>
    </RecoilRoot>
  );
}

type ImagePreviewsProps = {
  backgroundOverlay?: React.ReactElement;
  opacity?: SharedValue<number>;
  yPosition: SharedValue<number>;
};

function ImagePreviews({
  backgroundOverlay,
  opacity,
  yPosition,
}: ImagePreviewsProps) {
  const ids = useRecoilValue(idsAtom);
  return (
    <>
      {ids.map((id, index) => (
        <ImagePreview
          backgroundOverlay={backgroundOverlay}
          id={id}
          index={index}
          key={index}
          opacity={opacity}
          yPosition={yPosition}
        />
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

function ImagePreview({
  backgroundOverlay,
  index,
  id,
  opacity: givenOpacity,
  yPosition,
}: ImagePreviewProps) {
  const { useBackgroundOverlay } = useContext(ImageOverlayConfigContext);

  const aspectRatio = useRecoilValue(aspectRatioAtom(id));
  const backgroundMask = useRecoilValue(backgroundMaskAtom(id));
  const borderRadius = useRecoilValue(borderRadiusAtom(id));
  const hasShadow = useRecoilValue(hasShadowAtom(id));
  const height = useRecoilValue(heightAtom(id));
  const hostComponent = useRecoilValue(hostComponentAtom(id));
  const width = useRecoilValue(widthAtom(id));
  const xOffset = useRecoilValue(xOffsetAtom(id));
  const yOffset = useRecoilValue(yOffsetAtom(id));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const opacity = givenOpacity || useSharedValue(1);

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
    zIndex: progress.value > 0 ? index + 1 : index,
  }));
  const blurStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    zIndex: progress.value > 0 ? index + 2 : -1,
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 1 * progress.value,
    zIndex: progress.value > 0 ? index + 2 : -2,
  }));
  const containerStyle = useAnimatedStyle(() => ({
    zIndex: progress.value > 0 ? index + 10 : index,
  }));

  const ready = id && height > 0 && width > 0 && xOffset >= 0 && aspectRatio;

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
            <BackgroundProvider color="body">
              {({ backgroundColor }) => (
                <AvatarCoverPhotoMaskSvg
                  backgroundColor={backgroundColor as any}
                />
              )}
            </BackgroundProvider>
          </Cover>
        </Box>
      )}
      {useBackgroundOverlay && (
        <>
          {backgroundOverlay ? (
            <Box
              as={Animated.View}
              style={[overlayStyle, StyleSheet.absoluteFillObject]}
            >
              {backgroundOverlay}
            </Box>
          ) : (
            <>
              {ios && (
                <Box
                  as={AnimatedBlurView}
                  blurType={colorMode === 'light' ? 'light' : 'dark'}
                  style={[blurStyle, StyleSheet.absoluteFillObject]}
                />
              )}
              <Box
                as={Animated.View}
                style={[overlayStyle, StyleSheet.absoluteFillObject]}
              >
                <Box
                  background="body"
                  height="full"
                  style={{
                    opacity:
                      colorMode === 'light'
                        ? ios
                          ? 0.7
                          : 0.9
                        : ios
                        ? 0.3
                        : 0.5,
                  }}
                  width="full"
                />
              </Box>
            </>
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
          disableAnimations={false}
          hasShadow={hasShadow}
          height={height}
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
  children,
  hasShadow = false,
  height: initialHeight,
  topOffset = 85,
  uri,
}: {
  backgroundMask?: 'avatar';
  borderRadius?: number;
  children: React.ReactElement;
  hasShadow?: boolean;
  height?: BoxProps['height'];
  topOffset?: number;
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
  const { enableZoom } = useContext(ImageOverlayConfigContext);

  const id = useMemo(() => uniqueId(), []);

  const [height, setHeight] = useRecoilState(heightAtom(id));
  const [width, setWidth] = useRecoilState(widthAtom(id));

  const setIds = useSetRecoilState(idsAtom);
  const setHostComponent = useSetRecoilState(hostComponentAtom(id));

  const setAspectRatio = useSetRecoilState(aspectRatioAtom(id));
  const setBackgroundMask = useSetRecoilState(backgroundMaskAtom(id));
  const setBorderRadius = useSetRecoilState(borderRadiusAtom(id));
  const setHasShadow = useSetRecoilState(hasShadowAtom(id));
  const setXOffset = useSetRecoilState(xOffsetAtom(id));
  const setYOffset = useSetRecoilState(yOffsetAtom(id));

  useEffect(() => {
    if (backgroundMask) {
      setBackgroundMask(backgroundMask);
    }
    setBorderRadius(borderRadius);
    setHasShadow(hasShadow);
    setIds(ids => [...ids, id]);
  }, [
    backgroundMask,
    borderRadius,
    hasShadow,
    id,
    setBackgroundMask,
    setBorderRadius,
    setHasShadow,
    setIds,
  ]);

  // If we are not given an `aspectRatioType`, then we will need to
  // calculate it from the uri.
  const calculatedAspectRatio = usePersistentAspectRatio(uri || '');

  const aspectRatio = useMemo(
    () =>
      aspectRatioType
        ? ASPECT_RATIOS[aspectRatioType]
        : calculatedAspectRatio.result,
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
    ({ nativeEvent }) => {
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
              typeof yOffset === 'number' && setYOffset(yOffset - topOffset);
              hasMounted.current = true;
            });
          }
        },
        android ? 500 : 0
      );
    },
    [aspectRatio, setWidth, setXOffset, setYOffset, topOffset]
  );

  useEffect(() => {
    if (!enableZoom) return;
    setHostComponent(children);
  }, [children, enableZoom, setHostComponent, uri]);

  const [renderPlaceholder, setRenderPlaceholder] = useState(true);
  useEffect(() => {
    if (!enableZoom) return;
    if (width) {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => setRenderPlaceholder(false), 500);
      });
    }
  }, [enableZoom, width]);

  return (
    <Box flexShrink={1} width="full">
      <Box
        borderRadius={borderRadius}
        flexShrink={1}
        height={height ? { custom: height } : initialHeight || { custom: 0 }}
        onLayout={handleLayout}
        ref={zoomableWrapperRef}
        style={{ overflow: 'hidden' }}
        width="full"
      >
        {renderPlaceholder && children}
      </Box>
    </Box>
  );
}
