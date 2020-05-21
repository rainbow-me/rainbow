import React, { useCallback } from 'react';
import { View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/primitives';
import { isAvatarPickerAvailable } from '../../config/experimental';
import {
  useAccountSettings,
  useCoinListEdited,
  useRequests,
} from '../../hooks';
import Routes from '../../screens/Routes/routesNames';
import { borders, colors } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import Avatar from '../Avatar';
import { OpacityToggler } from '../animations';
import { Badge } from '../badge';
import { Centered, InnerBorder } from '../layout';
import { Text } from '../text';
import HeaderButton from './HeaderButton';

const shadows = [
  [0, 2, 2.5, colors.dark, 0.08],
  [0, 6, 5, colors.dark, 0.12],
];

const FirstLetter = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  letterSpacing: -0.6,
  lineHeight: 34,
  size: 'big',
  weight: 'regular',
})`
  width: 100%;
`;

const FirstLetterCircleBackground = styled.View`
  ${borders.buildCircle(34)};
  background-color: ${({ color }) => color};
  z-index: 10;
`;

export default function ProfileHeaderButton() {
  const { navigate } = useNavigation();
  const { pendingRequestCount } = useRequests();
  const { isCoinListEdited } = useCoinListEdited();
  const { accountColor, accountName } = useAccountSettings();

  const onPress = useCallback(() => navigate(Routes.PROFILE_SCREEN), [
    navigate,
  ]);

  return (
    <OpacityToggler
      endingOpacity={0.4}
      isVisible={isCoinListEdited}
      startingOpacity={1}
    >
      <View pointerEvents={isCoinListEdited ? 'none' : 'auto'}>
        <HeaderButton
          onPress={onPress}
          testID="goToProfile"
          transformOrigin="left"
        >
          <Centered>
            {isAvatarPickerAvailable ? (
              <ShadowStack
                backgroundColor={colors.avatarColor[accountColor]}
                borderRadius={65}
                height={34}
                shadows={shadows}
                width={34}
              >
                <FirstLetterCircleBackground
                  color={colors.avatarColor[accountColor]}
                >
                  <FirstLetter>{getFirstGrapheme(accountName)}</FirstLetter>
                  <InnerBorder opacity={0.04} radius={34} />
                </FirstLetterCircleBackground>
              </ShadowStack>
            ) : (
              <Avatar size={34} />
            )}
            {pendingRequestCount > 0 && (
              <Badge delay={1500} value={pendingRequestCount} zIndex={1} />
            )}
          </Centered>
        </HeaderButton>
      </View>
    </OpacityToggler>
  );
}
