import React, { memo, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import { useChartData } from '@/react-native-animated-charts/src';
import { Text } from '@/design-system';
import { useAccountSettings, useDimensions } from '@/hooks';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

export const LABEL_VERTICAL_EXTRA_OFFSET = 12;
const LABEL_MIN_HORIZONTAL_INSET = 12;

const CenteredLabel = ({
  children,
  color,
  x,
  size = '14px / 19px (Deprecated)',
  style,
}: {
  children: React.ReactNode;
  color: string;
  size?: TextSize;
  style: StyleProp<ViewStyle>;
  x: number;
}) => {
  const { width: screenWidth } = useDimensions();
  const [componentWidth, setComponentWidth] = useState(0);
  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width: newWidth },
      },
    }: LayoutChangeEvent) => {
      setComponentWidth(newWidth);
    },
    [setComponentWidth]
  );

  const left = useMemo(() => {
    const minLeft = LABEL_MIN_HORIZONTAL_INSET;
    const maxLeft = screenWidth - componentWidth - LABEL_MIN_HORIZONTAL_INSET;
    const centerAlignedLeft = x - componentWidth / 2;
    return Math.min(Math.max(centerAlignedLeft, minLeft), maxLeft);
  }, [screenWidth, componentWidth, x]);

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          left,
          opacity: componentWidth ? 1 : 0,
          position: 'absolute',
        },
        style,
      ]}
    >
      <Text color={{ custom: color }} size={size} weight="bold">
        {children}
      </Text>
    </View>
  );
};

export const ExtremeLabels = memo(function ExtremeLabels({ color, isCard }: { color: string; isCard: boolean }) {
  const { nativeCurrency } = useAccountSettings();
  const {
    greatestX: rightmostPoint,
    greatestY: highestPoint,
    smallestX: leftmostPoint,
    smallestY: lowestPoint,
    width: chartWidth,
  } = useChartData();

  if (!rightmostPoint || !highestPoint || !leftmostPoint || !lowestPoint) return null;

  const minPricePosition = {
    x: ((lowestPoint.x - leftmostPoint.x) / (rightmostPoint.x - leftmostPoint.x)) * chartWidth,
  };
  const maxPricePosition = {
    x: ((highestPoint.x - leftmostPoint.x) / (rightmostPoint.x - leftmostPoint.x)) * chartWidth,
  };

  return (
    <>
      <CenteredLabel
        color={opacityWorklet(color, 0.8)}
        x={minPricePosition.x}
        size={isCard ? '13pt' : undefined}
        style={{ bottom: -13 - LABEL_VERTICAL_EXTRA_OFFSET }}
      >
        {formatAssetPrice({
          value: lowestPoint.y,
          currency: nativeCurrency,
        })}
      </CenteredLabel>
      <CenteredLabel
        color={opacityWorklet(color, 0.8)}
        x={maxPricePosition.x}
        size={isCard ? '13pt' : undefined}
        style={{ top: -13 - LABEL_VERTICAL_EXTRA_OFFSET }}
      >
        {formatAssetPrice({
          value: highestPoint.y,
          currency: nativeCurrency,
        })}
      </CenteredLabel>
    </>
  );
});
