import React, { useCallback } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components/primitives';
import { useNavigation } from '../../navigation/Navigation';
import { Row, RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import HeaderButton from './HeaderButton';
import Routes from '@rainbow-me/routes';
import { colors, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const DiscoverButtonShadows = [
  [0, 7, 21, colors.dark, 0.06],
  [0, 3.5, 10.5, colors.dark, 0.04],
];

const BackgroundFill = styled.View`
  ${position.cover};
  background-color: ${colors.white};
  opacity: 0.5;
`;

const BackgroundGradient = styled(LinearGradient).attrs({
  colors: colors.gradients.offWhite,
  end: { x: 0.5, y: 1 },
  start: { x: 0.5, y: 0 },
})`
  ${position.cover};
`;

const DiscoverButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 2,
})`
  ${padding(5.5, 10, 7.5)};
  height: 34;
  z-index: 2;
`;

export default function DiscoverHeaderButton() {
  const { navigate } = useNavigation();

  const onPress = useCallback(() => navigate(Routes.QR_SCANNER_SCREEN), [
    navigate,
  ]);

  return (
    <HeaderButton
      onPress={onPress}
      scaleTo={0.9}
      testID="goToDiscover"
      transformOrigin="right"
    >
      <Row>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={colors.white}
          borderRadius={50}
          shadows={DiscoverButtonShadows}
        >
          <BackgroundFill />
          <BackgroundGradient />
        </ShadowStack>
        <DiscoverButtonContent>
          <Emoji lineHeight={18} size="medium">
            🪐
          </Emoji>
          <Text
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedTight"
            size="large"
            weight="bold"
          >
            Discover
          </Text>
        </DiscoverButtonContent>
      </Row>
    </HeaderButton>
  );
}
