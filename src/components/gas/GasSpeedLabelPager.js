import React, { useEffect, useState } from 'react';
import styled from 'styled-components/primitives';
import { Row } from '../layout';
import GasSpeedLabelPagerItem, {
  GasSpeedLabelPagerItemHeight,
} from './GasSpeedLabelPagerItem';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';
import { gasUtils, magicMemo } from '@rainbow-me/utils';

const speedColors = {
  dark: [
    colors_NOT_REACTIVE.whiteLabel,
    colors_NOT_REACTIVE.whiteLabel,
    colors_NOT_REACTIVE.whiteLabel,
    colors_NOT_REACTIVE.appleBlue,
  ],
  light: [
    colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.8),
    colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.8),
    colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.8),
    colors_NOT_REACTIVE.appleBlue,
  ],
};

const PagerItem = styled(Row)`
  border-radius: 2px;
  height: 3px;
  margin-left: ${({ selected }) => (selected ? '2' : '2.5')}px;
  margin-right: ${({ selected }) => (selected ? '0' : '0.5')}px;
  ${android ? `margin-top: -3px;` : ``}
  width: ${({ selected }) => (selected ? '4' : '3')}px;
`;

const GasSpeedLabelPager = ({
  label,
  theme,
  showPager = true,
  options = null,
}) => {
  const [touched, setTouched] = useState(false);
  useEffect(() => setTouched(true), [label]);

  return (
    <Row align="center" height={GasSpeedLabelPagerItemHeight} justify="end">
      {showPager && (
        <Row self="start">
          {(options || gasUtils.GasSpeedOrder).map((speed, i) => (
            <PagerItem
              backgroundColor={
                speed === label
                  ? label === 'custom'
                    ? colors_NOT_REACTIVE.appleBlue
                    : speedColors[theme][i]
                  : theme === 'dark'
                  ? colors_NOT_REACTIVE.alpha(
                      colors_NOT_REACTIVE.darkModeColors.blueGreyDark,
                      0.3
                    )
                  : colors_NOT_REACTIVE.alpha(
                      colors_NOT_REACTIVE.blueGreyDark,
                      0.3
                    )
              }
              key={`pager-${speed}-${i}`}
              selected={speed === label}
            />
          ))}
        </Row>
      )}
      <Row height={GasSpeedLabelPagerItemHeight}>
        {gasUtils.GasSpeedOrder.map(speed => (
          <GasSpeedLabelPagerItem
            key={speed}
            label={speed}
            selected={speed === label}
            shouldAnimate={touched}
            theme={theme}
          />
        ))}
      </Row>
    </Row>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
