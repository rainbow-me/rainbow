import { get } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../expanded-state/chart/chart-data-labels/... Remove this comment to see the full error message
import { formatNative } from '../expanded-state/chart/chart-data-labels/ChartPriceLabel';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { useChartData } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { supportedNativeCurrencies } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts } from '@rainbow-me/styles';

function trim(val: any) {
  return Math.min(Math.max(val, 0.05), 0.95);
}

const Label = styled(Text)`
  font-size: ${fonts.size.smedium};
  font-weight: ${fonts.weight.bold};
  letter-spacing: ${fonts.letterSpacing.roundedTighter};
  position: absolute;
  text-align: center;
`;

const CenteredLabel = ({ position, style, width, ...props }: any) => {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

export default function Labels({ color, width }: any) {
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = get(supportedNativeCurrencies, `${nativeCurrency}`);
  const { greatestX, greatestY, smallestX, smallestY } = useChartData();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      {positionMin ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <CenteredLabel
          color={colors.alpha(color, 0.8)}
          position={positionMin}
          style={{
            bottom: -20,
          }}
          width={width}
        >
          {formatNative(smallestY.y, null, nativeSelected)}
        </CenteredLabel>
      ) : null}
      {positionMax ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
}
