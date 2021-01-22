import React, { useCallback } from 'react';
import { Share } from 'react-native';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Centered, InnerBorder } from '../layout';
import { Text } from '../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = darkMode => [
  [0, 10, 30, colors_NOT_REACTIVE.shadow, 0.2],
  [0, 5, 15, colors_NOT_REACTIVE.shadow, darkMode ? 0 : 0.4],
];

const shadowsDark = shadowsFactory(true);
const shadowsLight = shadowsFactory(false);

const Label = styled(Text).attrs({
  align: 'center',
  color: colors_NOT_REACTIVE.whiteLabel,
  size: 'larger',
  weight: 'bold',
})`
  margin-bottom: 4;
`;

export default function ShareButton({ accountAddress, ...props }) {
  const handlePress = useCallback(() => {
    Share.share({
      message: accountAddress,
      title: 'My account address:',
    });
  }, [accountAddress]);

  const { isDarkMode } = useTheme();
  const shadows = isDarkMode ? shadowsDark : shadowsLight;

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      overflowMargin={20}
      radiusAndroid={28}
      {...props}
    >
      <ShadowStack
        backgroundColor={
          isDarkMode ? colors_NOT_REACTIVE.white : colors_NOT_REACTIVE.dark
        }
        borderRadius={28}
        height={56}
        shadows={shadows}
        width={123}
      >
        <Centered cover>
          <Label>􀈂 Share</Label>
        </Centered>
        <InnerBorder />
      </ShadowStack>
    </ButtonPressAnimation>
  );
}
