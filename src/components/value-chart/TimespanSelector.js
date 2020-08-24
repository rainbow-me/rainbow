import React, { useMemo } from 'react';
import styled from 'styled-components/primitives';
import { JellySelector } from '../jelly-selector';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(Centered)`
  padding-top: 30;
  width: 100%;
`;

const TimespanItemLabel = styled(Text).attrs(({ color, isSelected }) => ({
  align: 'center',
  color: isSelected ? color : colors.alpha(colors.blueGreyDark, 0.4),
  letterSpacing: 'roundedTighter',
  size: 'smedium',
  weight: 'bold',
}))`
  ${padding(0, 9)};
`;

const TimespanItemRow = styled(Row).attrs({
  justify: 'space-around',
})`
  ${padding(0, 30)};
`;

const TimespanItem = ({ color, isSelected, item, ...props }) => (
  <Centered flexShrink={0} height={32} {...props}>
    <TimespanItemLabel color={color} isSelected={isSelected}>
      {ChartTypes[item] === ChartTypes.max
        ? 'MAX'
        : `1${item.charAt(0).toUpperCase()}`}
    </TimespanItemLabel>
  </Centered>
);

const TimespanSelector = ({
  color = colors.dark,
  defaultIndex = 0,
  reloadChart,
  showMonth,
  showYear,
  timespans,
}) => {
  const filteredTimespans = useMemo(() => {
    return timespans.filter(
      t =>
        (t !== ChartTypes.month || showMonth) &&
        (t !== ChartTypes.year || showYear)
    );
  }, [showMonth, showYear, timespans]);
  return (
    <Container>
      <JellySelector
        backgroundColor={colors.alpha(color, 0.06)}
        color={color}
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
