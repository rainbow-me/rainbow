import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { PixelRatio, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { Canvas, dist, Group, mixVector, Path, PathOp, point, Shadow, Skia, toDegrees } from '@shopify/react-native-skia';

import { Box, useColorMode, type Space } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

import {
  MEMBERSHIP_CARD_BORDER_RADIUS,
  MEMBERSHIP_CARD_DARK_CUTOUT_BORDER,
  MEMBERSHIP_CARD_DARK_FILL,
  MEMBERSHIP_CARD_DARK_INNER_SHADOW,
  MEMBERSHIP_CARD_LIGHT_CUTOUT_BORDER,
  MEMBERSHIP_CARD_LIGHT_DROP_SHADOW,
  MEMBERSHIP_CARD_LIGHT_FILL,
} from './membershipCardVisuals';

const DEFAULT_NOTCH_HEIGHT = 56;
const DEFAULT_NOTCH_DEPTH = 18;
const DEFAULT_NOTCH_DESIGN_CORNER_RADIUS = 12;
const DEFAULT_NOTCH_SHOULDER_RADIUS = resolveShoulderRadiusFromDesignRadius({
  notchHeight: DEFAULT_NOTCH_HEIGHT,
  notchDepth: DEFAULT_NOTCH_DEPTH,
  designCornerRadius: DEFAULT_NOTCH_DESIGN_CORNER_RADIUS,
});
const NO_SHADOW_OUTSETS = { top: 0, right: 0, bottom: 0, left: 0 } as const;
const LIGHT_DROP_SHADOW_OUTSETS = createShadowOutsets(MEMBERSHIP_CARD_LIGHT_DROP_SHADOW);

type NotchedMembershipCardProps = {
  children: ReactNode;
  notchOverlay?: ReactNode;
  width: number;
  padding?: Space;
  paddingHorizontal?: Space;
  paddingVertical?: Space;
  paddingTop?: Space;
  paddingBottom?: Space;
  notchWidth: number | null;
  notchHeight?: number;
  style?: StyleProp<ViewStyle>;
};

type NotchedCardPathParams = {
  cardRadius: number;
  width: number;
  height: number;
  notchWidth: number;
  notchHeight: number;
  notchDepth: number;
  notchShoulderRadius: number;
};

type NotchGeometry = NotchedCardPathParams & {
  lowerArcRadius: number;
  leftLowerArcCenterX: number;
  rightLowerArcCenterX: number;
  leftShoulderCenterX: number;
  rightShoulderCenterX: number;
  lowerArcCenterY: number;
};

type ShadowOutsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const NotchedMembershipCard = memo(function NotchedMembershipCard({
  children,
  notchOverlay,
  width: cardWidth,
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  notchHeight = DEFAULT_NOTCH_HEIGHT,
  notchWidth,
  style,
}: NotchedMembershipCardProps) {
  const { isDarkMode } = useColorMode();
  const [cardHeight, setCardHeight] = useState(0);
  // Skia clips drawing to the canvas bounds, so the light-mode drop shadow needs extra
  // surface area based on its blur and offset to avoid getting cropped.
  const shadowOutsets = isDarkMode ? NO_SHADOW_OUTSETS : LIGHT_DROP_SHADOW_OUTSETS;

  const notchedCardPath = useMemo(() => {
    if (cardHeight <= 0 || notchWidth === null || notchWidth <= 0) return null;

    return createNotchedCardPath({
      cardRadius: MEMBERSHIP_CARD_BORDER_RADIUS,
      width: cardWidth,
      height: cardHeight,
      notchWidth,
      notchHeight,
      notchDepth: DEFAULT_NOTCH_DEPTH,
      notchShoulderRadius: DEFAULT_NOTCH_SHOULDER_RADIUS,
    });
  }, [cardHeight, cardWidth, notchHeight, notchWidth]);

  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = PixelRatio.roundToNearestPixel(event.nativeEvent.layout.height);
    setCardHeight(height => (height === nextHeight ? height : nextHeight));
  }, []);

  const isReady = Boolean(notchedCardPath);

  return (
    <View style={[styles.container, { width: cardWidth }, style, !isReady && styles.hidden]}>
      {notchedCardPath && (
        <View
          pointerEvents="none"
          style={[
            styles.canvasContainer,
            {
              width: cardWidth + shadowOutsets.left + shadowOutsets.right,
              height: cardHeight + shadowOutsets.top + shadowOutsets.bottom,
              top: -shadowOutsets.top,
              left: -shadowOutsets.left,
            },
          ]}
        >
          <Canvas style={styles.canvas}>
            <Group antiAlias dither transform={[{ translateX: shadowOutsets.left }, { translateY: shadowOutsets.top }]}>
              {isDarkMode ? (
                <>
                  <Path path={notchedCardPath} color={MEMBERSHIP_CARD_DARK_FILL} />
                  <Path path={notchedCardPath} style="stroke" strokeWidth={THICK_BORDER_WIDTH} color={MEMBERSHIP_CARD_DARK_CUTOUT_BORDER} />
                  <Path path={notchedCardPath}>
                    <Shadow
                      dx={MEMBERSHIP_CARD_DARK_INNER_SHADOW.dx}
                      dy={MEMBERSHIP_CARD_DARK_INNER_SHADOW.dy}
                      blur={MEMBERSHIP_CARD_DARK_INNER_SHADOW.blur}
                      color={MEMBERSHIP_CARD_DARK_INNER_SHADOW.color}
                      inner
                      shadowOnly
                    />
                  </Path>
                </>
              ) : (
                <>
                  <Path path={notchedCardPath} color="transparent">
                    <Shadow
                      dx={MEMBERSHIP_CARD_LIGHT_DROP_SHADOW.dx}
                      dy={MEMBERSHIP_CARD_LIGHT_DROP_SHADOW.dy}
                      blur={MEMBERSHIP_CARD_LIGHT_DROP_SHADOW.blur}
                      color={MEMBERSHIP_CARD_LIGHT_DROP_SHADOW.color}
                      shadowOnly
                    />
                  </Path>
                  <Path path={notchedCardPath} color={MEMBERSHIP_CARD_LIGHT_FILL} />
                  <Path
                    path={notchedCardPath}
                    style="stroke"
                    strokeWidth={THICK_BORDER_WIDTH}
                    color={MEMBERSHIP_CARD_LIGHT_CUTOUT_BORDER}
                  />
                </>
              )}
            </Group>
          </Canvas>
        </View>
      )}
      <View onLayout={handleContentLayout} style={styles.contentWrapper}>
        <Box
          padding={padding}
          paddingHorizontal={paddingHorizontal}
          paddingVertical={paddingVertical}
          paddingTop={paddingTop}
          paddingBottom={paddingBottom}
          style={styles.content}
        >
          {children}
        </Box>
      </View>
      {notchOverlay && (
        <View
          pointerEvents="box-none"
          style={[
            styles.notchOverlaySlot,
            {
              height: notchHeight,
              top: DEFAULT_NOTCH_DEPTH - notchHeight,
            },
          ]}
        >
          {notchOverlay}
        </View>
      )}
    </View>
  );
});

