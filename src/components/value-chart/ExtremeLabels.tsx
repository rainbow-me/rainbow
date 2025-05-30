import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import { useChartData } from '@/react-native-animated-charts/src';
import { Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { supportedNativeCurrencies } from '@/references';
import { useTheme } from '@/theme';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { toCompactNotation } from '@/helpers/strings';

function trim(val: number) {
  return Math.min(Math.max(val, 0.05), 0.95);
}

const CenteredLabel = ({
  children,
  color,
  position,
  size = '14px / 19px (Deprecated)',
  style,
  width,
}: {
  children: React.ReactNode;
  color: string;
  position: number;
  size?: TextSize;
  style: StyleProp<ViewStyle>;
  width: number;
}) => {
  const [componentWidth, setWidth] = useState(0);
  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width: newWidth },
      },
    }: LayoutChangeEvent) => {
      setWidth(newWidth);
    },
    [setWidth]
  );

  const left = useMemo(
    () => Math.max(Math.floor(Math.min(width * position - componentWidth / 2, width - componentWidth - 10)), 10),
    [componentWidth, position, width]
  );
  return (
    <View
      onLayout={onLayout}
      style={[
        style,
        {
          left,
          opacity: componentWidth ? 1 : 0,
          position: 'absolute',
        },
      ]}
    >
      <Text color={{ custom: color }} size={size} weight="bold">
        {children}
      </Text>
    </View>
  );
};

const Labels = ({ color, width, isCard }: { color: string; width: number; isCard: boolean }) => {
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];
  const { greatestX, greatestY, smallestX, smallestY } = useChartData();
  const { colors } = useTheme();

  if (!greatestX || !greatestY || !smallestX || !smallestY) return null;

  const positionMin = trim((smallestY.x - smallestX.x) / (greatestX.x - smallestX.x));
  const positionMax = trim((greatestY.x - smallestX.x) / (greatestX.x - smallestX.x));

  return (
    <>
      {positionMin ? (
        <CenteredLabel
          color={colors.alpha(color, 0.8)}
          position={positionMin}
          size={isCard ? '13pt' : undefined}
          style={{ bottom: isCard ? -24 : -40 }}
          width={width}
        >
          {toCompactNotation({
            value: smallestY.y,
            prefix: nativeSelected.symbol,
            decimalPlaces: nativeSelected.decimals,
            currency: nativeCurrency,
          })}
        </CenteredLabel>
      ) : null}
      {positionMax ? (
        <CenteredLabel
          color={colors.alpha(color, 0.8)}
          position={positionMax}
          size={isCard ? '13pt' : undefined}
          style={{ top: -20, left: isCard ? 0 : 40 }}
          width={width}
        >
          {toCompactNotation({
            value: greatestY.y,
            prefix: nativeSelected.symbol,
            decimalPlaces: nativeSelected.decimals,
            currency: nativeCurrency,
          })}
        </CenteredLabel>
      ) : null}
    </>
  );
};

export default React.memo(Labels);
