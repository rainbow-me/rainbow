import PropTypes from 'prop-types';
import React from 'react';
import { compose, setPropTypes, withHandlers } from 'recompact';
import styled from 'styled-components';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import { ListItem } from '../list';

const CheckmarkSize = 20;
const Checkmark = styled(Icon).attrs({
  color: colors.appleBlue,
  name: 'checkmarkCircled',
})`
  ${position.size(CheckmarkSize)}
`;

const CheckmarkContainer = styled(Centered)`
  ${position.size(CheckmarkSize)}
  flex-shrink: 0;
`;

const RadioListItem = ({ onPress, selected, ...props }) => (
  <ListItem onPress={onPress} {...props}>
    <CheckmarkContainer>
      {selected && <Checkmark />}
    </CheckmarkContainer>
  </ListItem>
);

export default compose(
  setPropTypes({
    ...ListItem.propTypes,
    onPress: PropTypes.func.isRequired,
    selected: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  }),
  withHandlers({
    onPress: ({ onPress, value }) => () => onPress(value),
  }),
)(RadioListItem);
