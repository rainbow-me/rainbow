import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../../styles';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';

const Button = styled(ButtonPressAnimation).attrs({ scaleTo: 0.96 })`
  ${position.centered};
  flex: 1;
  z-index: 1;
`;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})`
  ${padding(10, 14, 14, 15)}
  height: 46;
  z-index: 1;
`;

const SheetActionButton = ({
  borderRadius,
  color,
  emoji,
  icon,
  label,
  textColor,
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
    <Button {...props}>
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        shadows={shadowsForButtonColor}
      />
      <Content>
        {emoji && <Emoji lineHeight={23} name={emoji} size="medium" />}
        {icon && <Icon color="white" name={icon} size={18} height={18} />}
        <Text align="center" color={textColor} size="large" weight="semibold">
          {label}
        </Text>
      </Content>
      <InnerBorder radius={borderRadius} />
    </Button>
  );
};

SheetActionButton.propTypes = {
  borderRadius: PropTypes.number,
  color: PropTypes.string,
  emoji: PropTypes.string,
  textColor: PropTypes.string,
};

SheetActionButton.defaultProps = {
  borderRadius: 50,
  color: 'appleBlue',
  textColor: 'white',
};

export default SheetActionButton;