function createNotchedCardPath(params: NotchedCardPathParams) {
  const notchGeometry = createNotchGeometry(params);
  const card = Skia.Path.Make();
  const notch = createNotchPath(notchGeometry);

  card.addRRect(
    Skia.RRectXY(Skia.XYWHRect(0, 0, notchGeometry.width, notchGeometry.height), notchGeometry.cardRadius, notchGeometry.cardRadius)
  );
  return Skia.Path.MakeFromOp(card, notch, PathOp.Difference);
}

function createNotchGeometry(params: NotchedCardPathParams): NotchGeometry {
  const { cardRadius, notchShoulderRadius, notchDepth, height, notchHeight, notchWidth, width } = params;
  const centerX = width / 2;
  const lowerArcRadius = notchHeight / 2;
  const lowerArcHalfSpan = notchWidth / 2 - lowerArcRadius;
  const shoulderCenterOffsetX = resolveShoulderCenterOffsetX({
    lowerArcRadius,
    notchDepth,
    notchShoulderRadius,
  });
  const shoulderHalfSpan = lowerArcHalfSpan + shoulderCenterOffsetX;

  return {
    ...params,
    cardRadius,
    height,
    leftLowerArcCenterX: centerX - lowerArcHalfSpan,
    leftShoulderCenterX: centerX - shoulderHalfSpan,
    lowerArcCenterY: notchDepth - lowerArcRadius,
    lowerArcRadius,
    rightLowerArcCenterX: centerX + lowerArcHalfSpan,
    rightShoulderCenterX: centerX + shoulderHalfSpan,
    width,
  };
}

function resolveShoulderCenterOffsetX({
  lowerArcRadius,
  notchDepth,
  notchShoulderRadius,
}: {
  lowerArcRadius: number;
  notchDepth: number;
  notchShoulderRadius: number;
}) {
  const lowerArcCenterY = notchDepth - lowerArcRadius;
  const distanceSquared =
    (lowerArcRadius + notchShoulderRadius) * (lowerArcRadius + notchShoulderRadius) -
    (lowerArcCenterY - notchShoulderRadius) * (lowerArcCenterY - notchShoulderRadius);

  return Math.sqrt(distanceSquared);
}

