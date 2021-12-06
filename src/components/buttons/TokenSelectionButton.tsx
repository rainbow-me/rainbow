import React, { useMemo } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import CaretImageSource from '@rainbow-me/assets/family-dropdown-arrow.png';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const TokenSelectionButtonHeight = 46;
// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const TokenSelectionButtonElevation = ios ? 0 : 8;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})`
  ${padding(11.5, 14, 13.5, 16)};
  height: ${TokenSelectionButtonHeight};
  z-index: 1;
`;

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.whiteLabel,
}))`
  height: 18;
  top: 0.5;
  width: 8;
`;

export default function TokenSelectionButton({
  address,
  borderRadius = 30,
  onPress,
  symbol,
  testID,
}: any) {
  const { isDarkMode, colors } = useTheme();

  const colorForAsset = useColorForAsset(
    { address },
    address ? undefined : colors.appleBlue
  );

  const shadowsForAsset = useMemo(
    () => [
      [0, 10, 30, colors.shadow, 0.2],
      [0, 5, 15, colorForAsset, isDarkMode ? 0 : 0.4],
    ],
    [colorForAsset, colors.shadow, isDarkMode]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      borderRadius={borderRadius}
      contentContainerStyle={{
        backgroundColor: colorForAsset,
        borderRadius,
      }}
      onPress={onPress}
      radiusAndroid={borderRadius}
      testID={testID}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={colorForAsset}
        borderRadius={borderRadius}
        elevation={TokenSelectionButtonElevation}
        shadows={shadowsForAsset}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Content>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text
          align="center"
          color={colors.whiteLabel}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          {...(android && { lineHeight: 21 })}
          size="large"
          testID={testID + '-text'}
          weight="bold"
        >
          {symbol || 'Choose Token'}
        </Text>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CaretIcon />
      </Content>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <InnerBorder radius={borderRadius} />
    </ButtonPressAnimation>
  );
}
