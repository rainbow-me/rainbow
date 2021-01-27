import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigation } from '../../navigation/Navigation';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';
import Routes from '@rainbow-me/routes';
import { borders } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const CameraHeaderButtonShadows = colors => [
  [0, 3, 5, colors.shadow, 0.2],
  [0, 6, 10, colors.shadow, 0.14],
];

const CameraIcon = styled(Icon).attrs(({ theme: { colors } }) => ({
  color: colors.whiteLabel,
  name: 'camera',
}))`
  margin-bottom: 1;
  max-width: 18;
`;

export default function CameraHeaderButton() {
  const { navigate } = useNavigation();

  const onPress = useCallback(() => navigate(Routes.QR_SCANNER_SCREEN), [
    navigate,
  ]);

  const { colors } = useTheme();

  const shadows = useMemo(() => CameraHeaderButtonShadows(colors), [colors]);

  return (
    <HeaderButton onPress={onPress} testID="goToCamera" transformOrigin="right">
      <ShadowStack
        {...borders.buildCircleAsObject(34)}
        backgroundColor={colors.paleBlue}
        shadows={shadows}
      >
        <Centered cover>
          <CameraIcon />
        </Centered>
      </ShadowStack>
    </HeaderButton>
  );
}
