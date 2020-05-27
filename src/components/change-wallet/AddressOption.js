import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';

const Container = styled(ButtonPressAnimation).attrs({ scaleTo: 0.98 })`
  flex-direction: row;
  align-items: center;
`;

const Label = styled(Text).attrs(({ editMode }) => ({
  color: editMode ? colors.alpha(colors.blueGreyDark, 0.2) : colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'lmedium',
  weight: 'semibold',
}))`
  ${padding(9.5, 19)};
  margin-bottom: 9.5;
`;

export default function AddressOption({ editMode, label, onPress }) {
  return (
    <Container disabled={editMode} onPress={onPress}>
      <Label editMode={editMode}>{label}</Label>
    </Container>
  );
}

AddressOption.propTypes = {
  label: PropTypes.string,
  onPress: PropTypes.func,
};
