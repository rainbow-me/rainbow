import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { colors, fonts } from '../../styles';

const Container = styled(TouchableOpacity)`
  background-color: ${({ selected }) => (selected ? colors.black : colors.white)};
  border-radius: 12;
  padding-bottom: 8;
  padding-left: 11;
  padding-right: 11;
  padding-top: 7;
`;

const Label = styled.Text`
  color: ${({ color }) => color};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.medium};
  font-weight: ${fonts.weight.semibold};
`;

const Tab = ({ label, onPress, selected }) => (
  <Container
    accessibilityLabel={label}
    onPress={() => onPress(label)}
    selected={selected}
  >
    <Label color={selected ? colors.white : colors.grey}>{label}</Label>
  </Container>
);

Tab.propTypes = {
  label: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  selected: PropTypes.bool,
};

export default Tab;
