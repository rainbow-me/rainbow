import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Share } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Centered, InnerBorder } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled-components';
import ShadowStack from 'react-native-shadow-stack';

const Label = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  lineHeight: 'looser',
  size: 'larger',
  weight: 'heavy',
}))({
  bottom: 2,
});

export default function ShareButton({ accountAddress, ...props }) {
  const handlePress = useCallback(() => {
    Share.share({
      message: accountAddress,
      title: lang.t('wallet.my_account_address'),
    });
  }, [accountAddress]);

  const { isDarkMode, colors } = useTheme();

  const shadows = useMemo(
    () => [
      [0, 10, 30, colors.shadow, 0.2],
      [0, 5, 15, colors.shadow, isDarkMode ? 0 : 0.4],
    ],
    [isDarkMode, colors]
  );

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      overflowMargin={20}
      radiusAndroid={28}
      {...props}
    >
      <ShadowStack
        backgroundColor={isDarkMode ? colors.white : colors.dark}
        borderRadius={28}
        height={56}
        shadows={shadows}
        width={123}
      >
        <Centered cover>
          <Label>{`􀈂 ${lang.t('button.share')}`}</Label>
        </Centered>
        <InnerBorder />
      </ShadowStack>
    </ButtonPressAnimation>
  );
}
