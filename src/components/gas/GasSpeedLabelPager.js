import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Column, Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPagerItem from './GasSpeedLabelPagerItem';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  alignItems: 'center',
  hapticType: 'impactHeavy',
  height: 30,
  justifyContent: 'center',
  scaleTo: 0.9,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  border-radius: 19px;
  ${padding(0, 6, 0, 6)};
)
`;

const Symbol = styled(Text).attrs({
  align: 'right',
  size: 'lmedium',
  weight: 'heavy',
})``;

const GasSpeedLabelPager = ({
  label,
  theme,
  onPress,
  colorForAsset,
  dropdownEnabled,
}) => {
  const [touched, setTouched] = useState(false);
  const { colors } = useTheme();

  useEffect(() => setTouched(true), [label]);

  return (
    <Row align="center" justify="end">
      <Column>
        <SpeedButton
          color={colorForAsset}
          disabled={!dropdownEnabled}
          onPress={onPress}
        >
          <Row align={(ios && 'end') || 'stretch'}>
            <GasSpeedLabelPagerItem
              colorForAsset={colorForAsset}
              key={label}
              label={label}
              selected
              shouldAnimate={touched}
              theme={theme}
            />
            {dropdownEnabled && (
              <Symbol
                color={
                  theme !== 'light'
                    ? colors.whiteLabel
                    : colors.alpha(colors.blueGreyDark, 0.8)
                }
              >
                􀁰
              </Symbol>
            )}
          </Row>
        </SpeedButton>
      </Column>
    </Row>
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
