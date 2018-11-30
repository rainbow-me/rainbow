import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { Centered } from '../layout';
import { TouchableRow } from '../touchable-row';

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

const RadioListItem = ({ selected, ...props }) => (
  <TouchableRow {...props}>
    <CheckmarkContainer>
      {selected && <Checkmark />}
    </CheckmarkContainer>
  </TouchableRow>
);

RadioListItem.propTypes = {
  ...TouchableRow.propTypes,
  selected: PropTypes.bool,
};

export default RadioListItem;
