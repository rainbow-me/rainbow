import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 6,
})`
  ${padding(8, 9)};
  background-color: ${colors.white};
`;

const ProfileAction = ({
  icon,
  iconSize,
  onPress,
  text,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress} {...props}>
    <Container>
      <Icon
        color={colors.appleBlue}
        name={icon}
        style={{ maxHeight: iconSize }}
      />
      <Text
        color="appleBlue"
        size="lmedium"
        weight="semibold"
      >
        {text}
      </Text>
    </Container>
  </ButtonPressAnimation>
);

ProfileAction.propTypes = {
  icon: Icon.propTypes.name,
  iconSize: PropTypes.number,
  onPress: PropTypes.func,
  text: PropTypes.string,
};

ProfileAction.defaultProps = {
  iconSize: 16,
};

export default pure(ProfileAction);
