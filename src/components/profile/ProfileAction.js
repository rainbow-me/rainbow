import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';

const ProfileAction = ({
  icon,
  iconSize,
  onPress,
  text,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress} {...props}>
    <Row
      align="center"
      css={`
        ${padding(8, 9)};
        background-color: ${colors.white};
      `}
    >
      <Icon
        color={colors.appleBlue}
        name={icon}
        style={{
          marginRight: 6,
          maxHeight: iconSize,
        }}
      />
      <Text color="appleBlue" weight="semibold">
        {text}
      </Text>
    </Row>
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