function resolveShoulderRadiusFromDesignRadius({
  notchHeight,
  notchDepth,
  designCornerRadius,
}: {
  notchHeight: number;
  notchDepth: number;
  designCornerRadius: number;
}) {
  const topIntersectionOffset = Math.sqrt(notchHeight * notchDepth - notchDepth * notchDepth);

  return (designCornerRadius * (2 * topIntersectionOffset + designCornerRadius)) / (2 * notchDepth);
}

function createNotchPath(notchGeometry: NotchGeometry) {
  const cutoutTopY = -Math.max(notchGeometry.notchHeight, notchGeometry.notchShoulderRadius * 2);
  const path = Skia.Path.Make();
  const leftTangency = resolveShoulderLowerArcTangency({
    shoulderCenterX: notchGeometry.leftShoulderCenterX,
    shoulderRadius: notchGeometry.notchShoulderRadius,
    lowerArcCenterX: notchGeometry.leftLowerArcCenterX,
    lowerArcCenterY: notchGeometry.lowerArcCenterY,
  });
  const rightTangency = resolveShoulderLowerArcTangency({
    shoulderCenterX: notchGeometry.rightShoulderCenterX,
    shoulderRadius: notchGeometry.notchShoulderRadius,
    lowerArcCenterX: notchGeometry.rightLowerArcCenterX,
    lowerArcCenterY: notchGeometry.lowerArcCenterY,
  });

  path.moveTo(notchGeometry.leftShoulderCenterX, cutoutTopY);
  path.lineTo(notchGeometry.leftShoulderCenterX, 0);
  path.arcToOval(
    createCircleBounds(notchGeometry.leftShoulderCenterX, notchGeometry.notchShoulderRadius, notchGeometry.notchShoulderRadius),
    -90,
    leftTangency.shoulderSweepAngle,
    false
  );
  path.arcToOval(
    createCircleBounds(notchGeometry.leftLowerArcCenterX, notchGeometry.lowerArcCenterY, notchGeometry.lowerArcRadius),
    leftTangency.lowerArcTangencyAngle,
    90 - leftTangency.lowerArcTangencyAngle,
    false
  );
  path.lineTo(notchGeometry.rightLowerArcCenterX, notchGeometry.notchDepth);
  path.arcToOval(
    createCircleBounds(notchGeometry.rightLowerArcCenterX, notchGeometry.lowerArcCenterY, notchGeometry.lowerArcRadius),
    90,
    rightTangency.lowerArcTangencyAngle - 90,
    false
  );
  path.arcToOval(
    createCircleBounds(notchGeometry.rightShoulderCenterX, notchGeometry.notchShoulderRadius, notchGeometry.notchShoulderRadius),
    rightTangency.shoulderStartAngle,
    -90 - rightTangency.shoulderStartAngle,
    false
  );
  path.lineTo(notchGeometry.rightShoulderCenterX, cutoutTopY);
  path.close();

  return path;
}

function resolveShoulderLowerArcTangency({
  shoulderCenterX,
  shoulderRadius,
  lowerArcCenterX,
  lowerArcCenterY,
}: {
  shoulderCenterX: number;
  shoulderRadius: number;
  lowerArcCenterX: number;
  lowerArcCenterY: number;
}) {
  const shoulderCenter = point(shoulderCenterX, shoulderRadius);
  const lowerArcCenter = point(lowerArcCenterX, lowerArcCenterY);
  const centerDistance = dist(shoulderCenter, lowerArcCenter);
  const tangentPoint = mixVector(shoulderRadius / centerDistance, shoulderCenter, lowerArcCenter);
  const shoulderAngle = angleFromCenter(tangentPoint.x, tangentPoint.y, shoulderCenterX, shoulderRadius);

  return {
    lowerArcTangencyAngle: angleFromCenter(tangentPoint.x, tangentPoint.y, lowerArcCenterX, lowerArcCenterY),
    shoulderStartAngle: shoulderAngle,
    shoulderSweepAngle: shoulderAngle + 90,
    tangentPoint,
  };
}

function createCircleBounds(centerX: number, centerY: number, radius: number) {
  return Skia.XYWHRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
}

function angleFromCenter(x: number, y: number, centerX: number, centerY: number) {
  return toDegrees(Math.atan2(y - centerY, x - centerX));
}

function createShadowOutsets({ dx, dy, blur }: { dx: number; dy: number; blur: number }): ShadowOutsets {
  const blurPadding = Math.ceil(blur * 2);

  return {
    left: blurPadding - dx,
    right: blurPadding + dx,
    top: blurPadding - dy,
    bottom: blurPadding + dy,
  };
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
  canvasContainer: {
    position: 'absolute',
  },
  container: {
    position: 'relative',
  },
  content: {
    position: 'relative',
  },
  contentWrapper: {
    width: '100%',
  },
  notchOverlaySlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  hidden: {
    opacity: 0,
  },
});
