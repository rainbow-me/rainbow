import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { spring } from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import ChartTypes from '../../helpers/chartTypes';
import { useDimensions } from '../../hooks';
import { borders, colors, position } from '../../styles';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import { JellySelector } from '../jelly-selector';

const indicatorSize = 30;
const sx = StyleSheet.create({
  item: {
    // ...position.sizeAsObject(30),
    // overflow: 'hidden',
    paddingHorizontal: 8,
  },
});

const TimespanItem = ({ isSelected, item, ...props }) => {
  // console.log('timespanitem props' , props);

        // lineHeight={30}
  return (
    <Centered flexShrink={0} height={32} {...props}>
      <Text
        align="center"
        color={isSelected ? colors.dark : colors.grey}
        style={sx.item}
        weight="semibold"
      >
        {ChartTypes[item] === ChartTypes.max ? 'MAX' : `1${item.charAt(0)}`}
      </Text>
    </Centered>
  );
}

const TimespanSelector = ({ color, defaultIndex, isLoading, reloadChart }) => {
  const { width } = useDimensions();
  const [timespan, setTimespan] = useState(defaultIndex);

  const bottomSpaceWidth = width / 8;
  const [translateX] = useValues([Math.round(-bottomSpaceWidth * 3)], []);

  const handleSelect = useCallback(
    newTimespan => {
      console.log('NEW TIMESPAN', newTimespan);
      setTimespan(ChartTypes[newTimespan]);
      reloadChart(ChartTypes[newTimespan]);
    },
    [reloadChart]
  );

  const items = Object.keys(ChartTypes);

  // console.log('items', items);

  return (
    <Centered width="100%">
      <JellySelector
        backgroundColor={color}
        defaultIndex={0}
        height={32}
        items={items}
        onSelect={handleSelect}
        renderItem={TimespanItem}
      />
    </Centered>
  );
};

TimespanSelector.propTypes = {
  color: PropTypes.string,
  isLoading: PropTypes.bool,
  reloadChart: PropTypes.func,
};

export default TimespanSelector;
