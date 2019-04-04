import React from 'react';
import { colors } from '../../styles';
import Text from './Text';

const textProps = {
  color: colors.blueGreyDark,
  opacity: 0.6,
  size: 'h5',
  weight: 'semibold',
};

const Label = props => (
  <Text
    {...textProps}
    {...props}
  />
);

Label.textProps = textProps;

export default Label;
