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

export const TabPillWrapper = styled(View).attrs({})`
  ${padding(4, 8)};
  ${margin(15, 4, 4)};
  border: ${({ isSelected, theme: { colors } }) =>
    `2px solid ${isSelected ? colors.appleBlue : colors.rowDivider}`};
  border-radius: 15px;
`;
export const TabPillText = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})`
  color: ${({ isSelected, theme: { colors } }) =>
    `${isSelected ? colors.appleBlue : colors.blueGreyDark50}`};
`;

const TabPill = ({ label, isSelected, handleOnPressTabPill }) => {
  const handleOnPress = () => {
    handleOnPressTabPill(label);
  };
  return (
    <ButtonPressAnimation onPress={handleOnPress}>
      <TabPillWrapper isSelected={isSelected}>
        <TabPillText isSelected={isSelected} size="lmedium" weight="bold">
          {upperFirst(label)}
        </TabPillText>
      </TabPillWrapper>
    </ButtonPressAnimation>
  );
};

export default function FeesPanelTabs() {
  const { updateGasFeeOption, selectedGasFeeOption } = useGas();
  const handleOnPressTabPill = label => {
    updateGasFeeOption(label);
  };
  return (
    <Row align="center">
      <ScrollView contentContainerStyle={PillScrollViewStyle} horizontal>
        {gasUtils.GasSpeedOrder.map(speed => (
          <Column key={speed}>
            <TabPill
              handleOnPressTabPill={handleOnPressTabPill}
              isSelected={selectedGasFeeOption === speed}
              label={speed}
            />
          </Column>
        ))}
      </ScrollView>
      <EdgeFade />
    </Row>
  );
}
