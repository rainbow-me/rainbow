import { isEmpty, upperFirst } from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { ButtonPressAnimation } from '../../animations';
import EdgeFade from '../../discover-sheet/EdgeFade';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import { useGas } from '@/hooks';
import styled from '@/styled-thing';
import { margin, padding } from '@/styles';
import { gasUtils } from '@/utils';

const ANDROID_EXTRA_LINE_HEIGHT = 6;

const { CUSTOM, URGENT, GasSpeedOrder } = gasUtils;

const TabPillsContainer = styled(Row).attrs({
  align: 'center',
})({
  justifyContent: 'center',
});

const TabPillWrapper = styled(View).attrs({})({
  ...padding.object(5, 10),
  ...margin.object(0, 5, 0, 5),
  // @ts-expect-error
  backgroundColor: ({ isSelected, color, theme: { colors } }) =>
    isSelected
      ? color || colors.appleBlue
      : colors.alpha(color || colors.appleBlue, 0.06),
  borderRadius: 15,
  height: 30,
  lineHeight: 20,
  // @ts-expect-error
  shadowColor: ({ color, isSelected, theme: { colors, isDarkMode } }) =>
    isSelected
      ? isDarkMode
        ? colors.shadowBlack
        : color || colors.appleBlue
      : colors.transparent,
  shadowOffset: { height: 4, width: 0 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
});

const TabPillText = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'heavy',
})({
  // @ts-expect-error
  color: ({ isSelected, theme: { colors }, color }) =>
    isSelected
      ? colors.whiteLabel
      : colors.alpha(color || colors.appleBlue, 0.9),

  ...margin.object(
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0,
    android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
    0
  ),
});

const TabPill = ({
  label,
  isSelected,
  handleOnPressTabPill,
  color,
  testID,
}: {
  label: string;
  isSelected: boolean;
  handleOnPressTabPill: (label: string) => void;
  color: string;
  testID?: string;
}) => {
  const handleOnPress = () => handleOnPressTabPill(label);

  return (
    <ButtonPressAnimation onPress={handleOnPress} scaleTo={0.8} testID={testID}>
      <TabPillWrapper color={color} isSelected={isSelected}>
        <TabPillText color={color} isSelected={isSelected}>
          {upperFirst(label)}
        </TabPillText>
      </TabPillWrapper>
    </ButtonPressAnimation>
  );
};

export default function FeesPanelTabs({
  colorForAsset,
  speeds = GasSpeedOrder,
}: {
  colorForAsset: string;
  speeds: typeof GasSpeedOrder;
}) {
  const {
    updateGasFeeOption,
    selectedGasFeeOption,
    gasFeeParamsBySpeed,
    updateToCustomGasFee,
  } = useGas();

  const handleOnPressTabPill = (label: string) => {
    if (label === CUSTOM && isEmpty(gasFeeParamsBySpeed[CUSTOM])) {
      const gasFeeParams = gasFeeParamsBySpeed[URGENT];
      updateToCustomGasFee({
        ...gasFeeParams,
        option: CUSTOM,
      });
    } else {
      updateGasFeeOption(label);
    }
  };

  return (
    <TabPillsContainer>
      {speeds.map(speed => (
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
      <EdgeFade />
    </TabPillsContainer>
  );
}
