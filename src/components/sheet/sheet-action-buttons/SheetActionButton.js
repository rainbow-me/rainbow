import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered, InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';
import { colors, position } from '@rainbow-me/styles';

const Button = styled(Centered).attrs({
  scaleTo: 0.9,
})`
  height: ${({ size }) => (size === 'big' ? 56 : 46)};
  z-index: 1;
`;

function containsEmoji(str) {
  var ranges = [
    '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])', // U+1F680 to U+1F6FF
  ];
  if (str.match(ranges.join('|'))) {
    return true;
  } else {
    return false;
  }
}

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
        {icon && <Icon color="white" name={icon} size={18} height={18} />}
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
