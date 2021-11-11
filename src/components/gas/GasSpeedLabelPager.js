import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Row } from '../layout';
import { Text } from '../text';
import GasSpeedLabelPagerItem from './GasSpeedLabelPagerItem';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  height: 30,
})`
  border: ${({ color, theme: { colors } }) =>
    `2px solid ${color || colors.appleBlue}`};
  ${padding(3, 6)};
  border-radius: 19;
`;

const Symbol = styled(Text).attrs({
  align: 'right',
  lineHeight: 'normal',
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
    <SpeedButton
      color={colorForAsset}
      disabled={!dropdownEnabled}
      onPress={onPress}
    >
      <Row>
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
  );
};

export default magicMemo(GasSpeedLabelPager, 'label');
