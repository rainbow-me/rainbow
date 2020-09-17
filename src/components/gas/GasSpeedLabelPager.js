import React, { Fragment, useEffect, useState } from 'react';
import styled from 'styled-components/primitives';
import colors from '../../styles/colors';
import { gasUtils, magicMemo } from '../../utils';
import { Row } from '../layout';
import GasSpeedLabelPagerItem, {
  GasSpeedLabelPagerItemHeight,
} from './GasSpeedLabelPagerItem';

const speedColors = [
  colors.white,
  colors.white,
  colors.white,
  colors.darkModeColors.purple,
];

const PagerItem = styled(Row)`
  width: ${({ selected }) => (selected ? '4' : '3')}px;
  height: 3px;
  border-radius: 2px;
  margin-left: ${({ selected }) => (selected ? '2' : '2.5')}px;
  margin-right: ${({ selected }) => (selected ? '0' : '0.5')}px;
`;

const GasSpeedLabelPager = ({ label, theme, showPager = true }) => {
  const [touched, setTouched] = useState(false);
  useEffect(() => setTouched(true), [label]);

  return (
    <Fragment>
      <Row align="center" height={GasSpeedLabelPagerItemHeight} justify="end">
        {showPager && (
          <Row self="start">
            {gasUtils.GasSpeedOrder.map((speed, i) => (
              <PagerItem
                backgroundColor={
                  speed === label
                    ? speedColors[i]
                    : colors.alpha(colors.darkModeColors.blueGreyDark, 0.3)
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
    </Fragment>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
