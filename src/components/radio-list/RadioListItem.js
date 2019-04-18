import PropTypes from 'prop-types';
import React from 'react';
import { withHandlers } from 'recompact';
import styled from 'styled-components';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import { ListItem } from '../list';

const CheckmarkSize = 20;

const CheckmarkContainer = styled(Centered)`
  ${position.size(CheckmarkSize)};
  flex-shrink: 0;
`;

const RadioListItem = ({
  disabled,
  onPress,
  selected,
  ...props
}) => (
  <ListItem
    opacity={disabled ? 0.420 : 1}
    onPress={onPress}
    {...props}
  >
    <CheckmarkContainer>
      {selected && (
        <Icon
          color={colors.appleBlue}
          css={position.size(CheckmarkSize)}
          name="checkmarkCircled"
        />
      )}
    </CheckmarkContainer>
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
