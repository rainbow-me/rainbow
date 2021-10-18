import styled from 'styled-components';
import Text from './Text';

const H1 = styled(Text).attrs(
  ({
    letterSpacing = 'rounded',
    weight = 'heavy',
    color,
    theme: { colors },
  }) => ({
    color: color || colors.dark,
    letterSpacing,
    size: 'big',
    weight,
  })
)``;

export default H1;
