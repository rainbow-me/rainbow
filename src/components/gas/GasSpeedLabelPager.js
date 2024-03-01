import { upperFirst } from 'lodash';
import React from 'react';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { Row } from '../layout';
import { Text } from '../text';
import { GasSpeedEmoji } from '.';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { magicMemo } from '@/utils';

const SpeedButton = styled(ButtonPressAnimation).attrs({
  hapticType: 'impactHeavy',
  height: 30,
})({
  ...padding.object(2.5, 4, android ? 2.5 : 3.5, 5),
  borderColor: ({ color, theme: { colors } }) => color ?? colors.appleBlue,
  borderRadius: 19,
  borderWidth: 2,
});

const Symbol = styled(Text).attrs({
  align: 'center',
  lineHeight: 'normal',
  size: android ? 'bmedium' : 'lmedium',
  weight: 'heavy',
})(margin.object(0));

const GasSpeedLabel = styled(Text).attrs({
  align: 'center',
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})({
  ...padding.object(0, 3),
});

const GasSpeedLabelPager = ({ label, theme, onPress, colorForAsset, dropdownEnabled }) => {
  const { colors } = useTheme();

  return (
    <SpeedButton color={colorForAsset} disabled={!dropdownEnabled} onPress={onPress}>
      <Row>
        <GasSpeedEmoji label={label} />
        <GasSpeedLabel color={theme === 'dark' ? colors.whiteLabel : colors.alpha(colors.blueGreyDark, 0.8)}>
          {upperFirst(label)}
        </GasSpeedLabel>
        {dropdownEnabled && <Symbol color={theme !== 'light' ? colors.whiteLabel : colors.alpha(colors.blueGreyDark, 0.8)}>􀁰</Symbol>}
      </Row>
    </SpeedButton>
  );
};

export default magicMemo(GasSpeedLabelPager, ['label', 'theme', 'onPress', 'colorForAsset']);
