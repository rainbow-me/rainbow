import React from 'react';
import { View } from 'react-native';
import Animated, { Value } from 'react-native-reanimated';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../../styles';
import { BackButton, HeaderButton } from '../header';
import { Icon } from '../icons';
import { Centered, InnerBorder, Row } from '../layout';
import { AnimatedNumber, Text } from '../text';

const Header = styled(Row).attrs({
  align: 'center',
  position: 'absolute',
  justify: 'space-between',
})`
  height: 42;
  margin-vertical: 12;
  top: -12;
  width: 100%;
  z-index: 10;
`;

export const FloatingActionButtonShadow = [
  [0, 2, 5, colors.dark, 0.2],
  [0, 6, 10, colors.dark, 0.14],
  [0, 1, 18, colors.dark, 0.12],
];

const Content = styled(Centered)`
  ${position.cover};
  background-color: ${colors.grey20};
`;

function Stack({ children, left }) {
  return (
    <>
      <View style={{ zIndex: 10, width: 58 }}>
        <ShadowStack
          style={{ position: 'absolute', top: 8, left: 8 }}
          {...borders.buildCircleAsObject(40)}
          shadows={FloatingActionButtonShadow}
        >
          <Content />
        </ShadowStack>
        <View style={{ top: 7, left, zIndex: 10 }}>{children}</View>
      </View>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { yPosition } = props;
  console.log(yPosition);
  return (
    <Header {...props}>
      <Stack left={3}>
        <Animated.View
          style={{
            opacity: Animated.block([
              Animated.call([yPosition], console.log),
              yPosition.interpolate({
                inputRange: [0, 10],
                outputRange: [0, 1],
              }),
            ]),
          }}
        >
          <BackButton color={colors.white} style={{ zIndex: 40 }} />
        </Animated.View>
      </Stack>
      <Stack left={-1.7}>
        <HeaderButton>
          <Icon color={colors.white} name="scanner" />
        </HeaderButton>
      </Stack>
    </Header>
  );
}
