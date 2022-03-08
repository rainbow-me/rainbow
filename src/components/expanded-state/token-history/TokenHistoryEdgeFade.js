import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { useDimensions } from '@rainbow-me/hooks';
import { Box } from '@rainbow-me/design-system';

const Fade = ({ color, alignment }) => (
  <Box
    as={LinearGradient}
    colors={['transparent', color]}
    end={{ x: 1, y: 0 }}
    start={{ x: 0, y: 1 }}
    height="full"
    position="absolute"
    left={alignment === 'left' ? '0px' : undefined}
    right={alignment === 'right' ? '0px' : undefined}
    width={{ custom: 19 }}
  />
);

const CenterView = styled(View)`
  margin-left: 19;
  width: ${({ width }) => width - 38};
  height: 100%;
  background-color: ${({ colors }) => colors.black};
`;

export default function TokenHistoryEdgeFade() {
  const { width } = useDimensions();
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: 'transparent' }}>
      <Fade color={colors.black} alignment="left" />
      <CenterView colors={colors} width={width} />
      <Fade color={colors.black} alignment="right" />
    </View>
  );
}
