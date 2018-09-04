import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';

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
  color: props => colors.alpha(props.textColor || colors.blueGreyLight, 0.8),
})`
  margin-right: 6px;
  height: 14px;
  width: 14px;
`;

const Label = styled.Text`
  color: ${props => colors.alpha(props.textColor || colors.blueGreyLight, 0.8)};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.medium};
  font-weight: ${fonts.weight.medium};
`;

const PillLabel = ({ children, icon }) => (
  <Container>
    {icon ? <LabelIcon name={icon} /> : null}
    <Label>{children}</Label>
  </Container>
);

PillLabel.propTypes = {
  children: PropTypes.any,
  icon: PropTypes.string,
};

export default PillLabel;
