import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../../styles';
import { BackButton, HeaderButton } from '../header';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';

const Header = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
  position: 'absolute',
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

function Stack({ children, left, yPosition }) {
  return (
    <>
      <View style={{ width: 58, zIndex: 10 }}>
        <Animated.View
          style={{
            opacity: yPosition.interpolate({
              inputRange: [0, 30],
              outputRange: [0, 1],
            }),
          }}
        >
          <ShadowStack
            style={{ left: 8, position: 'absolute', top: 8 }}
            {...borders.buildCircleAsObject(40)}
            shadows={FloatingActionButtonShadow}
          >
            <Content />
          </ShadowStack>
        </Animated.View>
        <View style={{ left, top: 7, zIndex: 10 }}>
          <View style={{ position: 'absolute' }}>{children[0]}</View>

          <Animated.View
            style={{
              opacity: yPosition.interpolate({
                inputRange: [0, 30],
                outputRange: [0, 1],
              }),
            }}
          >
            {children[1]}
          </Animated.View>
        </View>
      </View>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { yPosition } = props;
  return (
    <Header {...props} pointerEvents="box-none">
      <Stack left={3} yPosition={yPosition}>
        <BackButton color={colors.black} style={{ zIndex: 40 }} />
        <BackButton color={colors.white} style={{ zIndex: 40 }} />
      </Stack>
      <Stack left={-1.7} yPosition={yPosition}>
        <HeaderButton>
          <Icon color={colors.black} name="scanner" />
        </HeaderButton>
        <HeaderButton>
          <Icon color={colors.white} name="scanner" />
        </HeaderButton>
      </Stack>
    </Header>
  );
}
