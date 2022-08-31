import { isEmpty, upperFirst } from 'lodash';
import React from 'react';
import { ButtonPressAnimation } from '../../animations';
import EdgeFade from '../../discover-sheet/EdgeFade';
import { useGas } from '@/hooks';
import { colors } from '@/styles';
import { gasUtils } from '@/utils';
import { AccentColorProvider, Box, Inline, Inset, Text } from '@/design-system';
import { useTheme } from '@/theme';

const { CUSTOM, URGENT, GasSpeedOrder } = gasUtils;

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
