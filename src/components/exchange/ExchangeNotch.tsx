import React from 'react';
import FastImage from 'react-native-fast-image';
import ExchangeNotchLeft from '@/assets/exchangeNotchLeft.png';
import ExchangeNotchLeftDark from '@/assets/exchangeNotchLeftDark.png';
import ExchangeNotchMiddle from '@/assets/exchangeNotchMiddle.png';
import ExchangeNotchMiddleDark from '@/assets/exchangeNotchMiddleDark.png';
import ExchangeNotchRight from '@/assets/exchangeNotchRight.png';
import ExchangeNotchRightDark from '@/assets/exchangeNotchRightDark.png';
import { Box } from '@rainbow-me/design-system';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { useTheme } from '@rainbow-me/theme';

const notchHeight = 48;
const notchSideWidth = 78;
const ANDROID_NOTCH_OFFSET = 8;

const NotchMiddle = styled(FastImage).attrs(
  ({ isDarkMode }: { isDarkMode: boolean }) => ({
    resizeMode: FastImage.resizeMode.stretch,
    source: isDarkMode ? ExchangeNotchMiddleDark : ExchangeNotchMiddle,
  })
)({
  height: notchHeight,
  left: android ? -ANDROID_NOTCH_OFFSET : 0,
  width: ({ deviceWidth }: { deviceWidth: number }) =>
    deviceWidth - notchSideWidth * 2.11,
});

const NotchSide = styled(FastImage)({
  height: android ? notchHeight + 2 : notchHeight,
  left: android ? -ANDROID_NOTCH_OFFSET : 0,
  width: android ? notchSideWidth + ANDROID_NOTCH_OFFSET : notchSideWidth,
});

interface ExchangeNotchProps {
  testID: string;
}

export default function ExchangeNotch({ testID }: ExchangeNotchProps) {
  const { width: deviceWidth } = useDimensions();
  const { isDarkMode } = useTheme();
  return (
    <Box
      flexDirection="row"
      height={{ custom: notchHeight }}
      left="0px"
      pointerEvents="none"
      position="absolute"
      testID={`${testID}-notch`}
      top={{ custom: 132 }}
    >
      <NotchSide
        source={isDarkMode ? ExchangeNotchLeftDark : ExchangeNotchLeft}
      />
      <NotchMiddle deviceWidth={deviceWidth} isDarkMode={isDarkMode} />
      <NotchSide
        source={isDarkMode ? ExchangeNotchRightDark : ExchangeNotchRight}
      />
    </Box>
  );
}
