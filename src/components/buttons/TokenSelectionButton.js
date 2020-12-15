import React, { useMemo } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import CaretImageSource from '@rainbow-me/assets/family-dropdown-arrow.png';
import { useColorForAsset } from '@rainbow-me/hooks';
import { colors, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const TokenSelectionButtonHeight = 46;
const TokenSelectionButtonElevation = ios ? 0 : 8;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})`
  ${padding(11, 14, 14, 16)};
  height: ${TokenSelectionButtonHeight};
  z-index: 1;
`;

const CaretIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: CaretImageSource,
  tintColor: colors.white,
})`
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
}) {
  const colorForAsset = useColorForAsset(
    { address },
    address ? undefined : colors.appleBlue
  );

  const shadowsForAsset = useMemo(
    () => [
      [0, 10, 30, colors.dark, 0.2],
      [0, 5, 15, colorForAsset, 0.4],
    ],
    [colorForAsset]
  );

  return (
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
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={colorForAsset}
        borderRadius={borderRadius}
        elevation={TokenSelectionButtonElevation}
        shadows={shadowsForAsset}
      />
      <Content>
        <Text
          align="center"
          color={colors.white}
          size="large"
          testID={testID + '-text'}
          weight="bold"
        >
          {symbol || 'Choose Token'}
        </Text>
        <CaretIcon />
      </Content>
      <InnerBorder radius={borderRadius} />
    </ButtonPressAnimation>
  );
}
