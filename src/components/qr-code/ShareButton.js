import React, { useCallback } from 'react';
import { Share } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Centered, InnerBorder } from '../layout';
import { Text } from '../text';

const shadows = [
  [0, 10, 30, colors.dark, 0.2],
  [0, 5, 15, colors.dark, 0.4],
];

const Label = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  size: 'larger',
  weight: 'bold',
})`
  margin-bottom: 2;
`;

export default function ShareButton({ accountAddress, ...props }) {
  const handlePress = useCallback(() => {
    Share.share({
      message: accountAddress,
      title: 'My account address:',
    });
  }, [accountAddress]);

  return (
    <ButtonPressAnimation onPress={handlePress} {...props}>
      <ShadowStack
        backgroundColor={colors.dark}
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
