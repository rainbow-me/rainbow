import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered, InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';
import { colors, padding, position } from '@rainbow-me/styles';

const Button = styled(Centered).attrs(({ size }) => ({
  scaleTo: size === 'big' ? 0.9 : 0.96,
}))`
  flex: 1;
  height: ${({ size }) => (size === 'big' ? 56 : 46)};
  z-index: 1;
`;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})`
  ${padding(10, 15, 14)}
  z-index: 1;
`;

const neverRerender = () => true;
// eslint-disable-next-line react/display-name
const WhiteButtonGradient = React.memo(
  () => (
    <LinearGradient
      borderRadius={49}
      colors={['#FFFFFF', '#F7F9FA']}
      end={{ x: 0.5, y: 1 }}
      opacity={0.5}
      pointerEvents="none"
      start={{ x: 0.5, y: 0 }}
      style={position.coverAsObject}
    />
  ),
  neverRerender
);

const SheetActionButton = ({
  borderRadius = 56,
  color = colors.appleBlue,
  emoji,
  icon,
  label,
  size,
  textColor = colors.white,
  ...props
}) => {
  const shadowsForButtonColor = useMemo(
    () => [
      [0, 10, 30, colors.dark, 0.2],
      [0, 5, 15, color, 0.4],
    ],
    [color]
  );

  return (
    <Button as={ButtonPressAnimation} size={size} {...props}>
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        shadows={shadowsForButtonColor}
      >
        {color === colors.white && <WhiteButtonGradient />}
        {color !== colors.white && <InnerBorder radius={borderRadius} />}
      </ShadowStack>
      <Content size={size}>
        {emoji && <Emoji lineHeight={23} name={emoji} size="medium" />}
        {icon && <Icon color="white" name={icon} size={18} height={18} />}
        <Text
          align="center"
          color={textColor}
          size={size === 'big' ? 'larger' : 'large'}
          weight="semibold"
        >
          {label}
        </Text>
      </Content>
    </Button>
  );
};

export default React.memo(SheetActionButton);
