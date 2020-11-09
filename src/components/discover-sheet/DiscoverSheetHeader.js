import React, { useContext } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Row } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import ShadowStack from 'react-native-shadow-stack';

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

function Stack({ children, left, yPosition, onPress }) {
  return (
    <>
      <ButtonPressAnimation
        onPress={onPress}
        style={{ height: 45, width: 58, zIndex: 10 }}
      >
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
        <View style={{ left, top: 17, zIndex: 10 }}>
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
      </ButtonPressAnimation>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { navigate } = useNavigation();
  const { jumpToShort } = useContext(DiscoverSheetContext);
  const { yPosition } = props;
  return (
    <Header {...props} pointerEvents="box-none">
      <Stack
        left={20}
        onPress={() => navigate(Routes.WALLET_SCREEN)}
        yPosition={yPosition}
      >
        <Icon color={colors.black} direction="left" name="caret" {...props} />
        <Icon color={colors.white} direction="left" name="caret" {...props} />
      </Stack>
      <Stack left={16.6} onPress={jumpToShort} yPosition={yPosition}>
        <Icon color={colors.black} name="scanner" />
        <Icon color={colors.white} name="scanner" />
      </Stack>
    </Header>
  );
}
