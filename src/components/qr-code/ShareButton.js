import React, { useCallback } from 'react';
import { Share } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Centered, InnerBorder } from '../layout';
import { Text } from '../text';
import { darkMode } from '@rainbow-me/config/debug';
import { colors } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadows = [
  [0, 10, 30, colors.shadow, 0.2],
  [0, 5, 15, colors.shadow, darkMode ? 0 : 0.4],
];

const Label = styled(Text).attrs({
  align: 'center',
  color: colors.whiteLabel,
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

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      overflowMargin={20}
      radiusAndroid={28}
      {...props}
    >
      <ShadowStack
        backgroundColor={darkMode ? colors.white : colors.dark}
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
