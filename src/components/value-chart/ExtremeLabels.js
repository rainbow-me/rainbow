import { get } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { formatNative } from '../expanded-state/chart/chart-data-labels/ChartPriceLabel';
import { Text } from '../text';
import { useChartData } from '@rainbow-me/animated-charts';
import { useAccountSettings } from '@rainbow-me/hooks';
import { supportedNativeCurrencies } from '@rainbow-me/references';
import styled from '@rainbow-me/styled-components';
import { fonts } from '@rainbow-me/styles';

function trim(val) {
  return Math.min(Math.max(val, 0.05), 0.95);
}

const Label = styled(Text)({
  fontSize: fonts.size.smedium,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTighter,
  position: 'absolute',
  textAlign: 'center',
});

const CenteredLabel = ({ position, style, width, ...props }) => {
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
    <Label
      {...props}
      onLayout={onLayout}
      style={{
        ...style,
        left,
        opacity: componentWidth ? 1 : 0,
      }}
    />
  );
};

const Labels = React.memo(function Labels({ color, width }) {
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = get(supportedNativeCurrencies, `${nativeCurrency}`);
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
          style={{
            bottom: -40,
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
          style={{
            top: -20,
          }}
          width={width}
        >
          {formatNative(greatestY.y, null, nativeSelected)}
        </CenteredLabel>
      ) : null}
    </>
  );
});

export default Labels;
