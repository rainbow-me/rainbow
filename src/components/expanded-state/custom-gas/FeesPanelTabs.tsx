import { isEmpty, upperFirst } from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { ButtonPressAnimation } from '../../animations';
import EdgeFade from '../../discover-sheet/EdgeFade';
import { Column, Row } from '../../layout';
// import { Text } from '../../text';
import { useGas } from '@/hooks';
import styled from '@/styled-thing';
import { colors, margin, padding } from '@/styles';
import { gasUtils } from '@/utils';
import { AccentColorProvider, Box, Inline, Inset, Text } from '@/design-system';
import { useTheme } from '@/theme';

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

// const TabPillText = styled(Text).attrs({
//   align: 'center',
//   size: 'lmedium',
//   weight: 'heavy',
// })({
//   // @ts-expect-error
//   color: ({ isSelected, theme: { colors }, color }) =>
//     isSelected
//       ? colors.whiteLabel
//       : colors.alpha(color || colors.appleBlue, 0.9),

//   ...margin.object(
//     android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
//     0,
//     android ? -ANDROID_EXTRA_LINE_HEIGHT : 0,
//     0
//   ),
// });

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
  const { isDarkMode } = useTheme();
  const handleOnPress = () => handleOnPressTabPill(label);
  const shadowColor = isDarkMode
    ? colors.shadowBlack
    : color || colors.appleBlue;

  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-expect-error
      onPress={handleOnPress}
      scaleTo={0.8}
      testID={testID}
      paddingHorizontal="5px"
    >
      <AccentColorProvider
        color={
          isSelected
            ? color || colors.appleBlue
            : colors.alpha(color || colors.appleBlue, 0.06)
        }
      >
        <Box
          background="accent"
          height="30px"
          paddingHorizontal="10px"
          paddingVertical="5px"
          borderRadius={15}
          alignItems="center"
          style={{
            shadowColor: isSelected ? shadowColor : colors.transparent,
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          }}
        >
          <Inset vertical="4px">
            <Inline alignVertical="bottom">
              <Text
                color={{
                  custom: isSelected
                    ? colors.whiteLabel
                    : colors.alpha(color || colors.appleBlue, 0.9),
                }}
                align="center"
                size="16px"
                weight="heavy"
              >
                {upperFirst(label)}
              </Text>
            </Inline>
          </Inset>
        </Box>
      </AccentColorProvider>
    </Box>
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
    <Inline alignHorizontal="center">
      {speeds.map(speed => (
        <Box key={speed}>
          <TabPill
            color={colorForAsset}
            handleOnPressTabPill={handleOnPressTabPill}
            isSelected={selectedGasFeeOption === speed}
            label={speed}
            testID={`speed-pill-${speed}`}
          />
        </Box>
      ))}
      <EdgeFade />
    </Inline>
  );
}
