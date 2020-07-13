import PropTypes from 'prop-types';
import React from 'react';
import { withHandlers } from 'recompact';
import styled from 'styled-components';
import Icon from '../icons/Icon';
import { ListItem } from '../list';
import { colors } from '@rainbow-me/styles';

const CheckmarkIcon = styled(Icon).attrs({
  color: colors.appleBlue,
  name: 'checkmarkCircled',
})`
  box-shadow: 0px 4px 6px ${colors.alpha(colors.appleBlue, 0.4)};
  margin-bottom: 1px;
  position: absolute;
  right: 0;
`;

const RadioListItem = ({ disabled, onPress, selected, ...props }) => (
  <ListItem onPress={onPress} opacity={disabled ? 0.42 : 1} {...props}>
    {selected && <CheckmarkIcon />}
  </ListItem>
);

RadioListItem.propTypes = {
  ...ListItem.propTypes,
  disabled: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

export default withHandlers({
  onPress: ({ disabled, onPress, value }) => () => {
    if (onPress && !disabled) {
      onPress(value);
    }
  },
})(RadioListItem);
