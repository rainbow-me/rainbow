import lang from 'i18n-js';
import React, { useMemo } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { TruncatedText } from '../text';
import CaretImageSource from '@/assets/family-dropdown-arrow.png';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

const TokenSelectionButtonHeight = 46;
const TokenSelectionButtonMaxWidth = 130;
const TokenSelectionButtonElevation = ios ? 0 : 8;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})({
  ...padding.object(11.5, 14, 13.5, 16),
  height: TokenSelectionButtonHeight,
  zIndex: 1,
});

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  resizeMode: ImgixImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.whiteLabel,
  size: 30,
}))({
  height: 18,
  top: 0.5,
  width: 8,
});

export default function TokenSelectionButton({ color, borderRadius = 30, onPress, symbol, testID }) {
  const { isDarkMode, colors } = useTheme();

  const shadowsForAsset = useMemo(
    () => [
      [0, 10, 30, colors.shadow, 0.2],
      [0, 5, 15, color, isDarkMode ? 0 : 0.4],
    ],
    [color, colors.shadow, isDarkMode]
  );

  return (
    <ButtonPressAnimation
      borderRadius={borderRadius}
      contentContainerStyle={{
        backgroundColor: color,
        borderRadius,
      }}
      {...(symbol && { maxWidth: TokenSelectionButtonMaxWidth })}
      onPress={onPress}
      radiusAndroid={borderRadius}
      testID={testID}
    >
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        elevation={TokenSelectionButtonElevation}
        shadows={shadowsForAsset}
      />
      <Content>
        <TruncatedText
          align="center"
          color={colors.whiteLabel}
          {...(android && { lineHeight: 21 })}
          size="large"
          testID={testID + '-text'}
          weight="bold"
        >
          {symbol ?? lang.t('swap.choose_token')}
        </TruncatedText>
        <CaretIcon />
      </Content>
      <InnerBorder radius={borderRadius} />
    </ButtonPressAnimation>
  );
}
