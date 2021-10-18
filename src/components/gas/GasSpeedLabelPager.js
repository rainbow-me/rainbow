import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import { Row } from '../layout';
import GasSpeedLabelPagerItem, {
  GasSpeedLabelPagerItemHeight,
} from './GasSpeedLabelPagerItem';
import { gasUtils, magicMemo } from '@rainbow-me/utils';

const speedColorsFactory = colors => ({
  dark: [
    colors.whiteLabel,
    colors.whiteLabel,
    colors.whiteLabel,
    colors.appleBlue,
  ],
  light: [
    colors.alpha(colors.blueGreyDark, 0.8),
    colors.alpha(colors.blueGreyDark, 0.8),
    colors.alpha(colors.blueGreyDark, 0.8),
    colors.appleBlue,
  ],
});

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
  const { colors, isDarkMode } = useTheme();
  const speedColors = useMemo(() => speedColorsFactory(colors), [colors]);

  return (
    <Row align="center" height={GasSpeedLabelPagerItemHeight} justify="end">
      {showPager && (!options || options?.length > 1) && (
        <Row self="start">
          {(options || gasUtils.GasSpeedOrder).map((speed, i) => (
            <PagerItem
              backgroundColor={
                speed === label
                  ? label === 'custom'
                    ? colors.appleBlue
                    : speedColors[theme][i]
                  : theme === 'dark' || isDarkMode
                  ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.3)
                  : colors.alpha(lightModeThemeColors.blueGreyDark, 0.3)
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
