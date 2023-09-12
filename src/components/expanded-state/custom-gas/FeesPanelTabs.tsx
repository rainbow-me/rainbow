import { isEmpty } from 'lodash';
import React from 'react';
import { ButtonPressAnimation } from '../../animations';
import { useGas } from '@/hooks';
import { colors } from '@/styles';
import { gasUtils } from '@/utils';
import { AccentColorProvider, Box, Inline, Inset, Text } from '@/design-system';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';

const { CUSTOM, URGENT, GasSpeedOrder } = gasUtils;

type TabPillProps = {
  speed: string;
  isSelected: boolean;
  handleOnPressTabPill: (speed: string) => void;
  color: string;
  testID?: string;
};

type FeesPanelTabsProps = {
  colorForAsset: string;
  speeds: typeof GasSpeedOrder;
};

const TabPill = ({
  speed,
  isSelected,
  handleOnPressTabPill,
  color,
  testID,
}: TabPillProps) => {
  const { isDarkMode } = useTheme();
  const handleOnPress = () => handleOnPressTabPill(speed);
  const shadowColor = isDarkMode
    ? colors.shadowBlack
    : color || colors.appleBlue;

  const label = gasUtils.getGasLabel(speed);

  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-ignore overloaded props
      onPress={handleOnPress}
      scaleTo={0.8}
      testID={testID}
      paddingHorizontal="5px (Deprecated)"
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
          borderRadius={15}
          alignItems="center"
          style={{
            shadowColor: isSelected ? shadowColor : colors.transparent,
            shadowOffset: { height: 4, width: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          <Inset vertical={{ custom: IS_ANDROID ? 8 : 9 }}>
            <Text
              size="16px / 22px (Deprecated)"
              color={{
                custom: isSelected
                  ? colors.whiteLabel
                  : colors.alpha(color || colors.appleBlue, 0.9),
              }}
              align="center"
              weight="heavy"
            >
              {label}
            </Text>
          </Inset>
        </Box>
      </AccentColorProvider>
    </Box>
  );
};

export default function FeesPanelTabs({
  colorForAsset,
  speeds = GasSpeedOrder,
}: FeesPanelTabsProps) {
  const {
    updateGasFeeOption,
    selectedGasFeeOption,
    gasFeeParamsBySpeed,
    updateToCustomGasFee,
  } = useGas();

  const handleOnPressTabPill = (speed: string) => {
    if (speed === CUSTOM && isEmpty(gasFeeParamsBySpeed[CUSTOM])) {
      const gasFeeParams = gasFeeParamsBySpeed[URGENT];
      updateToCustomGasFee({
        ...gasFeeParams,
        option: CUSTOM,
      });
    } else {
      updateGasFeeOption(speed);
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
            speed={speed}
            testID={`speed-pill-${speed}`}
          />
        </Box>
      ))}
    </Inline>
  );
}
