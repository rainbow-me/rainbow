import React, { useCallback } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { useNavigation } from '../../navigation/Navigation';
import Routes from '../../screens/Routes/routesNames';
import { borders, colors } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import HeaderButton from './HeaderButton';

const CameraHeaderButtonShadows = [
  [0, 3, 5, colors.dark, 0.2],
  [0, 6, 10, colors.dark, 0.14],
];

const CameraIcon = styled(Icon).attrs({
  color: colors.white,
  name: 'camera',
})`
  margin-bottom: 1;
  max-width: 18;
`;

export default function CameraHeaderButton() {
  const { navigate } = useNavigation();

  const onPress = useCallback(() => navigate(Routes.QR_SCANNER_SCREEN), [
    navigate,
  ]);

  return (
    <HeaderButton onPress={onPress} testID="goToCamera" transformOrigin="right">
      <ShadowStack
        {...borders.buildCircleAsObject(34)}
        backgroundColor={colors.paleBlue}
        shadows={CameraHeaderButtonShadows}
      >
        <Centered cover>
          <CameraIcon />
        </Centered>
      </ShadowStack>
    </HeaderButton>
  );
}
