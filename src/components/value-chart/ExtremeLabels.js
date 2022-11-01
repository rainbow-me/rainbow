import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { formatNative } from '../expanded-state/chart/chart-data-labels/ChartPriceLabel';
import { useChartData } from '@/react-native-animated-charts/src';
import { Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { supportedNativeCurrencies } from '@/references';

function trim(val) {
  return Math.min(Math.max(val, 0.05), 0.95);
}

const CenteredLabel = ({
  position,
  fontSize = '14px / 19px (Deprecated)',
  style,
  width,
  ...props
}) => {
  const [componentWidth, setWidth] = useState(0);
  const onLayout = useCallback(
    ({
      nativeEvent: {
        layout: { width: newWidth },
      },
    }) => {
      setWidth(newWidth);
    },
    [setWidth]
  );

  const left = useMemo(
    () =>
      Math.max(
        Math.floor(
          Math.min(
            width * position - componentWidth / 2,
            width - componentWidth - 10
          )
        ),
        10
      ),
    [componentWidth, position, width]
  );
  return (
    <View
      onLayout={onLayout}
      style={{
        ...style,
        left,
        opacity: componentWidth ? 1 : 0,
        position: 'absolute',
      }}
    >
      <Text color={{ custom: props.color }} size={fontSize} weight="bold">
        {props.children}
      </Text>
    </View>
  );
};

const Labels = ({ color, width, isCard }) => {
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];
  const { greatestX, greatestY, smallestX, smallestY } = useChartData();
  const { colors } = useTheme();

  if (!greatestX) {
    return null;
  }
  const positionMin = trim(
    (smallestY.x - smallestX.x) / (greatestX.x - smallestX.x)
  );
  const positionMax = trim(
    (greatestY.x - smallestX.x) / (greatestX.x - smallestX.x)
  );

  return (
    <>
      {positionMin ? (
        <CenteredLabel
          color={colors.alpha(color, 0.8)}
          position={positionMin}
          fontSize={isCard ? '13pt' : undefined}
          style={{
            bottom: isCard ? -24 : -40,
          }}
          width={width}
        >
          {formatNative(smallestY.y, null, nativeSelected)}
        </CenteredLabel>
      ) : null}
      {positionMax ? (
        <CenteredLabel
          color={colors.alpha(color, 0.8)}
          position={positionMax}
          fontSize={isCard ? '13pt' : undefined}
          style={{
            top: -20,
            left: isCard ? 0 : 40,
          }}
          width={width}
        >
          {formatNative(greatestY.y, null, nativeSelected)}
        </CenteredLabel>
      ) : null}
    </>
  );
};

export default React.memo(Labels);
