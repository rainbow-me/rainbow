import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import { onlyUpdateForPropTypes } from 'recompact';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';

const ProfileAction = ({
  icon,
  maxHeight,
  text,
  ...props
}) => (
  <Row align="center" component={BorderlessButton} {...props}>
    <Icon
      color={colors.appleBlue}
      name={icon}
      style={{
        marginRight: 6,
        maxHeight,
      }}
    />
    <Text color="appleBlue" weight="semibold">
      {text}
    </Text>
  </Row>
);

ProfileAction.propTypes = {
  icon: Icon.propTypes.name,
  maxHeight: PropTypes.number,
  text: PropTypes.string,
};

ProfileAction.defaultProps = {
  maxHeight: 16,
};

export default onlyUpdateForPropTypes(ProfileAction);
