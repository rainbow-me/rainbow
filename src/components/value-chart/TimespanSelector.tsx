import React, { useMemo } from 'react';
import styled from 'styled-components';
import { JellySelector } from '../jelly-selector';
import { Centered, Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/chartTypes... Remove this comment to see the full error message
import ChartTypes from '@rainbow-me/helpers/chartTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Container = styled(Centered)`
  padding-top: 30;
  width: 100%;
`;

const TimespanItemLabel = styled(Text).attrs(
  ({ color, isSelected, theme: { colors } }) => ({
    align: 'center',
    color: isSelected ? color : colors.alpha(colors.blueGreyDark, 0.4),
    letterSpacing: 'roundedTighter',
    size: 'smedium',
    weight: 'bold',
  })
)`
  ${padding(0, 9)};
`;

const TimespanItemRow = styled(Row).attrs({
  justify: 'space-around',
})`
  ${padding(0, 30)};
`;

const TimespanItem = ({ color, isSelected, item, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Centered flexShrink={0} height={32} {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <TimespanItemLabel color={color} isSelected={isSelected}>
      {ChartTypes[item] === ChartTypes.max
        ? 'MAX'
        : `1${item.charAt(0).toUpperCase()}`}
    </TimespanItemLabel>
  </Centered>
);

const TimespanSelector = ({
  color,
  defaultIndex = 0,
  reloadChart,
  showMonth,
  showYear,
  timespans,
}: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const filteredTimespans = useMemo(() => {
    return timespans.filter(
      (t: any) =>
        (t !== ChartTypes.month || showMonth) &&
        (t !== ChartTypes.year || showYear)
    );
  }, [showMonth, showYear, timespans]);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <JellySelector
        backgroundColor={colors.alpha(color || colors.dark, 0.06)}
        color={color || colors.dark}
        defaultIndex={defaultIndex}
        enableHapticFeedback
        height={32}
        items={filteredTimespans}
        onSelect={reloadChart}
        renderItem={TimespanItem}
        renderRow={TimespanItemRow}
        scaleTo={1.2}
        width="100%"
      />
    </Container>
  );
};

export default React.memo(TimespanSelector);
