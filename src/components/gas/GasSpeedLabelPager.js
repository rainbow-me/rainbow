import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
// import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Column, Row } from '../layout';
import GasSpeedLabelPagerItem, {
  GasSpeedLabelPagerItemHeight,
} from './GasSpeedLabelPagerItem';
import { gasUtils, magicMemo } from '@rainbow-me/utils';
import { padding } from '@rainbow-me/styles';
import { Text } from '../text';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  border: 2px solid #8150E6;
  border-radius: 15px;
  ${padding(0, 5, 5)};
)
`;

const Chevron = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'bold',
})`
  margin-left: 5;
`;

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

const GasSpeedLabelPager = ({ label, theme, onPress }) => {
  const [touched, setTouched] = useState(false);
  useEffect(() => setTouched(true), [label]);
  const { colors, isDarkMode } = useTheme();
  const speedColors = useMemo(() => speedColorsFactory(colors), [colors]);

  return (
    <Row align="center" justify="end">
      <SpeedButton onPress={onPress}>
        {/* {gasUtils.GasSpeedOrder.map(speed => (
          <GasSpeedLabelPagerItem
            key={speed}
            label={speed}
            selected={speed === label}
            shouldAnimate={touched}
            theme={theme}
          />
        ))} */}
        <Row align="end">
          <Column>
            <GasSpeedLabelPagerItem
              key={label}
              label={label}
              selected
              shouldAnimate={touched}
              theme={theme}
            />
          </Column>
          <Column>
            <Chevron
              color={
                theme !== 'light'
                  ? colors.whiteLabel
                  : colors.alpha(colors.blueGreyDark, 0.8)
              }
            >
              􀁰
            </Chevron>
          </Column>
        </Row>
      </SpeedButton>
    </Row>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
