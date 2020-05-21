import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import Text from './Text';

const labelStyles = {
  color: colors.blueGreyDark,
  opacity: 0.6,
  size: 'h5',
  weight: 'semibold',
};

const Label = styled(Text).attrs(labelStyles)``;
Label.textProps = labelStyles;
export default Label;
