/**
 * TODO(jxom): Create a more reusable & composable `ImagePreviewOverlay`.
 * This component is very specific to ENS cover photos in the
 * UniqueTokenExpandedState
 */

import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import Animated, {
  SharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { ZoomableWrapper } from '../expanded-state/unique-token/ZoomableWrapper';
import { Box } from '@rainbow-me/design-system';
import { usePersistentAspectRatio } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

const ImagePreviewOverlayContext = createContext<{
  height: number;
  opacity?: SharedValue<number>;
  width: number;
  uri?: string;
  xOffset: number;
  yOffset: number;
  setUri: Dispatch<SetStateAction<string>>;
  setHeight: Dispatch<SetStateAction<number>>;
  setWidth: Dispatch<SetStateAction<number>>;
  setXOffset: Dispatch<SetStateAction<number>>;
  setYOffset: Dispatch<SetStateAction<number>>;
}>({
  height: 0,
  opacity: undefined,
  setHeight: () => undefined,
  setUri: () => undefined,
  setWidth: () => undefined,
  setXOffset: () => undefined,
  setYOffset: () => undefined,
  uri: undefined,
  width: 0,
  xOffset: 0,
  yOffset: 0,
});

type ImagePreviewOverlayProps = {
  animationProgress: SharedValue<number>;
  children: React.ReactNode;
  opacity: SharedValue<number>;
  yPosition: SharedValue<number>;
};

export default function ImagePreviewOverlay({
  animationProgress, // TODO(jxom): `animationProgress` to be inside this component
  children,
  opacity,
  yPosition, // TODO(jxom): `yPosition` to be inside this component
}: ImagePreviewOverlayProps) {
  const [uri, setUri] = useState('');
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  return (
    <ImagePreviewOverlayContext.Provider
      value={{
        height,
        opacity,
        setHeight,
        setUri,
        setWidth,
        setXOffset,
        setYOffset,
        uri,
        width,
        xOffset,
        yOffset,
      }}
    >
      {uri ? (
        <ImagePreview
          animationProgress={animationProgress}
          uri={uri}
          yPosition={yPosition}
        />
      ) : null}
      {children}
    </ImagePreviewOverlayContext.Provider>
  );
}

type ImagePreviewProps = {
  animationProgress: ImagePreviewOverlayProps['animationProgress'];
  yPosition: ImagePreviewOverlayProps['yPosition'];
  uri: string;
};

function ImagePreview({
  animationProgress,
  uri,
  yPosition,
}: ImagePreviewProps) {
  const { height, width, xOffset, yOffset, setHeight, opacity } = useContext(
    ImagePreviewOverlayContext
  );

  const aspectRatio = usePersistentAspectRatio(uri);

  useEffect(() => {
    if (aspectRatio.state === 2 && width) {
      setHeight(width / aspectRatio.result);
    }
  }, [aspectRatio.result, aspectRatio.state, setHeight, width]);

  const yDisplacement = useDerivedValue(() => {
    return yPosition.value - yOffset;
  });

  const ready =
    uri && height > 0 && width > 0 && xOffset > 0 && aspectRatio.state === 2;

  if (!ready) return null;
  return (
    <Box
      as={Animated.View}
      style={{
        left: xOffset,
        position: 'absolute',
        top: yOffset + 68,
        zIndex: 1,
      }}
    >
      <ZoomableWrapper
        animationProgress={animationProgress}
        aspectRatio={aspectRatio.result}
        borderRadius={16}
        disableAnimations={false}
        height={height}
        horizontalPadding={0}
        opacity={opacity}
        width={width}
        xOffset={xOffset}
        yDisplacement={yDisplacement}
        yOffset={yOffset}
      >
        <Box
          as={ImgixImage}
          flexShrink={1}
          height={{ custom: height }}
          source={{ uri }}
          width={{ custom: width }}
        />
      </ZoomableWrapper>
    </Box>
  );
}

export function ImagePreviewOverlayTarget({
  topOffset = 85,
  uri,
}: {
  topOffset?: number;
  uri: string;
}) {
  const { height, setUri, setWidth, setXOffset, setYOffset } = useContext(
    ImagePreviewOverlayContext
  );

  useEffect(() => {
    setUri(uri);
  }, [setUri, uri]);

  const aspectRatio = usePersistentAspectRatio(uri);

  const zoomableWrapperRef = useRef<any>();

  const handleLayout = useCallback(
    ({ nativeEvent }) => {
      const {
        layout: { width },
      } = nativeEvent;
      if (width && aspectRatio.state === 2) {
        setWidth(width);
      }
    },
    [aspectRatio.state, setWidth]
  );

  useEffect(() => {
    setTimeout(
      () => {
        if (zoomableWrapperRef.current) {
          zoomableWrapperRef.current?.measure((...args: any) => {
            const xOffset = args[4];
            const yOffset = args[5];
            xOffset && setXOffset(xOffset);
            yOffset && setYOffset(yOffset - topOffset);
          });
        }
      },
      android ? 500 : 0
    );
  }, [setXOffset, setYOffset, topOffset]);

  return (
    <Box
      flexShrink={1}
      height={{ custom: height || 0 }}
      onLayout={handleLayout}
      ref={zoomableWrapperRef}
      width="full"
    />
  );
}
