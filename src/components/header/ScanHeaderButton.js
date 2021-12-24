import React, { useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '../../navigation/Navigation';
import { jumpToShort } from '../discover-sheet/DiscoverSheet';
import Icon from '../icons/Icon';
import { Row, RowWithMargins } from '../layout';
import HeaderButton from './HeaderButton';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import styled from 'rainbowed-components';
import ShadowStack from 'react-native-shadow-stack';

const ScanButtonShadowsFactory = colors => [
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

const ScanButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 2,
})({
  alignItems: 'center',
  height: 34,
  justifyContent: 'center',
  width: 34,
  zIndex: 2,
});

export default function ScanHeaderButton() {
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const onPress = useCallback(() => {
    jumpToShort();
    navigate(Routes.QR_SCANNER_SCREEN);
  }, [navigate]);

  const shadows = useMemo(() => ScanButtonShadowsFactory(colors), [colors]);

  return (
    <HeaderButton
      onPress={onPress}
      paddingLeft={10}
      scaleTo={0.9}
      testID="scan-button"
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
            width: 34,
          })}
        >
          <BackgroundFill />
          <BackgroundGradient />
        </ShadowStack>
        <ScanButtonContent>
          <Icon color={colors.dark} name="scan" />
        </ScanButtonContent>
      </Row>
    </HeaderButton>
  );
}
