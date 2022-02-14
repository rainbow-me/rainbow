import React, { useMemo } from 'react';
import { JellySelector } from '../jelly-selector';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const Container = styled(Centered)({
  paddingTop: 49,
  width: '100%',
});

const TimespanItemLabel = styled(Text).attrs(
  ({ color, isSelected, theme: { colors } }) => ({
    align: 'center',
    color: isSelected ? color : colors.alpha(colors.blueGreyDark, 0.4),
    letterSpacing: 'roundedTighter',
    size: 'smedium',
    weight: 'bold',
  })
)({
  ...padding.object(0, 9),
});

const TimespanItemRow = styled(Row).attrs({
  justify: 'space-around',
})({
  ...padding.object(0, 30),
});

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
  color,
  defaultIndex = 0,
  reloadChart,
  showMonth,
  showYear,
  timespans,
}) => {
  const { colors } = useTheme();
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
