import { upperFirst } from 'lodash';
import React from 'react';
import { ScrollView, View } from 'react-native';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import EdgeFade from '../../discover-sheet/EdgeFade';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import { useGas } from '@rainbow-me/hooks';
import { margin, padding } from '@rainbow-me/styles';
import { gasUtils } from '@rainbow-me/utils';

const PillScrollViewStyle = { flexGrow: 1, justifyContent: 'center' };
const ANDROID_EXTRA_LINE_HEIGHT = 6;

export const TabPillWrapper = styled(View).attrs({})`
  ${padding(5, 10)};
  ${margin(20, 4, 24, 4)};
  border: ${({ isSelected, color, theme: { colors } }) =>
    `2px solid ${isSelected ? color || colors.appleBlue : colors.rowDivider}`};
  border-radius: 15px;
`;
export const TabPillText = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})`
  color: ${({ isSelected, theme: { colors }, color }) =>
    `${isSelected ? color || colors.appleBlue : colors.blueGreyDark50}`};
  ${margin(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  )}
`;

const TabPill = ({
  label,
  isSelected,
  handleOnPressTabPill,
  color,
  testID,
}) => {
  const handleOnPress = () => {
    handleOnPressTabPill(label);
  };
  return (
    <ButtonPressAnimation onPress={handleOnPress} testID={testID}>
      <TabPillWrapper color={color} isSelected={isSelected}>
        <TabPillText
          color={color}
          isSelected={isSelected}
          size="lmedium"
          weight="bold"
        >
          {upperFirst(label)}
        </TabPillText>
      </TabPillWrapper>
    </ButtonPressAnimation>
  );
};

export default function FeesPanelTabs({ onPressTabPill, colorForAsset }) {
  const { updateGasFeeOption, selectedGasFeeOption } = useGas();
  const handleOnPressTabPill = label => {
    updateGasFeeOption(label);
    onPressTabPill();
  };
  return (
    <Row align="center">
      <ScrollView contentContainerStyle={PillScrollViewStyle} horizontal>
        {gasUtils.GasSpeedOrder.map(speed => (
          <Column key={speed}>
            <TabPill
              color={colorForAsset}
              handleOnPressTabPill={handleOnPressTabPill}
              isSelected={selectedGasFeeOption === speed}
              label={speed}
              testID={`speed-pill-${speed}`}
            />
          </Column>
        ))}
      </ScrollView>
      <EdgeFade />
    </Row>
  );
}
