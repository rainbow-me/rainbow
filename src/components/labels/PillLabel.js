import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { TouchableOpacity } from 'react-native';

import { Centered } from '../layout';
import { colors, fonts, padding, shadow } from '../../styles';
import { Icon } from '../icons';

const Container = styled(Centered)`
  ${padding(0, 12)}
  ${shadow.build(0, 0, 0, colors.alpha(colors.dark, 0.1))}
  background-color: ${props => props.backgroundColor || colors.white}
  border-radius: 15px;
  height: 30px;
`;

const LabelIcon = styled(Icon).attrs({
  color: props => colors.alpha(props.color || colors.blueGreyLight, 0.8),
  height: 14,
  width: 14,
})`
  margin-right: 6px;
`;

const Label = styled.Text`
  color: ${props => colors.alpha(props.color || colors.blueGreyLight, 0.8)};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.medium};
  font-weight: ${fonts.weight.medium};
`;

const PillLabel = ({
  children,
  color,
  icon,
  onPress,
}) => (
  <Container component={TouchableOpacity} onPress={onPress} activeOpacity={onPress ? 0.25 : 1}>
    {icon ? <LabelIcon color={color} name={icon} /> : null}
    <Label color={color}>{children}</Label>
  </Container>
);

PillLabel.propTypes = {
  children: PropTypes.any,
  color: PropTypes.string,
  icon: PropTypes.string,
  onPress: PropTypes.func,
};

export default PillLabel;
