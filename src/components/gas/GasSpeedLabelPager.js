import { upperFirst } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Row } from '../layout';
import { Text } from '../text';
import { GasSpeedEmoji } from '.';
import { margin, padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  height: 30,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  ${padding(2.5, 4, android ? 2.5 : 3.5, 5)};
  border-radius: 19;
`;

const Symbol = styled(Text).attrs({
  align: 'center',
  lineHeight: 'normal',
  size: android ? 'bmedium' : 'lmedium',
  weight: 'heavy',
})`
  ${margin(0)};
`;

const GasSpeedLabel = styled(Text).attrs({
  align: 'center',
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})`
  ${padding(0, 3)};
`;

const GasSpeedLabelPager = ({
  label,
  theme,
  onPress,
  colorForAsset,
  dropdownEnabled,
}) => {
  const { colors } = useTheme();

  return (
    <SpeedButton
      color={colorForAsset}
      disabled={!dropdownEnabled}
      onPress={onPress}
    >
      <Row>
        <GasSpeedEmoji label={label} />
        <GasSpeedLabel
          color={
            theme === 'dark'
              ? colors.whiteLabel
              : colors.alpha(colors.blueGreyDark, 0.8)
          }
        >
          {upperFirst(label)}
        </GasSpeedLabel>
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
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
