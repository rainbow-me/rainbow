import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
// import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPagerItem from './GasSpeedLabelPagerItem';
import { margin, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  scaleTo: 0.9,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  border-radius: 15px;
  ${padding(0, 5, 5)};
)
`;

const Symbol = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'heavy',
})`
  margin-left: ${({ nextToText }) => (nextToText ? 5 : 0)};
`;

const DoneCustomGas = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})`
  ${margin(3, 2, 0, 3)}
`;

const GasSpeedLabelPager = ({
  showGasOptions,
  label,
  theme,
  onPress,
  colorForAsset,
}) => {
  const [touched, setTouched] = useState(false);
  const { colors } = useTheme();

  useEffect(() => setTouched(true), [label]);

  return (
    <Row align="center" justify="end">
      <Column>
        <SpeedButton color={colorForAsset} onPress={onPress}>
          {!showGasOptions ? (
            <Row align="end">
              <Column>
                <GasSpeedLabelPagerItem
                  colorForAsset={colorForAsset}
                  key={label}
                  label={label}
                  selected
                  shouldAnimate={touched}
                  theme={theme}
                />
              </Column>
              <Column>
                <Symbol
                  color={
                    theme !== 'light'
                      ? colors.whiteLabel
                      : colors.alpha(colors.blueGreyDark, 0.8)
                  }
                  nextToText
                >
                  􀁰
                </Symbol>
              </Column>
            </Row>
          ) : (
            <DoneCustomGas
              color={
                theme !== 'light'
                  ? colors.whiteLabel
                  : colors.alpha(colors.blueGreyDark, 0.8)
              }
            >
              Done
            </DoneCustomGas>
          )}
        </SpeedButton>
      </Column>
    </Row>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
