import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered, InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';
import { containsEmoji } from '@rainbow-me/helpers/strings';
import { colors, position } from '@rainbow-me/styles';

const Button = styled(Centered).attrs({
  scaleTo: 0.9,
})`
  height: ${({ size }) => (size === 'big' ? 56 : 46)};
  z-index: 1;
`;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})`
  padding-bottom: ${({ label }) => (containsEmoji(label) ? 5.5 : 4)};
  padding-horizontal: 19;
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
  weight = 'semibold',
  ...props
}) => {
  const shadowsForButtonColor = useMemo(() => {
    const isWhite = color === colors.white;

    return [
      [0, 10, 30, colors.dark, isWhite ? 0.12 : 0.2],
      [0, 5, 15, isWhite ? colors.dark : color, isWhite ? 0.08 : 0.4],
    ];
  }, [color]);

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
      <Content label={label} size={size}>
        {emoji && <Emoji lineHeight={23} name={emoji} size="medium" />}
        {icon && <Icon color="white" height={18} name={icon} size={18} />}
        <Text
          align="center"
          color={textColor}
          size={size === 'big' ? 'larger' : 'large'}
          weight={weight}
        >
          {label}
        </Text>
      </Content>
    </Button>
  );
};

export default React.memo(SheetActionButton);
