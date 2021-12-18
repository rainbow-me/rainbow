import React, { useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '../../navigation/Navigation';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import HeaderButton from './HeaderButton';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled';
import { padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const DiscoverButtonShadowsFactory = colors => [
  [0, 7, 21, colors.shadow, 0.06],
  [0, 3.5, 10.5, colors.shadow, 0.04],
];

const BackgroundFill = styled.View({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }) => colors.white,
  opacity: 0.5,
});

const BackgroundGradient = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.offWhite,
    end: { x: 0.5, y: 1 },
    start: { x: 0.5, y: 0 },
  })
)({
  ...position.coverAsObject,
});

const DiscoverButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 2,
})({
  alignItems: 'center',
  justifyContent: 'center',
  ...padding.object(2, 10, 7.5),
  height: 34,
  zIndex: 2,
});

export default function DiscoverHeaderButton() {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const onPress = useCallback(() => navigate(Routes.QR_SCANNER_SCREEN), [
    navigate,
  ]);

  const onLongPress = useCallback(() => navigate(Routes.CONNECTED_DAPPS), [
    navigate,
  ]);

  const shadows = useMemo(() => DiscoverButtonShadowsFactory(colors), [colors]);

  return (
    <HeaderButton
      {...(__DEV__ ? { onLongPress } : {})}
      onPress={onPress}
      paddingLeft={0}
      paddingRight={0}
      scaleTo={0.9}
      testID="discover-button"
      transformOrigin="right"
    >
      <Row>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={colors.white}
          borderRadius={50}
          shadows={shadows}
          {...(android && {
            height: 34,
            width: 120,
          })}
        >
          <BackgroundFill />
          <BackgroundGradient />
        </ShadowStack>
        <DiscoverButtonContent>
          <Text
            color={colors.dark}
            letterSpacing="roundedMedium"
            size="large"
            weight="bold"
            {...(android && { lineHeight: 32 })}
          >
            🪐 Discover
          </Text>
        </DiscoverButtonContent>
      </Row>
    </HeaderButton>
  );
}
